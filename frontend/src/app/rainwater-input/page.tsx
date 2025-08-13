"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiService, RainwaterAnalysisResponse } from "../../lib/api";

// Define RoofType locally
interface RoofType {
  value: string;
  label: string;
  coefficient?: number;
}
import { getCurrentLocation } from "../../lib/utils";
import RainwaterResultsDisplay from "../../components/RainwaterResultsDisplay";
import Loading from "../../components/Loading";

export default function RainwaterInput() {
  const [roofDetails, setRoofDetails] = useState({
    length: "",
    width: "",
    area: "",
    type: "concrete",
    accuracy: "exact",
  });
  
  const [harvestingConfig, setHarvestingConfig] = useState({
    collectionEfficiency: 90,
    firstFlushMM: 1.5,
    monthlyDemand: 32000,
    connectionType: "domestic"
  });

  const [tankConfig, setTankConfig] = useState({
    enabled: false,
    capacity: 20000
  });

  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
    address: ""
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<RainwaterAnalysisResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [roofTypes, setRoofTypes] = useState<RoofType[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Calculate roof area when dimensions change
  useEffect(() => {
    const lengthNum = parseFloat(roofDetails.length);
    const widthNum = parseFloat(roofDetails.width);

    if (!isNaN(lengthNum) && !isNaN(widthNum)) {
      let area = lengthNum * widthNum;
      if (roofDetails.accuracy === "approximate") {
        area = area * 1.05; // Add 5% buffer for approximate measurements
      }
      setRoofDetails((prev) => ({ ...prev, area: area.toFixed(2) }));
    } else {
      setRoofDetails((prev) => ({ ...prev, area: "" }));
    }
  }, [roofDetails.length, roofDetails.width, roofDetails.accuracy]);

  // Get roof types and current location when component mounts
  useEffect(() => {
    const fetchRoofTypes = async () => {
      try {
        const response = await apiService.getRoofTypes();
        setRoofTypes(response.roof_types);
      } catch (error) {
        console.error("Failed to fetch roof types:", error);
      }
    };

    const getLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        setLocationData(prev => ({
          ...prev,
          latitude: location.lat.toString(),
          longitude: location.lng.toString()
        }));
      } catch (error) {
        console.log("Could not get location:", error);
      }
    };

    fetchRoofTypes();
    getLocation();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please upload a roof image first");
      return;
    }

    if (!locationData.latitude || !locationData.longitude) {
      setError("Please provide location coordinates");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const params = {
        lat: parseFloat(locationData.latitude),
        lon: parseFloat(locationData.longitude),
        roof_type: roofDetails.type,
        collection_efficiency: harvestingConfig.collectionEfficiency / 100,
        first_flush_mm: harvestingConfig.firstFlushMM,
        monthly_demand_liters: harvestingConfig.monthlyDemand,
        connection_type: harvestingConfig.connectionType,
        ...(tankConfig.enabled && { tank_capacity_liters: tankConfig.capacity })
      };

      const results = await apiService.analyzeRainwater(imageFile, params);
      setAnalysisResults(results);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setError(
        error.response?.data?.detail || 
        error.message || 
        "Failed to analyze rainwater harvesting potential. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const rainwaterData = {
      roof: roofDetails,
      harvesting: harvestingConfig,
      tank: tankConfig,
      location: locationData,
      imageFile: imageFile?.name || null,
      timestamp: new Date().toISOString()
    };
    
    console.log("Rainwater Harvesting Data:", rainwaterData);
    
    // Store data in localStorage
    localStorage.setItem('rainwaterHarvestingData', JSON.stringify(rainwaterData));
  };

  // If we have analysis results, show the results page
  if (analysisResults) {
    return (
      <RainwaterResultsDisplay 
        results={analysisResults} 
        onBack={() => setAnalysisResults(null)}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          ← Back to Home
        </Link>
        <h1 className={styles.title}>Rainwater Harvesting Setup</h1>
        <p className={styles.subtitle}>Configure your rainwater collection system</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {/* Image Upload Section */}
      <div className={styles.formGroup}>
        <label>📸 Upload Roof Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className={styles.fileInput}
          required
        />
        {imagePreview && (
          <div className="mt-4">
            <img 
              src={imagePreview} 
              alt="Roof preview" 
              className="max-w-xs rounded-lg shadow-lg"
            />
          </div>
        )}
        <p className="text-sm text-gray-400 mt-2">
          Upload a clear aerial or top-down view of your roof for accurate area detection
        </p>
      </div>

      {/* Location Details */}
      <div className={styles.formGroup}>
        <label>📍 Location Information *</label>
        <input
          type="text"
          placeholder="Enter your address"
          value={locationData.address}
          onChange={(e) => setLocationData({...locationData, address: e.target.value})}
          className={styles.input}
        />
        <div className={styles.dimensionsRow}>
          <input
            type="text"
            placeholder="Latitude *"
            value={locationData.latitude}
            onChange={(e) => setLocationData({...locationData, latitude: e.target.value})}
            className={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Longitude *"
            value={locationData.longitude}
            onChange={(e) => setLocationData({...locationData, longitude: e.target.value})}
            className={styles.input}
            required
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Location is required for rainfall data. {currentLocation && "Current location detected automatically."}
        </p>
      </div>

      {/* Roof Details */}
      <div className={styles.formGroup}>
        <label>🏠 Roof Type</label>
        <select
          className={styles.dropdown}
          value={roofDetails.type}
          onChange={(e) => setRoofDetails({...roofDetails, type: e.target.value})}
        >
          {roofTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} {type.coefficient && `(Runoff: ${(type.coefficient * 100).toFixed(0)}%)`}
            </option>
          ))}
        </select>
      </div>

      {/* Roof Dimensions - Optional for reference */}
      <div className={styles.formGroup}>
        <label>📏 Roof Dimensions (Optional - for reference)</label>
        <select
          value={roofDetails.accuracy}
          onChange={(e) => setRoofDetails({...roofDetails, accuracy: e.target.value})}
          className={styles.accuracyDropdown}
        >
          <option value="exact">Exact Measurements</option>
          <option value="approximate">Approximate (+5% buffer)</option>
        </select>
        <div className={styles.dimensionsRow}>
          <input
            type="text"
            placeholder="Length (m)"
            value={roofDetails.length}
            onChange={(e) => setRoofDetails({...roofDetails, length: e.target.value})}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Width (m)"
            value={roofDetails.width}
            onChange={(e) => setRoofDetails({...roofDetails, width: e.target.value})}
            className={styles.input}
          />
        </div>
        <input
          type="text"
          placeholder="Catchment Area (m²)"
          value={roofDetails.area}
          readOnly
          className={styles.areaInput}
        />
        <p className="text-sm text-gray-400 mt-2">
          These dimensions are optional. The system will automatically detect roof area from the uploaded image.
        </p>
      </div>

      {/* Collection Efficiency */}
      <div className={styles.formGroup}>
        <label>💧 Collection Efficiency: {harvestingConfig.collectionEfficiency}%</label>
        <p className={styles.helpText}>Accounts for losses in gutters, pipes, and filters</p>
        <input
          type="range"
          min="70"
          max="95"
          value={harvestingConfig.collectionEfficiency}
          onChange={(e) => setHarvestingConfig({...harvestingConfig, collectionEfficiency: Number(e.target.value)})}
          className={styles.rangeInput}
        />
      </div>

      {/* First Flush */}
      <div className={styles.formGroup}>
        <label>🌧️ First Flush Diverter: {harvestingConfig.firstFlushMM}mm</label>
        <p className={styles.helpText}>Amount of rainwater to discard per rainy day (removes debris)</p>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={harvestingConfig.firstFlushMM}
          onChange={(e) => setHarvestingConfig({...harvestingConfig, firstFlushMM: Number(e.target.value)})}
          className={styles.rangeInput}
        />
      </div>

      {/* Monthly Water Demand */}
      <div className={styles.formGroup}>
        <label>🚰 Monthly Water Demand (Liters)</label>
        <input
          type="number"
          placeholder="32000"
          value={harvestingConfig.monthlyDemand}
          onChange={(e) => setHarvestingConfig({...harvestingConfig, monthlyDemand: Number(e.target.value)})}
          className={styles.input}
        />
        <p className={styles.helpText}>Average household: 32,000L/month (4 people × 8,000L)</p>
      </div>

      {/* Connection Type */}
      <div className={styles.formGroup}>
        <label>🏢 BWSSB Connection Type</label>
        <select
          className={styles.dropdown}
          value={harvestingConfig.connectionType}
          onChange={(e) => setHarvestingConfig({...harvestingConfig, connectionType: e.target.value})}
        >
          <option value="domestic">Domestic (Residential)</option>
          <option value="non_domestic">Non-Domestic (Commercial)</option>
        </select>
      </div>

      {/* Tank Configuration */}
      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={tankConfig.enabled}
            onChange={(e) => setTankConfig({...tankConfig, enabled: e.target.checked})}
            className={styles.checkbox}
          />
          🏺 Include Storage Tank Simulation
        </label>
        
        {tankConfig.enabled && (
          <div className={styles.subGroup}>
            <label>Tank Capacity (Liters)</label>
            <input
              type="number"
              placeholder="20000"
              value={tankConfig.capacity}
              onChange={(e) => setTankConfig({...tankConfig, capacity: Number(e.target.value)})}
              className={styles.input}
            />
            <p className={styles.helpText}>Recommended: 10,000-50,000L based on roof area and rainfall</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.buttonGroup}>
        <button 
          onClick={handleAnalyze} 
          disabled={!imageFile || !locationData.latitude || !locationData.longitude || isAnalyzing}
          className={`${styles.analyzeButton} ${(!imageFile || !locationData.latitude || !locationData.longitude || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <Loading />
              <span>Analyzing Rainwater Potential...</span>
            </div>
          ) : (
            '🔍 Analyze Rainwater Potential'
          )}
        </button>

        <button onClick={handleSave} className={styles.saveButton}>
          💾 Save Configuration
        </button>

        <Link href="/map">
          <button className={styles.mapButton}>
            🗺️ View on Map
          </button>
        </Link>
      </div>

      {/* Additional Info */}
      <div className={styles.infoCard}>
        <h3>💡 Did you know?</h3>
        <ul>
          <li>1mm of rain on 1m² roof = 1 liter of water</li>
          <li>Bangalore receives ~900mm annual rainfall</li>
          <li>A 100m² roof can harvest ~72,000L annually</li>
          <li>RWH can reduce water bills by 30-50%</li>
          <li>Mandatory for plots {'>'}60x40 feet in Bangalore</li>
        </ul>
      </div>
    </div>
  );
}
