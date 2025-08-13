"""
FastAPI application for Neolectra Backend Services
Provides APIs for rainwater harvesting and comprehensive solar power analysis with BESCOM integration.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import io
import base64
import json
import asyncio
import subprocess
import os
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import cv2
import numpy as np
from datetime import datetime, timedelta
import uvicorn
import statistics
import pandas as pd
import numpy as np
import requests_cache

# Import our custom modules
from rooftop_detection import (
    get_roof_data, 
    get_solar_data, 
    get_rainwater_data
)
from rainwater import rainwater_report
from bescom_scraper import main as bescom_main
import sys
from io import StringIO

# Initialize FastAPI app
app = FastAPI(
    title="Neolectra Backend API",
    description="API for rainwater harvesting and comprehensive solar power analysis with BESCOM integration",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation

class RainwaterRequest(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lon: float = Field(..., description="Longitude coordinate")
    roof_area_m2: float = Field(..., description="Roof area in square meters")
    roof_type: str = Field(default="concrete", description="Type of roof: concrete, tile, metal, asbestos, cgi, custom")
    collection_efficiency: float = Field(default=0.9, description="Collection efficiency (0-1)")
    first_flush_mm: float = Field(default=1.5, description="First flush amount in mm")
    monthly_demand_liters: float = Field(default=32000, description="Monthly water demand in liters")
    tank_capacity_liters: Optional[float] = Field(None, description="Tank capacity in liters (optional)")
    connection_type: str = Field(default="domestic", description="Connection type: domestic or non_domestic")
    custom_coefficient: Optional[float] = Field(None, description="Custom runoff coefficient if roof_type is custom")

class BESCOMAnalysis(BaseModel):
    average_monthly_units: float = Field(..., description="Average monthly electricity consumption in units")
    average_monthly_bill: float = Field(..., description="Average monthly electricity bill in INR")
    peak_consumption_month: str = Field(..., description="Month with highest consumption")
    lowest_consumption_month: str = Field(..., description="Month with lowest consumption")
    yearly_total_units: float = Field(..., description="Total yearly electricity consumption")
    yearly_total_cost: float = Field(..., description="Total yearly electricity cost")
    consumption_trend: str = Field(..., description="Overall consumption trend (increasing/decreasing/stable)")
    cost_per_unit_avg: float = Field(..., description="Average cost per unit")

class SolarROIAnalysis(BaseModel):
    initial_investment: float = Field(..., description="Total initial investment for solar installation")
    annual_savings: float = Field(..., description="Annual savings from solar panels")
    payback_period_years: float = Field(..., description="Simple payback period in years")
    roi_percentage: float = Field(..., description="Return on Investment percentage over 25 years")
    net_savings_25_years: float = Field(..., description="Net savings over 25 years")
    monthly_savings: float = Field(..., description="Average monthly savings")
    break_even_month: int = Field(..., description="Month when solar investment pays for itself")

class SolarAnalysisResponse(BaseModel):
    # Roof and panel information
    roof_area: float = Field(..., description="Total roof area in square meters")
    panel_area: float = Field(..., description="Area covered by solar panels in square meters")
    num_panels: int = Field(..., description="Number of solar panels that can be installed")
    panel_efficiency: float = Field(..., description="Percentage of roof area used for panels")
    
    # Energy generation
    total_power_kw: float = Field(..., description="Total power generation capacity in kW")
    annual_energy_kwh: float = Field(..., description="Annual energy generation in kWh")
    monthly_energy_kwh: float = Field(..., description="Average monthly energy generation in kWh")
    daily_energy_kwh: float = Field(..., description="Average daily energy generation in kWh")
    
    # Cost and savings analysis
    solar_roi_analysis: Optional[SolarROIAnalysis] = Field(None, description="ROI analysis if BESCOM data provided")
    bescom_analysis: Optional[BESCOMAnalysis] = Field(None, description="BESCOM consumption analysis")
    
    # Environmental impact
    co2_offset_kg_per_year: float = Field(..., description="CO2 offset per year in kg")
    trees_equivalent: int = Field(..., description="Equivalent number of trees planted")
    
    # Technical details
    panel_specifications: Dict[str, Any] = Field(..., description="Solar panel technical specifications")
    energy_offset_percentage: Optional[float] = Field(None, description="Percentage of electricity bill offset by solar")
    
    # Visual
    image_base64: Optional[str] = Field(None, description="Base64 encoded image with panels overlay")
    
    # Status
    success: bool = Field(..., description="Whether the analysis was successful")
    message: str = Field(..., description="Success or error message")

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

# Utility functions

def image_to_base64(image: np.ndarray) -> str:
    """Convert OpenCV image to base64 string"""
    if len(image.shape) == 3:
        # Color image
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
    else:
        # Grayscale image
        pil_image = Image.fromarray(image)
    
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    return image_base64

def validate_image(file: UploadFile) -> Image.Image:
    """Validate and convert uploaded file to PIL Image"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = file.file.read()
        image = Image.open(io.BytesIO(contents))
        return image
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

