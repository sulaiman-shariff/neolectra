"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function UserInput() {
  const [panelDetails, setPanelDetails] = useState("Tiny");
  const [plotDetails, setPlotDetails] = useState({
    length: "",
    width: "",
    area: "",
    accuracy: "exact",
  });
  const [roofCoverage, setRoofCoverage] = useState(50);
  const [bescomId, setBescomId] = useState("");

  useEffect(() => {
    const lengthNum = parseFloat(plotDetails.length); // Always in meters
    const widthNum = parseFloat(plotDetails.width); // Always in meters

    if (!isNaN(lengthNum) && !isNaN(widthNum)) {
      let area = lengthNum * widthNum;
      if (plotDetails.accuracy === "approximate") {
        area = area * 1.05;
      }
      setPlotDetails((prev) => ({ ...prev, area: area.toFixed(2) }));
    } else {
      setPlotDetails((prev) => ({ ...prev, area: "" }));
    }
  }, [plotDetails.length, plotDetails.width, plotDetails.accuracy]);

  const handleSave = () => {
    const solarData = { panelDetails, plotDetails, roofCoverage, bescomId };
    console.log("Solar Panel Data:", solarData);
    
    // Store data in localStorage
    localStorage.setItem('solarPanelData', JSON.stringify(solarData));
    
    // You can navigate to results or next step here
    // router.push('/solar-results');
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        ← Back to Home
      </Link>
      
      <h1 className={styles.title}>Solar Panel Setup</h1>

      {/* Panel Details */}
      <div className={styles.formGroup}>
        <label>Panel Type</label>
        <select
          className={styles.dropdown}
          value={panelDetails}
          onChange={(e) => setPanelDetails(e.target.value)}
        >
          <option value="Tiny">Tiny (Up to 2kW)</option>
          <option value="Small">Small (2-5kW)</option>
          <option value="Medium">Medium (5-10kW)</option>
          <option value="Large">Large</option>
        </select>
      </div>

      {/* BESCOM ID (Optional) */}
      <div className={styles.formGroup}>
        <label>BESCOM ID (Optional)</label>
        <input
          type="text"
          placeholder="Enter your BESCOM ID"
          value={bescomId}
          onChange={(e) => setBescomId(e.target.value)}
          className={styles.bescomInput}
        />
      </div>

      {/* Plot Details */}
      <div className={styles.formGroup}>
        <label>Roof Dimensions</label>
        <select
          value={plotDetails.accuracy}
          onChange={(e) =>
            setPlotDetails({ ...plotDetails, accuracy: e.target.value })
          }
          className={styles.accuracyDropdown}
        >
          <option value="exact">Exact</option>
          <option value="approximate">Approximate</option>
        </select>
        <div className={styles.dimensionsRow}>
          <input
            type="text"
            placeholder="Length (m)"
            value={plotDetails.length}
            onChange={(e) =>
              setPlotDetails({ ...plotDetails, length: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Width (m)"
            value={plotDetails.width}
            onChange={(e) =>
              setPlotDetails({ ...plotDetails, width: e.target.value })
            }
          />
        </div>
        <input
          type="text"
          placeholder="Area (m²)"
          value={plotDetails.area}
          readOnly
          className={styles.areaInput}
        />
      </div>

      {/* Roof Coverage */}
      <div className={styles.formGroup}>
        <label>Roof Coverage: {roofCoverage}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={roofCoverage}
          onChange={(e) => setRoofCoverage(Number(e.target.value))}
          className={styles.rangeInput}
        />
      </div>

      <button onClick={handleSave} className={styles.saveButton}>
        Save Configuration
      </button>

      {/* Additional Info */}
      <div className={styles.infoSection}>
        <h3>⚡ Solar Power Facts</h3>
        <ul>
          <li>1kW solar system needs ~100 sq ft roof space</li>
          <li>Karnataka offers up to 40% subsidy on solar installations</li>
          <li>Average payback period: 4-6 years</li>
          <li>Solar panels have 25+ year warranty</li>
          <li>Net metering allows selling excess power back to grid</li>
        </ul>
      </div>
    </div>
  );
}