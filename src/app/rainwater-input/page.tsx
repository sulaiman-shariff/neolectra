"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";

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

  const handleSave = () => {
    const rainwaterData = {
      roof: roofDetails,
      harvesting: harvestingConfig,
      tank: tankConfig,
      location: locationData
    };
    
    console.log("Rainwater Harvesting Data:", rainwaterData);
    
    // You can store this data in localStorage, send to API, or navigate to results
    localStorage.setItem('rainwaterHarvestingData', JSON.stringify(rainwaterData));
    
    // Navigate to results or next step
    // router.push('/rainwater-results');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          ← Back to Home
        </Link>
        <h1 className={styles.title}>Rainwater Harvesting Setup</h1>
        <p className={styles.subtitle}>Configure your rainwater collection system</p>
      </div>

      {/* Location Details */}
      <div className={styles.formGroup}>
        <label>📍 Location Information</label>
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
            placeholder="Latitude"
            value={locationData.latitude}
            onChange={(e) => setLocationData({...locationData, latitude: e.target.value})}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Longitude"
            value={locationData.longitude}
            onChange={(e) => setLocationData({...locationData, longitude: e.target.value})}
            className={styles.input}
          />
        </div>
      </div>

      {/* Roof Details */}
      <div className={styles.formGroup}>
        <label>🏠 Roof Type</label>
        <select
          className={styles.dropdown}
          value={roofDetails.type}
          onChange={(e) => setRoofDetails({...roofDetails, type: e.target.value})}
        >
          <option value="concrete">Concrete (Runoff: 80%)</option>
          <option value="tile">Clay/Ceramic Tile (Runoff: 70%)</option>
          <option value="metal">Metal Sheet (Runoff: 90%)</option>
          <option value="cgi">Corrugated Iron (Runoff: 90%)</option>
          <option value="asbestos">Asbestos (Runoff: 80%)</option>
        </select>
      </div>

      {/* Roof Dimensions */}
      <div className={styles.formGroup}>
        <label>📏 Roof Dimensions</label>
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
        </ul>
      </div>
    </div>
  );
}
