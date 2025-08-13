"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";

export default function UserInput() {
  const [panelDetails, setPanelDetails] = useState("Tiny");
  const [plotDetails, setPlotDetails] = useState({
    length: "",
    width: "",
    area: "",
    accuracy: "exact",
  });
  const [roofCoverage, setRoofCoverage] = useState(50);

  // Automatically update area when length or width changes
  useEffect(() => {
    const lengthNum = parseFloat(plotDetails.length);
    const widthNum = parseFloat(plotDetails.width);
    if (!isNaN(lengthNum) && !isNaN(widthNum)) {
      setPlotDetails((prev) => ({ ...prev, area: (lengthNum * widthNum).toString() }));
    } else {
      setPlotDetails((prev) => ({ ...prev, area: "" }));
    }
  }, [plotDetails.length, plotDetails.width]);

  const handleSave = () => {
    console.log({
      panelDetails,
      plotDetails,
      roofCoverage,
    });
    // Add navigation or state dispatch logic here
  };

  return (
    <div className={styles.container}>
      <h1>User Input</h1>

      <div className={styles.formGroup}>
        <label>Panel Details</label>
        <select
          className={styles.dropdown}
          value={panelDetails}
          onChange={(e) => setPanelDetails(e.target.value)}
        >
          <option value="Tiny">Tiny</option>
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Plot Details</label>
        <input
          type="text"
          placeholder="Length"
          value={plotDetails.length}
          onChange={(e) =>
            setPlotDetails({ ...plotDetails, length: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Width"
          value={plotDetails.width}
          onChange={(e) =>
            setPlotDetails({ ...plotDetails, width: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Area"
          value={plotDetails.area}
          readOnly // Make area read-only
        />
        <select
          value={plotDetails.accuracy}
          onChange={(e) =>
            setPlotDetails({ ...plotDetails, accuracy: e.target.value })
          }
        >
          <option value="exact">Exact</option>
          <option value="approximate">Approximate</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Roof Coverage</label>
        <input
          type="range"
          min="0"
          max="100"
          value={roofCoverage}
          onChange={(e) => setRoofCoverage(Number(e.target.value))}
        />
      </div>

      <button onClick={handleSave} className={styles.saveButton}>
        Save
      </button>
    </div>
  );
}
