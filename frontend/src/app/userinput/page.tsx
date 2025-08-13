"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiService, SolarAnalysisResponse } from "../../lib/api";
import { dataURLtoFile, getCurrentLocation } from "../../lib/utils";
import SolarResultsDisplay from "../../components/SolarResultsDisplay";
import Loading from "../../components/Loading";
import { useAppSelector } from "../../components/reduxHooks";
import { useRouter } from "next/navigation";

export default function UserInput() {
  const router = useRouter();
  
  // Redux state
  const croppedImage = useAppSelector((state) => state.uislice.croppedScreenshot);
  const savedLat = useAppSelector((state) => state.uislice.lat);
  const savedLng = useAppSelector((state) => state.uislice.lng);
  const savedAddress = useAppSelector((state) => state.uislice.add);
  
  const [panelDetails, setPanelDetails] = useState("Medium");
  const [plotDetails, setPlotDetails] = useState({
    length: "",
    width: "",
    area: "",
    accuracy: "exact",
  });
  const [roofCoverage, setRoofCoverage] = useState(50);
  const [bescomId, setBescomId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<SolarAnalysisResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [fromCropFlow, setFromCropFlow] = useState(false);

  // Check if we're coming from the crop flow (have cropped image and location)
  useEffect(() => {
    console.log('userinput: Checking crop flow data:', { croppedImage: !!croppedImage, savedLat, savedLng });
    
    if (croppedImage && savedLat !== null && savedLng !== null) {
      console.log('userinput: Setting up crop flow data');
      setFromCropFlow(true);
      setImagePreview(croppedImage);
      setCurrentLocation({ lat: savedLat, lng: savedLng });
      
      // Convert the base64 cropped image to a File object
      const file = dataURLtoFile(croppedImage, "cropped-roof.png");
      setImageFile(file);
    } else if (croppedImage === null && savedLat === null && savedLng === null) {
      // Only redirect if we're sure there's no data (all null, not undefined)
      console.log('userinput: No crop flow data found, redirecting to map');
      router.push('/map');
    }
    // If data is undefined (still loading), don't redirect yet
  }, [croppedImage, savedLat, savedLng, router]);

  useEffect(() => {
    const lengthNum = parseFloat(plotDetails.length);
    const widthNum = parseFloat(plotDetails.width);

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

  // Get current location when component mounts (fallback if not from crop flow)
  useEffect(() => {
    if (!fromCropFlow && !currentLocation) {
      getCurrentLocation()
        .then((location: {lat: number, lng: number}) => {
          setCurrentLocation(location);
        })
        .catch((error: any) => {
          console.log("Could not get location:", error);
        });
    }
  }, [fromCropFlow, currentLocation]);

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

    if (!currentLocation) {
      setError("Location is required for solar analysis");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const solarRequest = {
        rooftop_area: parseFloat(plotDetails.area) || 100, // Default fallback
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        image: imageFile,
        ...(bescomId && { bescom_id: bescomId })
      };

      const results = await apiService.analyzeSolar(solarRequest);
      
      setAnalysisResults(results);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setError(
        error.response?.data?.detail || 
        error.message || 
        "Failed to analyze solar potential. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const solarData = { 
      panelDetails, 
      plotDetails, 
      roofCoverage, 
      bescomId,
      currentLocation,
      imageFile: imageFile?.name || null,
      timestamp: new Date().toISOString()
    };
    console.log("Solar Panel Data:", solarData);
    
    // Store data in localStorage
    localStorage.setItem('solarPanelData', JSON.stringify(solarData));
  };

  // If we have analysis results, show the results page
  if (analysisResults) {
    return (
      <SolarResultsDisplay 
        results={analysisResults} 
        onBack={() => setAnalysisResults(null)}
      />
    );
  }

  // Show loading while checking for crop flow data
  if (croppedImage === undefined || savedLat === undefined || savedLng === undefined) {
    return (
      <div className={styles.container}>
        <div className="flex items-center justify-center h-64">
          <Loading />
          <span className="ml-2">Checking for crop data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={fromCropFlow ? "/crop" : "/"} className={styles.backButton}>
        ← Back to {fromCropFlow ? "Crop" : "Home"}
      </Link>
      
      <h1 className={styles.title}>Solar Panel Setup</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {/* Image Section - Upload or Show Cropped */}
      <div className={styles.formGroup}>
        {fromCropFlow ? (
          <div>
            <label>📸 Roof Image (from map selection)</label>
            <div className="mt-4">
              <img 
                src={imagePreview} 
                alt="Cropped roof area" 
                className="max-w-xs rounded-lg shadow-lg"
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              This image was captured and cropped from your map selection. {savedAddress && `Location: ${savedAddress}`}
            </p>
            <Link href="/map" className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block">
              ← Go back to select a different area
            </Link>
          </div>
        ) : (
          <div>
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
              Upload a clear aerial or top-down view of your roof for accurate analysis
            </p>
          </div>
        )}
      </div>

      {/* Panel Details */}
      <div className={styles.formGroup}>
        <label>Panel Type</label>
        <select
          className={styles.dropdown}
          value={panelDetails}
          onChange={(e) => setPanelDetails(e.target.value)}
        >
          <option value="Small">Small (390W) - 1.95m x 1.0m</option>
          <option value="Medium">Medium (520W) - 2.278m x 1.134m</option>
          <option value="Large">Large (650W) - 2.384m x 1.303m</option>
        </select>
      </div>

      {/* BESCOM ID (Optional) */}
      <div className={styles.formGroup}>
        <label>BESCOM ID (Optional)</label>
        <input
          type="text"
          placeholder="Enter your BESCOM ID for financial analysis"
          value={bescomId}
          onChange={(e) => setBescomId(e.target.value)}
          className={styles.bescomInput}
        />
        <p className="text-sm text-gray-400 mt-2">
          Provide your BESCOM account ID to get personalized ROI analysis and bill offset calculations
        </p>
      </div>

      {/* Plot Details - Optional for reference */}
      <div className={styles.formGroup}>
        <label>Roof Dimensions (Optional - for reference)</label>
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
        <p className="text-sm text-gray-400 mt-2">
          These dimensions are optional. The system will automatically detect roof area from the uploaded image.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mt-8">
        <button 
          onClick={handleAnalyze} 
          disabled={!imageFile || !currentLocation || isAnalyzing}
          className={`${styles.analyzeButton} ${(!imageFile || !currentLocation || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <Loading />
              <span>Analyzing Solar Potential...</span>
            </div>
          ) : (
            '🔍 Analyze Solar Potential'
          )}
        </button>

        <button onClick={handleSave} className={styles.saveButton}>
          💾 Save Configuration
        </button>
      </div>

      {/* Location Info */}
      {currentLocation && (
        <div className={styles.infoSection}>
          <h3>📍 Location {fromCropFlow ? 'from Map Selection' : 'Detected'}</h3>
          <p>Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}</p>
          {savedAddress && fromCropFlow && (
            <p className="text-sm text-blue-400">{savedAddress}</p>
          )}
          <p className="text-sm text-gray-400">This will be used for solar irradiance calculations</p>
        </div>
      )}

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