def run_bescom_scraper(account_id: str) -> Dict[str, Any]:
    """Run BESCOM scraper and return parsed data"""
    try:
        # Run the BESCOM scraper as a subprocess to avoid stdout capture issues
        result = subprocess.run(
            [sys.executable, "bescom_scraper.py", account_id],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if result.returncode != 0:
            raise Exception(f"BESCOM scraper failed: {result.stderr}")
        
        # Parse the JSON output
        billing_data = json.loads(result.stdout)
        return billing_data
    
    except subprocess.TimeoutExpired:
        raise Exception("BESCOM scraper timed out")
    except json.JSONDecodeError:
        raise Exception("Failed to parse BESCOM response")
    except Exception as e:
        raise Exception(f"Error running BESCOM scraper: {str(e)}")

def analyze_bescom_data(billing_data: Dict[str, Any]) -> BESCOMAnalysis:
    """Analyze BESCOM billing data to extract insights"""
    rows = billing_data.get("rows", [])
    
    if not rows:
        raise ValueError("No billing data available for analysis")
    
    # Extract units and amounts
    monthly_data = []
    for row in rows:
        if row.get("units") is not None and row.get("amount") is not None:
            monthly_data.append({
                "date": row.get("date"),
                "units": float(row["units"]),
                "amount": float(row["amount"]),
                "cost_per_unit": float(row["amount"]) / float(row["units"]) if float(row["units"]) > 0 else 0
            })
    
    if not monthly_data:
        raise ValueError("No valid billing data found")
    
    # Sort by date (newest first)
    monthly_data.sort(key=lambda x: x["date"] or "", reverse=True)
    
    # Calculate statistics
    units_list = [data["units"] for data in monthly_data]
    amounts_list = [data["amount"] for data in monthly_data]
    cost_per_unit_list = [data["cost_per_unit"] for data in monthly_data if data["cost_per_unit"] > 0]
    
    avg_units = statistics.mean(units_list)
    avg_amount = statistics.mean(amounts_list)
    avg_cost_per_unit = statistics.mean(cost_per_unit_list) if cost_per_unit_list else 0
    
    # Find peak and lowest consumption
    max_consumption = max(monthly_data, key=lambda x: x["units"])
    min_consumption = min(monthly_data, key=lambda x: x["units"])
    
    # Calculate trend (simple linear trend)
    if len(units_list) >= 3:
        recent_avg = statistics.mean(units_list[:3])  # Last 3 months
        older_avg = statistics.mean(units_list[-3:])  # Oldest 3 months
        
        if recent_avg > older_avg * 1.1:
            trend = "increasing"
        elif recent_avg < older_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"
    else:
        trend = "insufficient_data"
    
    return BESCOMAnalysis(
        average_monthly_units=round(avg_units, 2),
        average_monthly_bill=round(avg_amount, 2),
        peak_consumption_month=max_consumption["date"] or "Unknown",
        lowest_consumption_month=min_consumption["date"] or "Unknown",
        yearly_total_units=round(sum(units_list), 2),
        yearly_total_cost=round(sum(amounts_list), 2),
        consumption_trend=trend,
        cost_per_unit_avg=round(avg_cost_per_unit, 2)
    )

def calculate_solar_roi(solar_data: Dict[str, Any], bescom_analysis: BESCOMAnalysis) -> SolarROIAnalysis:
    """Calculate ROI for solar installation based on current electricity consumption"""
    
    # Solar installation costs (typical Indian market rates)
    cost_per_kw = 45000  # INR per kW installed (including installation, inverter, etc.)
    total_power_kw = solar_data.get("total_power_kw", 0)
    initial_investment = total_power_kw * cost_per_kw
    
    # Annual energy generation
    annual_energy_kwh = solar_data.get("annual_energy_kwh", 0)
    
    # Calculate savings based on current electricity cost
    avg_cost_per_unit = bescom_analysis.cost_per_unit_avg
    annual_savings = annual_energy_kwh * avg_cost_per_unit
    monthly_savings = annual_savings / 12
    
    # Payback period calculation
    if annual_savings > 0:
        payback_period = initial_investment / annual_savings
        break_even_month = int(payback_period * 12)
    else:
        payback_period = float('inf')
        break_even_month = 999
    
    # 25-year ROI calculation (typical solar panel warranty)
    system_life_years = 25
    maintenance_cost_annual = initial_investment * 0.01  # 1% annual maintenance
    total_maintenance_25_years = maintenance_cost_annual * system_life_years
    
    # Degradation factor (panels lose about 0.8% efficiency per year)
    degradation_rate = 0.008
    total_energy_25_years = 0
    for year in range(system_life_years):
        efficiency_factor = (1 - degradation_rate) ** year
        total_energy_25_years += annual_energy_kwh * efficiency_factor
    
    total_savings_25_years = total_energy_25_years * avg_cost_per_unit
    net_savings_25_years = total_savings_25_years - initial_investment - total_maintenance_25_years
    roi_percentage = (net_savings_25_years / initial_investment) * 100 if initial_investment > 0 else 0
    
    return SolarROIAnalysis(
        initial_investment=round(initial_investment, 2),
        annual_savings=round(annual_savings, 2),
        payback_period_years=round(payback_period, 1),
        roi_percentage=round(roi_percentage, 1),
        net_savings_25_years=round(net_savings_25_years, 2),
        monthly_savings=round(monthly_savings, 2),
        break_even_month=break_even_month
    )

def calculate_environmental_impact(annual_energy_kwh: float) -> Dict[str, Any]:
    """Calculate environmental impact of solar installation"""
    # CO2 emission factor for Indian grid: ~0.82 kg CO2/kWh
    co2_emission_factor = 0.82
    co2_offset_per_year = annual_energy_kwh * co2_emission_factor
    
    # One tree absorbs approximately 21 kg of CO2 per year
    trees_equivalent = int(co2_offset_per_year / 21)
    
    return {
        "co2_offset_kg_per_year": round(co2_offset_per_year, 2),
        "trees_equivalent": trees_equivalent
    }

# API Routes

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )

