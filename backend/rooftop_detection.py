"""
Rooftop detection wrapper module for main.py compatibility
"""

import numpy as np
from PIL import Image
import cv2

def get_roof_data(image: Image.Image) -> dict:
    """
    Extract roof area from image using more accurate estimation
    """
    # Convert PIL to numpy array
    img_array = np.array(image)
    
    # Get image dimensions
    height, width = img_array.shape[:2]
    image_area_pixels = height * width
    
    try:
        # Use color segmentation to identify roof area
        # Convert to HSV color space for better segmentation
        img_hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        
        # Typical roof color ranges (can be expanded based on common roof materials)
        # This targets common roof colors like gray, brown, red tiles, etc.
        roof_masks = []
        
        # Gray/black roofs
        gray_lower = np.array([0, 0, 50])
        gray_upper = np.array([180, 30, 200])
        roof_masks.append(cv2.inRange(img_hsv, gray_lower, gray_upper))
        
        # Brown/red roofs
        brown_lower = np.array([0, 30, 50])
        brown_upper = np.array([20, 255, 200])
        roof_masks.append(cv2.inRange(img_hsv, brown_lower, brown_upper))
        
        # Combine masks
        roof_mask = np.zeros_like(roof_masks[0])
        for mask in roof_masks:
            roof_mask = cv2.bitwise_or(roof_mask, mask)
        
        # Apply morphological operations to clean up the mask
        kernel = np.ones((5, 5), np.uint8)
        roof_mask = cv2.morphologyEx(roof_mask, cv2.MORPH_CLOSE, kernel)
        roof_mask = cv2.morphologyEx(roof_mask, cv2.MORPH_OPEN, kernel)
        
        # Calculate roof area in pixels
        roof_pixels = cv2.countNonZero(roof_mask)
        roof_ratio = roof_pixels / image_area_pixels
        
        # Convert to square meters using a reasonable estimation
        # Average single-family home roof is 1,700-2,000 square feet (158-186 sq meters)
        if roof_ratio < 0.1:  # Likely not much roof visible
            estimated_roof_area_m2 = 50.0
        else:
            # Scale between reasonable roof size boundaries based on detected ratio
            estimated_roof_area_m2 = 50.0 + roof_ratio * 150.0
            estimated_roof_area_m2 = min(300.0, max(50.0, estimated_roof_area_m2))
            
        # Create debug image for visualization
        debug_image = img_array.copy()
        roof_overlay = cv2.bitwise_and(img_array, img_array, mask=roof_mask)
        
    except Exception as e:
        # Fallback to basic estimation if CV operations fail
        estimated_roof_area_m2 = min(200.0, max(50.0, image_area_pixels / 10000))
        roof_overlay = img_array
        
    return {
        "roof_area": estimated_roof_area_m2,
        "image_height": height,
        "image_width": width,
        "roof_detection_image": roof_overlay
    }

def get_solar_data(image: Image.Image) -> dict:
    """
    Get solar panel layout data from image
    """
    # Get roof area first
    roof_data = get_roof_data(image)
    roof_area = roof_data["roof_area"]
    
    # Simple solar panel calculations (can be enhanced later)
    # Typical panel efficiency and sizing calculations
    panel_efficiency = 0.20  # 20% efficiency for modern panels
    system_efficiency = 0.85  # Overall system efficiency accounting for inverter losses, etc.
    avg_daily_sun_hours = 5.5  # Average for Bangalore
    
    # Assume we can use about 70% of roof area for panels
    usable_roof_area = roof_area * 0.7
    
    # Each panel is approximately 2.278m x 1.134m = 2.58 m² (medium size from rooftop.py)
    panel_area_m2 = 2.58
    panel_power_w = 520  # watts per panel
    
    # Calculate number of panels
    num_panels = int(usable_roof_area / panel_area_m2)
    actual_panel_area = num_panels * panel_area_m2
    
    # Calculate power generation
    total_power_kw = (num_panels * panel_power_w) / 1000  # Convert to kW
    
    # Calculate annual energy generation
    # Formula: Power (kW) × Daily sun hours × 365 × System efficiency
    annual_energy_kwh = total_power_kw * avg_daily_sun_hours * 365 * system_efficiency
    
    # Create a simple annotated image (placeholder)
    img_array = np.array(image)
    annotated_image = img_array.copy()
    
    return {
        "area_of_panels": actual_panel_area,
        "num_panels": num_panels,
        "panel_efficiency": (actual_panel_area / roof_area) * 100 if roof_area > 0 else 0,
        "image_with_panels": annotated_image,
        "total_power_kw": total_power_kw,
        "annual_energy_kwh": annual_energy_kwh
    }

def get_rainwater_data(image: Image.Image) -> dict:
    """
    Get rainwater harvesting relevant data from roof image
    """
    # For rainwater harvesting, we mainly need the roof area
    roof_data = get_roof_data(image)
    
    return {
        "roof_area": roof_data["roof_area"],
        "catchment_area": roof_data["roof_area"]  # Same as roof area for rainwater
    }
