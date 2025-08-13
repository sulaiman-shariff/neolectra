# solar_layout.py — final
from __future__ import annotations
import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, box
from shapely import affinity
from shapely.ops import unary_union

# -----------------------------
# Panel specs (meters): typical industry sizes
# -----------------------------
PANEL_SPECS: Dict[str, Dict] = {
    "tiny":   {"L_m": 1.70,  "W_m": 1.00,  "watt_nom": 340},  # 60-cell/120HC
    "small":  {"L_m": 2.00,  "W_m": 1.00,  "watt_nom": 400},  # 72-cell/144HC
    "medium": {"L_m": 2.278, "W_m": 1.134, "watt_nom": 520},  # 182mm/144HC
    "large":  {"L_m": 2.384, "W_m": 1.303, "watt_nom": 620},  # 210mm/132HC
}

# -----------------------------
# Config & results
# -----------------------------
@dataclass
class LayoutParams:
    panel_size: str = "medium"
    fill_pct: float = 50.0
    spacing_m: float = 0.12
    edge_clearance_m: float = 0.25
    min_boundary_clearance_m: float = 0.50
    obstacle_clearance_m: float = 0.25
    obstacle_mode: str = "auto"
    angle_deg: Optional[float] = None

    fill_relative_to: str = "usable"   # "usable" | "roof"
    overshoot_tolerance_frac: float = 0.20  # allow up to 20% of one-panel area over target

@dataclass
class LayoutResult:
    annotated_bgr: np.ndarray
    mask: np.ndarray
    panel_polys_xy: List[np.ndarray]
    stats: Dict

# -----------------------------
# Image/geometry utilities
# -----------------------------
def _to_bgr(img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)