@app.post("/api/solar/analyze", response_model=SolarAnalysisResponse)
async def analyze_solar_potential(
    file: UploadFile = File(...),
    bescom_account_id: Optional[str] = Query(None, description="Optional BESCOM account ID for ROI analysis")
):
    """
    Analyze solar panel potential from uploaded rooftop image with optional BESCOM integration
    """
    try:
        # Validate and process image
        image = validate_image(file)
        
        # Run solar analysis and BESCOM scraping in parallel if account ID provided
        async def run_analysis():
            # Get solar analysis data
            solar_data = get_solar_data(image)
            roof_data = get_roof_data(image)
            
            # Initialize BESCOM analysis variables
            bescom_analysis = None
            roi_analysis = None
            energy_offset_percentage = None
            
            # If BESCOM account ID is provided, run BESCOM analysis in parallel
            if bescom_account_id:
                try:
                    # Run BESCOM scraper
                    billing_data = run_bescom_scraper(bescom_account_id)
                    
                    # Analyze BESCOM data
                    bescom_analysis = analyze_bescom_data(billing_data)
                    
                    # Calculate ROI
                    roi_analysis = calculate_solar_roi(solar_data, bescom_analysis)
                    
                    # Calculate energy offset percentage
                    annual_consumption_kwh = bescom_analysis.average_monthly_units * 12
                    if annual_consumption_kwh > 0:
                        energy_offset_percentage = min(100.0, (solar_data.get("annual_energy_kwh", 0) / annual_consumption_kwh) * 100)
                    
                except Exception as bescom_error:
                    print(f"BESCOM analysis failed: {bescom_error}")
                    # Continue without BESCOM analysis
            
            return solar_data, roof_data, bescom_analysis, roi_analysis, energy_offset_percentage
        
        # Execute analysis
        solar_data, roof_data, bescom_analysis, roi_analysis, energy_offset_percentage = await run_analysis()
        
        # Calculate efficiency
        panel_efficiency = 0.0
        if roof_data["roof_area"] > 0:
            panel_efficiency = (solar_data["area_of_panels"] / roof_data["roof_area"]) * 100
        
        # Convert result image to base64
        image_base64 = None
        if solar_data.get("image_with_panels") is not None:
            image_base64 = image_to_base64(solar_data["image_with_panels"])
        
        # Calculate environmental impact
        env_impact = calculate_environmental_impact(solar_data.get("annual_energy_kwh", 0))
        
        # Panel specifications (typical values)
        # Get panel specifications from the solar_data returned by get_solar_data
        # This ensures we use the actual panel model selected during analysis
        panel_model = solar_data.get("panel_model", "medium")
        
        # Set specifications based on the panel model
        if panel_model == "small":
            power_per_panel = 390
            dimensions = "1.95m x 1.0m"
        elif panel_model == "large":
            power_per_panel = 650
            dimensions = "2.384m x 1.303m"
        else:  # medium (default)
            power_per_panel = 520
            dimensions = "2.278m x 1.134m"
            
        panel_specs = {
            "panel_type": "Monocrystalline Silicon",
            "efficiency": "20-22%",
            "warranty_years": 25,
            "degradation_rate": "0.8% per year",
            "power_per_panel_w": power_per_panel,
            "panel_dimensions": dimensions,
            "model": panel_model
        }
        
        return SolarAnalysisResponse(
            roof_area=roof_data["roof_area"],
            panel_area=solar_data["area_of_panels"],
            num_panels=solar_data.get("num_panels", 0),
            panel_efficiency=round(panel_efficiency, 2),
            total_power_kw=solar_data.get("total_power_kw", 0),
            annual_energy_kwh=solar_data.get("annual_energy_kwh", 0),
            monthly_energy_kwh=round(solar_data.get("annual_energy_kwh", 0) / 12, 2),
            daily_energy_kwh=round(solar_data.get("annual_energy_kwh", 0) / 365, 2),
            solar_roi_analysis=roi_analysis,
            bescom_analysis=bescom_analysis,
            co2_offset_kg_per_year=env_impact["co2_offset_kg_per_year"],
            trees_equivalent=env_impact["trees_equivalent"],
            panel_specifications=panel_specs,
            energy_offset_percentage=energy_offset_percentage,
            image_base64=image_base64,
            success=True,
            message="Solar analysis completed successfully" + (" with BESCOM integration" if bescom_account_id else "")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing solar potential: {str(e)}")

@app.post("/api/rainwater/analyze")
async def analyze_rainwater_harvesting(
    file: UploadFile = File(...),
    lat: float = Query(..., description="Latitude coordinate"),
    lon: float = Query(..., description="Longitude coordinate"),
    roof_type: str = Query(default="concrete", description="Type of roof"),
    collection_efficiency: float = Query(default=0.9, description="Collection efficiency (0-1)"),
    first_flush_mm: float = Query(default=1.5, description="First flush amount in mm"),
    monthly_demand_liters: float = Query(default=32000, description="Monthly water demand in liters"),
    tank_capacity_liters: Optional[float] = Query(None, description="Tank capacity in liters"),
    connection_type: str = Query(default="domestic", description="Connection type") #domestic or non-domestic
):
    """
    Analyze rainwater harvesting potential from uploaded rooftop image and location data
    """
    try:
        # Validate and process image
        image = validate_image(file)
        
        # Get roof area from image
        rainwater_data = get_rainwater_data(image)
        roof_area = rainwater_data["roof_area"]
        
        # Generate rainwater harvesting report
        report = rainwater_report(
            lat=lat,
            lon=lon,
            roof_area_m2=roof_area,
            roof_type=roof_type,
            collection_efficiency=collection_efficiency,
            first_flush_mm=first_flush_mm,
            monthly_demand_liters=monthly_demand_liters,
            tank_capacity_liters=tank_capacity_liters,
            connection_type=connection_type
        )
        
        # Convert pandas DataFrames to JSON-serializable format
        monthly_data = report["monthly_df"].to_dict('records')
        
        return {
            "success": True,
            "message": "Rainwater harvesting analysis completed successfully",
            "roof_area": roof_area,
            "summary": report["summary"],
            "monthly_data": monthly_data,
            "daily_data_count": len(report["daily_df"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing rainwater harvesting: {str(e)}")

@app.get("/api/roof-types")
async def get_roof_types():
    """
    Get available roof types for rainwater harvesting analysis
    """
    roof_types = [
        {"value": "concrete", "label": "Concrete", "coefficient": 0.80},
        {"value": "tile", "label": "Tile", "coefficient": 0.70},
        {"value": "metal", "label": "Metal", "coefficient": 0.90},
        {"value": "cgi", "label": "CGI (Corrugated Galvanized Iron)", "coefficient": 0.90},
        {"value": "asbestos", "label": "Asbestos", "coefficient": 0.80},
        {"value": "custom", "label": "Custom", "coefficient": None}
    ]
    
    return {
        "success": True,
        "message": "Available roof types retrieved successfully",
        "roof_types": roof_types
    }

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": "Endpoint not found",
            "detail": "The requested endpoint does not exist"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": "An unexpected error occurred while processing your request"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
