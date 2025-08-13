# rainwater_pro.py
"""
Rainwater harvesting estimator with Open-Meteo data, first-flush, roof runoff,
optional tank simulation, and BWSSB billing helpers.

Usage (example):
    from rainwater_pro import rainwater_report
    out = rainwater_report(
        lat=12.9716, lon=77.5946,
        roof_area_m2=120,               # roof catchment area in m²
        roof_type="concrete",           # one of: concrete, tile, metal, asbestos, cgi, custom
        collection_efficiency=0.9,      # piping/filter losses (0-1), default 0.9
        first_flush_mm=1.5,             # mm discarded per rainy day
        monthly_demand_liters=32000,    # baseline monthly demand
        tank_capacity_liters=20000,     # optional storage capacity; simulate tank if set
        connection_type="domestic"      # "domestic" or "non_domestic" (BWSSB)
    )
    print(out["summary"])
    out["monthly_df"].to_csv("monthly_rwh_summary.csv", index=False)
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd

import openmeteo_requests
import requests_cache
from retry_requests import retry

# --------- Constants & reference tables ---------

# Roof runoff coefficients (typical ranges). Sources: IS 15797; NM OSE Guide; literature.
# Concrete roofs tend ~0.7–0.9; clay tile lower; metal highest.
RUNOFF_COEFFICIENTS: Dict[str, float] = {
    "concrete": 0.80,       # IS guideline 0.8–0.95 typical upper bound; 0.8 conservative
    "tile": 0.70,           # clay/ceramic often 0.5–0.75; pick mid/high conservative
    "metal": 0.90,          # metal ~0.9–0.95
    "cgi": 0.90,            # corrugated galvanized iron
    "asbestos": 0.80,
    # You may pass roof_type="custom" and set custom_coefficient in report()
}

# BWSSB (Bengaluru) monthly tariff slabs (₹ per 1000 L) + sanitary + meter fee (15 mm)
# Source: Citizen Matters explainer summarizing BWSSB schedule (Mar 31, 2025).
BWSSB_TARIFFS = {
    "domestic": [
        # (upper_liters_inclusive, water_tariff_rs_per_kl, sanitary_charge, meter_fee_rs)
        # sanitary_charge: number or "25%" => 25% of water_tariff
        (8000,   7,   14, 100),
        (25000, 11, "25%", 50),
        (50000, 26, "25%", 75),
        (float("inf"), 45, "25%", 150),
    ],
    "non_domestic": [
        # Note: Public tables sometimes misprint the second slab range; adjust as needed.
        (10000, 50, "25%",  50),
        (25000, 57,      0, 75),
        (50000, 65,      0, 100),
        (75000, 76,      0, 125),
        (float("inf"), 87, 0, 175),
    ],
}

# --------- Weather fetch ---------

def _default_dates() -> Tuple[str, str]:
    """Return (start_date, end_date) as YYYY-MM-DD for the last full 12 months.
    Open-Meteo historical has ~5-day delay; clamp end to today-5.
    """
    today_utc = datetime.now(timezone.utc).date()
    end_date = today_utc - timedelta(days=5)   # honor 5-day delay
    start_date = end_date - relativedelta(years=1)
    return start_date.isoformat(), end_date.isoformat()

def fetch_openmeteo_daily(lat: float, lon: float,
                          start_date: Optional[str] = None,
                          end_date: Optional[str] = None,
                          timezone_name: str = "auto") -> pd.DataFrame:
    """
    Fetch daily rain_sum and ET0 (FAO-56) from Open-Meteo Historical API.
    Returns a DataFrame with columns: date (tz-aware UTC), rain_mm, et0_mm
    """
    if start_date is None or end_date is None:
        start_date, end_date = _default_dates()

    cache = requests_cache.CachedSession(".cache", expire_after=-1)
    session = retry(cache, retries=5, backoff_factor=0.2)
    om = openmeteo_requests.Client(session=session)

    url = "https://archive-api.open-meteo.com/v1/archive"
    # IMPORTANT: order of 'daily' variables controls indexing in response
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": ["rain_sum", "et0_fao_evapotranspiration"],
        "timezone": timezone_name,
        "cell_selection": "land",
    }
    responses = om.weather_api(url, params=params)
    resp = responses[0]

    daily = resp.Daily()
    # Build datetime index from epoch seconds provided
    date_index = pd.date_range(
        start=pd.to_datetime(daily.Time(), unit="s", utc=True),
        end=pd.to_datetime(daily.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=daily.Interval()),
        inclusive="left",
    )
    # Index 0 -> rain_sum, Index 1 -> et0_fao_evapotranspiration (must match 'daily' order)
    rain = daily.Variables(0).ValuesAsNumpy()
    et0 = daily.Variables(1).ValuesAsNumpy()

    df = pd.DataFrame(
        {"date": date_index, "rain_mm": rain.astype(float), "et0_mm": et0.astype(float)}
    )
    return df

# --------- Harvest model ---------

@dataclass
class HarvestConfig:
    roof_area_m2: float
    roof_type: str = "concrete"
    collection_efficiency: float = 0.90   # filter/piping losses (0-1)
    first_flush_mm: float = 1.5           # mm per rainy day to discard
    custom_coefficient: Optional[float] = None

def _roof_coefficient(roof_type: str, custom: Optional[float]) -> float:
    if roof_type == "custom":
        if not custom:
            raise ValueError("custom_coefficient must be provided when roof_type='custom'.")
        return float(custom)
    if roof_type not in RUNOFF_COEFFICIENTS:
        raise ValueError(f"Unknown roof_type '{roof_type}'. Choose from {list(RUNOFF_COEFFICIENTS)} or 'custom'.")
    return RUNOFF_COEFFICIENTS[roof_type]

def compute_daily_capture(df_daily: pd.DataFrame, cfg: HarvestConfig) -> pd.DataFrame:
    """
    Compute daily captured liters from rain (after first-flush & losses).
    1 mm rain over 1 m² = 1 liter (rule-of-thumb).
    """
    c_r = _roof_coefficient(cfg.roof_type, cfg.custom_coefficient)
    d = df_daily.copy()
    # Apply first-flush once per rainy day
    rain_after_ff = np.where(d["rain_mm"] > 0, np.maximum(0.0, d["rain_mm"] - cfg.first_flush_mm), 0.0)
    # Captured mm after roof runoff coefficient and collection efficiency
    captured_mm = rain_after_ff * c_r * cfg.collection_efficiency
    # Convert to liters by multiplying roof area (1 mm × 1 m² = 1 L)
    d["captured_liters"] = captured_mm * cfg.roof_area_m2
    d["rain_after_ff_mm"] = rain_after_ff
    d["runoff_coeff_used"] = c_r
    d["collection_eff_used"] = cfg.collection_efficiency
    return d

# --------- Tank simulation (optional) ---------

@dataclass
class TankConfig:
    tank_capacity_liters: float
    monthly_demand_liters: float = 32000.0  # baseline monthly demand
    # If you want daily demand, we derive it from monthly evenly:
    def daily_demand(self) -> float:
        return self.monthly_demand_liters / 30.437  # avg days per month

def simulate_tank(daily_df: pd.DataFrame, tank_cfg: TankConfig) -> pd.DataFrame:
    """
    Simple daily mass-balance tank simulation.
    - Inflow: captured_liters
    - Outflow: fixed daily demand (derived from monthly demand)
    - Storage bounded [0, capacity]; overflow counted when storage would exceed capacity.
    """
    d = daily_df.copy().reset_index(drop=True)
    capacity = float(tank_cfg.tank_capacity_liters)
    demand = float(tank_cfg.daily_demand())

    storage = 0.0
    storages = []
    overflows = []
    deficits = []
    delivered = []

    for inflow in d["captured_liters"].to_numpy():
        storage += inflow
        overflow = max(0.0, storage - capacity)
        if overflow > 0:
            storage = capacity
        # withdraw demand
        deliver = min(storage, demand)
        storage -= deliver
        deficit = max(0.0, demand - deliver)

        storages.append(storage)
        overflows.append(overflow)
        deficits.append(deficit)
        delivered.append(deliver)

    d["tank_storage_liters"] = storages
    d["overflow_liters"] = overflows
    d["delivered_liters"] = delivered
    d["unmet_demand_liters"] = deficits
    d["daily_demand_liters"] = demand
    return d

# --------- Billing helpers (BWSSB default) ---------

def _slab_charge(liters: float, slabs) -> Tuple[float, float]:
    """
    Return (water_charge_rs, sanitary_rs) given liters and slab table.
    Slab tuple: (upper_liters_inclusive, water_tariff_rs_per_kl, sanitary_charge, meter_fee_rs)
    sanitary_charge: numeric OR "25%" meaning 25% of water tariff (per 1000 L).
    """
    water_rs = 0.0
    sanitary_rs = 0.0
    remaining = float(liters)
    lower = 0.0

    for upper, tariff, sanitary, _meter in slabs:
        span = min(remaining, upper - lower)
        if span <= 0:
            continue
        kl = span / 1000.0
        water_rs += tariff * kl
        # sanitary charge logic
        if isinstance(sanitary, str) and sanitary.endswith("%"):
            sanitary_pct = float(sanitary.strip("%")) / 100.0
            sanitary_rs += (tariff * sanitary_pct) * kl
        else:
            # Flat sanitary charge is typically per month per slab (interpretation varies).
            # We’ll pro-rate by consumption span to keep it usage-linked.
            sanitary_rs += float(sanitary) * (kl / max(1.0, (upper - lower) / 1000.0))
        remaining -= span
        lower = upper
        if remaining <= 0:
            break
    return water_rs, sanitary_rs

def bwssb_bill(liters: float, connection_type: str = "domestic") -> Dict[str, float]:
    slabs = BWSSB_TARIFFS["domestic" if connection_type == "domestic" else "non_domestic"]
    water_rs, sanitary_rs = _slab_charge(liters, slabs)
    # Meter fee: pick the meter fee of the LAST slab used (simplest, conservative)
    last_meter_fee = next(m for u, t, s, m in slabs if u >= min(liters, 1e12))
    total = water_rs + sanitary_rs + last_meter_fee
    return {
        "water_rs": round(water_rs, 2),
        "sanitary_rs": round(sanitary_rs, 2),
        "meter_fee_rs": round(last_meter_fee, 2),
        "total_rs": round(total, 2),
    }

# --------- Public API ---------

def rainwater_report(
    lat: float,
    lon: float,
    roof_area_m2: float,
    roof_type: str = "concrete",
    collection_efficiency: float = 0.90,
    first_flush_mm: float = 1.5,
    monthly_demand_liters: float = 32000.0,
    tank_capacity_liters: Optional[float] = None,
    connection_type: str = "domestic",
    custom_coefficient: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, object]:
    """
    One-call end-to-end:
    - Fetch last 12 months (or custom) daily data
    - Compute captured liters (first flush + losses)
    - Optional tank simulation
    - Monthly aggregation + BWSSB bill with and without RWH offset
    Returns dict with 'daily_df', 'monthly_df', 'summary'
    """
    weather = fetch_openmeteo_daily(lat, lon, start_date, end_date)
    cfg = HarvestConfig(
        roof_area_m2=roof_area_m2,
        roof_type=roof_type,
        collection_efficiency=collection_efficiency,
        first_flush_mm=first_flush_mm,
        custom_coefficient=custom_coefficient,
    )
    daily = compute_daily_capture(weather, cfg)

    # Optional tank simulation + define net_from_tank for billing offset
    if tank_capacity_liters:
        tanked = simulate_tank(daily, TankConfig(tank_capacity_liters, monthly_demand_liters))
        daily = tanked
        # Delivered water from RWH offsets metered demand
        daily["offset_liters"] = daily["delivered_liters"]
    else:
        daily["offset_liters"] = daily["captured_liters"]

    # Monthly aggregation
    daily["month"] = daily["date"].dt.tz_convert("UTC").dt.to_period("M").dt.to_timestamp()
    monthly = daily.groupby("month").agg(
        rain_mm=("rain_mm", "sum"),
        rain_days=("rain_mm", lambda s: int((s > 0).sum())),
        et0_mm=("et0_mm", "sum"),
        captured_liters=("captured_liters", "sum"),
        offset_liters=("offset_liters", "sum"),
        overflow_liters=("overflow_liters", "sum") if "overflow_liters" in daily else ("captured_liters", lambda _: 0.0),
        unmet_demand_liters=("unmet_demand_liters", "sum") if "unmet_demand_liters" in daily else ("captured_liters", lambda _: 0.0),
    ).reset_index()

    # Billing & savings (baseline vs net after offset; clamp at 0)
    baseline_bill = []
    net_bill = []
    savings_rs = []
    for _, row in monthly.iterrows():
        baseline = bwssb_bill(monthly_demand_liters, connection_type)
        net_usage = max(0.0, monthly_demand_liters - row["offset_liters"])
        net = bwssb_bill(net_usage, connection_type)
        baseline_bill.append(baseline["total_rs"])
        net_bill.append(net["total_rs"])
        savings_rs.append(round(baseline["total_rs"] - net["total_rs"], 2))
    monthly["baseline_bill_rs"] = baseline_bill
    monthly["net_bill_rs"] = net_bill
    monthly["savings_rs"] = savings_rs

    # Totals & performance
    total_captured = float(monthly["captured_liters"].sum())
    total_offset = float(monthly["offset_liters"].sum())
    total_savings = float(monthly["savings_rs"].sum())
    reliability = None
    coverage_pct = None
    if "unmet_demand_liters" in daily:
        total_demand = monthly_demand_liters * len(monthly)
        met = total_demand - float(monthly["unmet_demand_liters"].sum())
        reliability = round(100.0 * (met / total_demand), 2)
        coverage_pct = round(100.0 * (total_offset / total_demand), 2)

    summary = {
        "coords": {"lat": lat, "lon": lon},
        "period": {"start": weather["date"].min().date().isoformat(),
                   "end": weather["date"].max().date().isoformat()},
        "roof": {
            "area_m2": roof_area_m2,
            "roof_type": roof_type,
            "runoff_coeff": _roof_coefficient(roof_type, custom_coefficient),
            "collection_efficiency": collection_efficiency,
            "first_flush_mm": first_flush_mm,
        },
        "totals": {
            "captured_liters": round(total_captured, 2),
            "offset_liters": round(total_offset, 2),
            "overflow_liters": round(float(monthly["overflow_liters"].sum()), 2) if "overflow_liters" in monthly else 0.0,
            "savings_rs": round(total_savings, 2),
        },
        "tank": {
            "enabled": bool(tank_capacity_liters),
            "capacity_liters": tank_capacity_liters or 0.0,
            "reliability_pct": reliability,
            "coverage_pct": coverage_pct,
        },
        "billing": {
            "connection_type": connection_type,
            "baseline_total_rs": round(float(monthly["baseline_bill_rs"].sum()), 2),
            "net_total_rs": round(float(monthly["net_bill_rs"].sum()), 2),
        },
    }

    # Tidy daily columns ordering
    daily_cols = [c for c in [
        "date","rain_mm","et0_mm","rain_after_ff_mm","captured_liters","offset_liters",
        "tank_storage_liters" if "tank_storage_liters" in daily else None,
        "overflow_liters" if "overflow_liters" in daily else None,
        "unmet_demand_liters" if "unmet_demand_liters" in daily else None,
        "daily_demand_liters" if "daily_demand_liters" in daily else None,
    ] if c]
    return {"daily_df": daily[daily_cols].copy(),
            "monthly_df": monthly.copy(),
            "summary": summary}