def _largest_contour_mask(gray: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Otsu -> closing -> largest external contour -> filled mask."""
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if np.mean(th) < 127:
        th = cv2.bitwise_not(th)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=2)
    cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        raise ValueError("No roof contour found")
    cnt = max(cnts, key=cv2.contourArea)
    mask = np.zeros_like(th)
    cv2.drawContours(mask, [cnt], -1, 255, thickness=cv2.FILLED)
    return mask, cnt

def _contour_polygon(contour: np.ndarray) -> Polygon:
    """Use the true (possibly concave) polygon (no convex hull)."""
    epsilon = 0.01 * cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
    pts = approx if len(approx) >= 3 else contour.reshape(-1, 2)
    return Polygon(pts)

def _roof_orientation_deg(contour: np.ndarray) -> float:
    """Use minAreaRect long-side orientation."""
    rect = cv2.minAreaRect(contour)
    angle = rect[-1]
    w, h = rect[1]
    return float(angle if w < h else angle + 90)

def _estimate_LW_from_area(area_m2: float, contour: np.ndarray) -> Tuple[float, float]:
    rect = cv2.minAreaRect(contour)
    wpx, hpx = rect[1]
    r = (max(wpx, hpx) / max(1e-6, min(wpx, hpx))) if (wpx > 0 and hpx > 0) else 1.0
    L = math.sqrt(area_m2 * r)
    W = area_m2 / L
    return float(L), float(W)

def _m_per_px_from_area(roof_area_m2: float, mask: np.ndarray) -> float:
    area_px = float(cv2.countNonZero(mask))
    if area_px == 0:
        raise ValueError("Roof mask area is zero")
    return math.sqrt(roof_area_m2 / area_px)

def _poly_to_int_xy(poly: Polygon) -> np.ndarray:
    return np.array(list(poly.exterior.coords), dtype=np.int32)

# -----------------------------
# Obstacles (shadows/objects & elevation edges)
# -----------------------------
def _obstacle_polys(
    bgr: np.ndarray,
    roof_mask: np.ndarray,
    px_per_m: float,
    obstacle_clearance_m: float,
    mode: str = "auto",   # "auto" | "light"
) -> List[Polygon]:
    """
    Obstacles from:
      - dark/shadowy regions (HSV V-quantile within roof),
      - edge density (Canny + box filter),
      - gradient magnitude (Sobel), catching interior elevation boundaries.
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    V = cv2.GaussianBlur(hsv[:, :, 2], (5, 5), 0)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    vals = V[roof_mask > 0]
    if vals.size == 0:
        return []

    # thresholds (light mode is more conservative = fewer obstacles)
    q_dark = 0.30 if mode == "light" else 0.35
    edge_box = 5 if mode == "light" else 7
    edge_cut = 0.18 if mode == "light" else 0.12
    grad_q  = 0.88 if mode == "light" else 0.82  # high gradients treated as obstacles

    # 1) Dark/shadow mask
    thr = np.quantile(vals, q_dark)
    dark = (V < thr).astype(np.uint8) * 255

    # 2) Edge-density mask
    edges = cv2.Canny(V, 80, 160)
    edges = cv2.bitwise_and(edges, roof_mask)
    ed_density = cv2.boxFilter((edges > 0).astype(np.float32), ddepth=-1, ksize=(edge_box, edge_box))
    ed_mask = (ed_density > edge_cut).astype(np.uint8) * 255

    # 3) Gradient magnitude (interior elevation edges)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = cv2.magnitude(gx, gy)
    # normalize inside roof only
    mvals = mag[roof_mask > 0]
    gthr = np.quantile(mvals, grad_q) if mvals.size else np.inf
    grad_mask = ((mag >= gthr) & (roof_mask > 0)).astype(np.uint8) * 255

    # Combine & keep only inside roof
    obst = cv2.bitwise_or(dark, ed_mask)
    obst = cv2.bitwise_or(obst, grad_mask)
    obst = cv2.bitwise_and(obst, roof_mask)

    # Remove tiny specks
    num, labels, stats, _ = cv2.connectedComponentsWithStats(obst, connectivity=8)
    keep = np.zeros_like(obst)
    min_area_px = int((0.25 * px_per_m) ** 2)  # ≥25cm x 25cm
    for i in range(1, num):
        if stats[i, cv2.CC_STAT_AREA] >= min_area_px:
            keep[labels == i] = 255

    # Dilate by clearance
    obs_px = max(1, int(round(obstacle_clearance_m * px_per_m)))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * obs_px + 1, 2 * obs_px + 1))
    keep = cv2.dilate(keep, kernel, iterations=1)

    # Polygons
    cnts, _ = cv2.findContours(keep, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys: List[Polygon] = []
    for c in cnts:
        if cv2.contourArea(c) < min_area_px:
            continue
        eps = 0.01 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(approx) >= 3:
            polys.append(Polygon(approx))
    return polys

# -----------------------------
# Packing helpers
# -----------------------------
def _pack_grid(
    poly: Polygon,
    pW_px: float, pL_px: float,
    spacing_px: float,
    target_area_px: float,
    offsets: List[Tuple[float, float]],
    overshoot_tol_area_px: float          # NEW
) -> List[Polygon]:
    """
    Pack a centered grid fully inside `poly`, trying multiple offsets.
    Guarantees rows/cols >=1 if the span can hold a single panel.
    """
    minx, miny, maxx, maxy = poly.bounds
    step_x = pW_px + spacing_px
    step_y = pL_px + spacing_px
    avail_w = max(0.0, maxx - minx)
    avail_h = max(0.0, maxy - miny)

    cols = 0
    rows = 0
    if avail_w >= pW_px:
        cols = 1 + int((avail_w - pW_px) // step_x)
    if avail_h >= pL_px:
        rows = 1 + int((avail_h - pL_px) // step_y)
    if cols <= 0 or rows <= 0:
        return []

    used_w = cols * pW_px + (cols - 1) * spacing_px
    used_h = rows * pL_px + (rows - 1) * spacing_px
    base_x = minx + (avail_w - used_w) / 2.0
    base_y = miny + (avail_h - used_h) / 2.0

    best: List[Polygon] = []
    best_area = 0.0
    p_area = pW_px * pL_px                # NEW: single panel area

    for offx, offy in offsets:
        placed: List[Polygon] = []
        covered_px = 0.0
        y = base_y + offy
        for _ in range(rows):
            x = base_x + offx
            for _ in range(cols):
                rect = box(x, y, x + pW_px, y + pL_px)

                # respect hard cap: if placing this panel would overshoot "too much", skip it
                if target_area_px > 0:
                    next_area = covered_px + p_area
                    if (next_area > target_area_px) and ((next_area - target_area_px) > overshoot_tol_area_px):
                        x += step_x
                        continue

                if rect.within(poly.buffer(-1e-6)):
                    placed.append(rect)
                    covered_px += p_area
                    if target_area_px > 0 and covered_px >= target_area_px:
                        break
                x += step_x
            if target_area_px > 0 and covered_px >= target_area_px:
                break
            y += step_y
        area = sum(r.area for r in placed)
        if area > best_area:
            best, best_area = placed, area
    return best

# -----------------------------
# Try one angle/orientation combo
# -----------------------------
def _try_angle_pack(
    roof_poly: Polygon,
    rot_center: Tuple[float, float],
    angle_deg: float,
    px_per_m: float,
    edge_clearance_m_eff: float,
    spacing_px: float,
    target_fill_frac: float,                 # CHANGED: fraction (0..1), not pixels
    panel_dims_m: Tuple[float, float],
    subtractor=None,
    roof_area_px: float = 0.0,               # NEW: for roof-relative targeting
    fill_relative_to: str = "usable",        # NEW
    overshoot_tolerance_frac: float = 0.20   # NEW
) -> Tuple[List[Polygon], Tuple[float, float], float, float, float]:
    """
    Returns: (panels, dims_used, usable_area_px, placed_area_px, target_area_px)
    """
    poly_rot = affinity.rotate(roof_poly, -angle_deg, origin=rot_center, use_radians=False)
    poly_rot = poly_rot.buffer(-(edge_clearance_m_eff * px_per_m))
    if poly_rot.is_empty:
        return [], panel_dims_m, 0.0, 0.0, 0.0

    if subtractor is not None:
        usable = subtractor(poly_rot)
        if usable.is_empty:
            return [], panel_dims_m, 0.0, 0.0, 0.0
        poly_rot = usable

    usable_area_px = float(poly_rot.area)
    # decide target area now, after we know the usable shape
    if fill_relative_to == "roof" and roof_area_px > 0:
        target_area_px = roof_area_px * target_fill_frac
    else:  # "usable"
        target_area_px = usable_area_px * target_fill_frac

    def pack_all_parts(pW_px: float, pL_px: float) -> List[Polygon]:
        offsets = [
            (0.0, 0.0),
            (0.5 * (pW_px + spacing_px), 0.0),
            (0.0, 0.5 * (pL_px + spacing_px)),
            (0.5 * (pW_px + spacing_px), 0.5 * (pL_px + spacing_px)),
        ]
        parts = list(poly_rot.geoms) if hasattr(poly_rot, "geoms") else [poly_rot]
        placed_all: List[Polygon] = []
        remaining = target_area_px
        for part in parts:
            placed = _pack_grid(
                part, pW_px, pL_px, spacing_px,
                remaining, offsets,
                overshoot_tol_area_px = (pW_px * pL_px * overshoot_tolerance_frac)
            )
            placed_all.extend(placed)
            remaining -= sum(r.area for r in placed)
            if remaining <= 0:
                break
        return placed_all

    Lm, Wm = panel_dims_m
    placed_p = pack_all_parts(Wm * px_per_m, Lm * px_per_m)
    placed_l = pack_all_parts(Lm * px_per_m, Wm * px_per_m)

    if sum(r.area for r in placed_l) > sum(r.area for r in placed_p):
        placed = placed_l
        dims_used = (Wm, Lm)
    else:
        placed = placed_p
        dims_used = (Lm, Wm)

    placed_back = [affinity.rotate(p, angle_deg, origin=rot_center, use_radians=False) for p in placed]
    placed_area_px = float(sum(p.area for p in placed))
    return placed_back, dims_used, usable_area_px, placed_area_px, target_area_px

# -----------------------------
# Main entry
# -----------------------------
def layout_panels(
    img: Image.Image,
    roof_area_m2: float,
    roof_length_m: Optional[float] = None,
    roof_width_m: Optional[float] = None,
    params: LayoutParams = LayoutParams()
) -> LayoutResult:

    assert 30 <= params.fill_pct <= 90, "fill_pct must be between 30 and 90"
    if params.panel_size not in PANEL_SPECS:
        raise ValueError(f"panel_size must be one of {list(PANEL_SPECS.keys())}")

    warnings: List[str] = []

    # 0) image + gray (resize long side ≤ 1024)
    bgr = _to_bgr(img)
    H, W = bgr.shape[:2]
    s = 1024.0 / max(H, W) if max(H, W) > 1024 else 1.0
    if s != 1.0:
        bgr = cv2.resize(bgr, (int(W * s), int(H * s)), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # 1) roof mask & polygon
    mask, contour = _largest_contour_mask(gray)
    roof_poly = _contour_polygon(contour)

    # 2) infer L/W if missing
    if roof_length_m is None or roof_width_m is None:
        est_L, est_W = _estimate_LW_from_area(roof_area_m2, contour)
        roof_length_m = est_L if roof_length_m is None else roof_length_m
        roof_width_m  = est_W if roof_width_m is None else roof_width_m

    # 3) pixel scale
    m_per_px = _m_per_px_from_area(roof_area_m2, mask)
    px_per_m = 1.0 / m_per_px

    # 4) angles to try
    roof_axis = _roof_orientation_deg(contour)
    angles_to_try: List[float] = []
    if params.angle_deg is not None:
        angles_to_try.extend([params.angle_deg, params.angle_deg + 90, params.angle_deg + 5, params.angle_deg - 5])
    angles_to_try.extend([roof_axis, roof_axis + 90, roof_axis + 5, roof_axis - 5])
    angles_to_try = [((a % 180) + 180) % 180 for a in angles_to_try]

    # 5) effective boundary ring (parapet band)
    edge_clearance_m_eff = max(params.edge_clearance_m, params.min_boundary_clearance_m)

    # 6) obstacle polygons (with fallbacks)
    def rotated_obs_union(angle: float) -> Optional[Polygon]:
        if params.obstacle_mode == "off":
            return None
        modes = ["auto", "light"] if params.obstacle_mode == "auto" else [params.obstacle_mode]
        obs_img: List[Polygon] = []
        for m in modes:
            obs_img = _obstacle_polys(bgr, mask, px_per_m, params.obstacle_clearance_m, mode=m)
            if obs_img:
                break
        if not obs_img:
            return None
        obs_rot = [affinity.rotate(p, -angle, origin=(mask.shape[1]/2.0, mask.shape[0]/2.0), use_radians=False)
                   for p in obs_img]
        return unary_union([p.buffer(0) for p in obs_rot])

    # 7) packing loop over angles
    spec = PANEL_SPECS[params.panel_size]
    Lm, Wm = spec["L_m"], spec["W_m"]
    spacing_px = params.spacing_m * px_per_m
    rot_center = (mask.shape[1] / 2.0, mask.shape[0] / 2.0)
    roof_area_px = float(cv2.countNonZero(mask))  # for roof-relative targeting

    best_panels: List[Polygon] = []
    best_dims_used: Tuple[float, float] = (Lm, Wm)
    best_angle_used: float = angles_to_try[0] if angles_to_try else 0.0
    best_usable_px = 0.0
    best_placed_px  = 0.0
    best_target_px  = 0.0
    best_delta      = float("inf")

    for angle in angles_to_try:
        obs_union = rotated_obs_union(angle)

        def subtractor(poly_rot: Polygon) -> Polygon:
            if obs_union is None:
                return poly_rot
            usable = poly_rot.difference(obs_union)
            if usable.is_empty or usable.area < 0.12 * poly_rot.area:
                # relax: shrink obstacle influence
                for frac in (0.75, 0.5, 0.25, 0.0):
                    relax_px = (params.obstacle_clearance_m * px_per_m) * (1.0 - frac)
                    usable = poly_rot.difference(obs_union.buffer(-relax_px))
                    if not usable.is_empty and usable.area >= 0.12 * poly_rot.area:
                        warnings.append("Obstacle mask relaxed to retain sufficient usable area.")
                        break
                if usable.is_empty:
                    warnings.append("Obstacle mask disabled (covered nearly whole roof).")
                    usable = poly_rot
            return usable

        placed, dims_used, usable_px, placed_px, target_px = _try_angle_pack(
            roof_poly=roof_poly,
            rot_center=rot_center,
            angle_deg=angle,
            px_per_m=px_per_m,
            edge_clearance_m_eff=edge_clearance_m_eff,
            spacing_px=spacing_px,
            target_fill_frac=(params.fill_pct / 100.0),
            panel_dims_m=(Lm, Wm),
            subtractor=subtractor,
            roof_area_px=roof_area_px,
            fill_relative_to=params.fill_relative_to,
            overshoot_tolerance_frac=params.overshoot_tolerance_frac
        )

        # choose the angle whose packed area is closest to the target
        delta = abs(placed_px - target_px)
        if delta < best_delta:
            best_panels, best_dims_used, best_angle_used = placed, dims_used, angle
            best_usable_px, best_placed_px, best_target_px = usable_px, placed_px, target_px
            best_delta = delta

    # Last-resort: if still nothing, gently relax spacing & ring (never below 0.3 m ring)
    if not best_panels:
        warnings.append("Packing fallback: reduced spacing and boundary ring for a minimal fit.")
        placed, dims_used, usable_px, placed_px, target_px = _try_angle_pack(
            roof_poly=roof_poly,
            rot_center=rot_center,
            angle_deg=roof_axis,
            px_per_m=px_per_m,
            edge_clearance_m_eff=max(0.30, edge_clearance_m_eff * 0.8),
            spacing_px=max(0.02 * px_per_m, spacing_px * 0.75),
            target_fill_frac=(params.fill_pct / 100.0),
            panel_dims_m=(Lm, Wm),
            subtractor=lambda p: p,  # obstacles off in last resort
            roof_area_px=roof_area_px,
            fill_relative_to=params.fill_relative_to,
            overshoot_tolerance_frac=params.overshoot_tolerance_frac
        )
        best_panels, best_dims_used, best_angle_used = placed, dims_used, roof_axis
        best_usable_px, best_placed_px, best_target_px = usable_px, placed_px, target_px

    polys_xy = [_poly_to_int_xy(p) for p in best_panels]

    # draw overlay
    overlay = bgr.copy()
    for poly in polys_xy:
        cv2.fillPoly(overlay, [poly], (255, 0, 0))
        cv2.polylines(overlay, [poly], True, (40, 40, 40), 2)
    annotated = cv2.addWeighted(bgr, 0.68, overlay, 0.32, 0)

    # stats
    # compute achieved percentages
    # panel area in m² (already correct)
    n = len(polys_xy)
    pL_m_used, pW_m_used = best_dims_used
    panel_area_m2 = pL_m_used * pW_m_used * n

    # convert pixel areas to m² for clarity
    roof_area_m2_from_mask   = (roof_area_px) * (m_per_px ** 2)
    usable_area_m2_from_mask = (best_usable_px) * (m_per_px ** 2)
    placed_area_m2_from_mask = (best_placed_px) * (m_per_px ** 2)
    target_area_m2_from_mask = (best_target_px) * (m_per_px ** 2)

    achieved_pct_of_roof   = 100.0 * (panel_area_m2 / max(1e-9, roof_area_m2_from_mask))
    achieved_pct_of_usable = 100.0 * (panel_area_m2 / max(1e-9, usable_area_m2_from_mask))

    capacity_kWp = (PANEL_SPECS[params.panel_size]["watt_nom"] * n) / 1000.0

    stats = {
        "panel_size": params.panel_size,
        "panel_dims_m": (round(pL_m_used, 3), round(pW_m_used, 3)),
        "watt_nom_per_panel": PANEL_SPECS[params.panel_size]["watt_nom"],
        "panels_count": n,
        "panel_area_m2": round(panel_area_m2, 3),

        "roof_area_m2_input": round(roof_area_m2, 3),
        "roof_area_m2_from_mask": round(roof_area_m2_from_mask, 3),
        "usable_area_m2": round(usable_area_m2_from_mask, 3),

        "fill_relative_to": params.fill_relative_to,
        "fill_target_pct": float(params.fill_pct),
        "target_area_m2_effective": round(target_area_m2_from_mask, 3),

        "fill_achieved_pct_of_roof": round(achieved_pct_of_roof, 2),
        "fill_achieved_pct_of_usable": round(achieved_pct_of_usable, 2),

        "capacity_estimated_kWp": round(capacity_kWp, 3),
        "m_per_px": m_per_px,
        "estimated_roof_LW_m": (round(roof_length_m, 3), round(roof_width_m, 3)),
        "angle_used_deg": round(best_angle_used, 2),
        "spacing_m": float(params.spacing_m),
        "edge_clearance_m": float(params.edge_clearance_m),
        "min_boundary_clearance_m": float(params.min_boundary_clearance_m),
        "obstacle_clearance_m": float(params.obstacle_clearance_m),
        "overshoot_tolerance_frac": float(params.overshoot_tolerance_frac),
        "warnings": warnings,
    }

    return LayoutResult(
        annotated_bgr=annotated,
        mask=mask,
        panel_polys_xy=polys_xy,
        stats=stats
    )

# -----------------------------
# Convenience wrapper
# -----------------------------
def get_solar_layout(
    image: Image.Image,
    area_m2: float,
    length_m: Optional[float] = None,
    width_m: Optional[float] = None,
    size_label: str = "medium",
    fill_pct: float = 50.0,
    spacing_m: float = 0.12,
    edge_clearance_m: float = 0.25,
    min_boundary_clearance_m: float = 0.50,   # parapet/elevation ring
    obstacle_clearance_m: float = 0.25,
    obstacle_mode: str = "auto",              # "auto" | "light" | "off"
    angle_deg: Optional[float] = None
) -> Dict:
    params = LayoutParams(
        panel_size=size_label,
        fill_pct=fill_pct,
        spacing_m=spacing_m,
        edge_clearance_m=edge_clearance_m,
        min_boundary_clearance_m=min_boundary_clearance_m,
        obstacle_clearance_m=obstacle_clearance_m,
        obstacle_mode=obstacle_mode,
        angle_deg=angle_deg
    )
    result = layout_panels(image, area_m2, length_m, width_m, params)
    return {
        "image_with_panels_bgr": result.annotated_bgr,
        "roof_mask": result.mask,
        "panels_xy": result.panel_polys_xy,
        "stats": result.stats,
    }


# Sample usage
if __name__=="__main__":
    print(get_solar_layout(
        image=Image.open("C:\\Users\\iffat\\OneDrive\\Desktop\\neolectra\\backend\\rooftop_image.jpg"),
        area_m2=120.0,
        length_m=10.0,
        width_m=12.0,
        size_label="medium",
        fill_pct=50.0,
        spacing_m=0.08,
        edge_clearance_m=0.20,
        angle_deg=0.0
    ))

    # Create the final image
    final_image = get_solar_layout(
        image=Image.open("C:\\Users\\iffat\\OneDrive\\Desktop\\neolectra\\backend\\rooftop_image.jpg"),
        area_m2=120.0,
        length_m=10.0,
        width_m=12.0,
        size_label="medium",
        fill_pct=50.0,
        spacing_m=0.08,
        edge_clearance_m=0.20,
        angle_deg=0.0
    )["image_with_panels_bgr"]

    # Save the final image
    cv2.imwrite("C:\\Users\\iffat\\OneDrive\\Desktop\\neolectra\\backend\\rooftop_image_with_panels.jpg", final_image)