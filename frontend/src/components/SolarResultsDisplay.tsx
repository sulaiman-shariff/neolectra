"use client";

import React from "react";
import { motion } from "framer-motion";
import { SolarAnalysisResponse } from "../lib/api";
import { formatCurrency, formatNumber, sqMToSqFt } from "../lib/utils";
import { FaLeaf, FaBolt, FaSun, FaChartLine, FaHome, FaCoins } from "react-icons/fa";
import Link from "next/link";

interface SolarResultsDisplayProps {
  results: SolarAnalysisResponse;
  onBack?: () => void;
}

const safeNum = (v: any, fallback = 0) => (typeof v === "number" && !isNaN(v) ? v : fallback);

// Convert a panel efficiency value to percent (supports 0.18 or 18)
const toPercent = (v: any) => {
  if (v == null) return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return n > 1 ? n : n * 100;
};

const SolarResultsDisplay: React.FC<SolarResultsDisplayProps> = ({ results, onBack }) => {
  // defensive defaults
  const r = results ?? ({} as any);

  const roofArea = safeNum(r.roof_area, 0);
  const panelArea = safeNum(r.panel_area, 0);
  const numPanels = safeNum(r.num_panels, 0);
  const totalPowerKw = safeNum(r.total_power_kw, 0);
  const annualEnergy = safeNum(r.annual_energy_kwh, 0);
  const monthlyEnergy = safeNum(r.monthly_energy_kwh, Math.round(annualEnergy / 12));
  const dailyEnergy = safeNum(r.daily_energy_kwh, Math.round(annualEnergy / 365));

  // panel specifications with safe fallbacks
  const specs = r.panel_specifications ?? {};
  const powerPerPanelW = safeNum(specs.power_per_panel_w, 0);
  const panelType = specs.panel_type ?? "N/A";
  const panelEfficiencyPct = toPercent(specs.efficiency ?? r.panel_efficiency ?? null);
  const panelDimensions = specs.panel_dimensions ?? "N/A";
  const warrantyYears = specs.warranty_years ?? "N/A";
  const degradation = specs.degradation_rate ?? "N/A";

  // BESCOM / billing analysis safely
  const bescom = r.bescom_analysis ?? null;
  const avgMonthlyUnits = safeNum(bescom?.average_monthly_units, 0);
  const avgMonthlyBill = safeNum(bescom?.average_monthly_bill, 0);
  const yearlyTotalCost = safeNum(bescom?.yearly_total_cost, 0);
  const consumptionTrend = bescom?.consumption_trend ?? "N/A";

  // energy offset percentage: prefer explicit field, else approximate if we have consumption info
  let energyOffsetPct: number | null = null;
  if (typeof r.energy_offset_percentage === "number") {
    energyOffsetPct = r.energy_offset_percentage;
  } else if (annualEnergy > 0 && bescom?.average_monthly_units) {
    // approximate: convert avg monthly units -> annual units and compare to annualEnergy (kWh)
    const annualConsumption = Number(bescom.average_monthly_units) * 12;
    if (annualConsumption > 0) {
      energyOffsetPct = (annualEnergy / annualConsumption) * 100;
    }
  }

  // ROI
  const roi = r.solar_roi_analysis ?? null;
  const initialInvestment = safeNum(roi?.initial_investment, 0);
  const annualSavings = safeNum(roi?.annual_savings, 0);
  const paybackYears = roi?.payback_period_years ?? "—";
  const roiPct = roi?.roi_percentage ?? null;
  const netSavings25 = safeNum(roi?.net_savings_25_years, 0);
  const monthlySavings = safeNum(roi?.monthly_savings, annualSavings / 12);

  // environment
  const co2Offset = safeNum(r.co2_offset_kg_per_year, 0);
  const treesEquivalent = safeNum(r.trees_equivalent, 0);

  // image
  const imageBase64 = r.image_base64 ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Solar Analysis Results
            </h1>
            <p className="text-gray-300 mt-2">Your personalized solar energy assessment</p>
          </div>
          <div className="flex gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                ← Back
              </button>
            )}
            <Link href="/suggestions">
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg transition-colors">
                View Equipment Guide
              </button>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {r?.success && r?.message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mb-8"
          >
            <p className="text-green-300">{r.message}</p>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - System Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Roof & Panel Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaHome className="text-2xl text-blue-400" />
                <h2 className="text-2xl font-semibold">System Overview</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{formatNumber(roofArea)}</div>
                  <div className="text-sm text-gray-300">Roof Area (m²)</div>
                  <div className="text-xs text-gray-400">{formatNumber(sqMToSqFt(roofArea))} sq ft</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{formatNumber(panelArea)}</div>
                  <div className="text-sm text-gray-300">Panel Area (m²)</div>
                  <div className="text-xs text-gray-400">
                    {panelEfficiencyPct != null ? `${formatNumber(panelEfficiencyPct)}% coverage` : "N/A"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{formatNumber(numPanels)}</div>
                  <div className="text-sm text-gray-300">Solar Panels</div>
                  <div className="text-xs text-gray-400">{formatNumber(powerPerPanelW)}W each</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{formatNumber(totalPowerKw)}</div>
                  <div className="text-sm text-gray-300">Total Capacity (kW)</div>
                  <div className="text-xs text-gray-400">Peak power</div>
                </div>
              </div>
            </motion.div>

            {/* Energy Generation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaBolt className="text-2xl text-yellow-400" />
                <h2 className="text-2xl font-semibold">Energy Generation</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-400">{formatNumber(annualEnergy)}</div>
                  <div className="text-lg text-gray-300">Annual kWh</div>
                  <div className="text-sm text-gray-400">Yearly generation</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">{formatNumber(monthlyEnergy)}</div>
                  <div className="text-lg text-gray-300">Monthly kWh</div>
                  <div className="text-sm text-gray-400">Average per month</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400">{formatNumber(dailyEnergy)}</div>
                  <div className="text-lg text-gray-300">Daily kWh</div>
                  <div className="text-sm text-gray-400">Average per day</div>
                </div>
              </div>
            </motion.div>

            {/* BESCOM Analysis (if available) */}
            {bescom && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaChartLine className="text-2xl text-purple-400" />
                  <h2 className="text-2xl font-semibold">BESCOM Analysis</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{formatNumber(avgMonthlyUnits)}</div>
                    <div className="text-sm text-gray-300">Avg Monthly Units</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{formatCurrency(avgMonthlyBill)}</div>
                    <div className="text-sm text-gray-300">Avg Monthly Bill</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{formatCurrency(yearlyTotalCost)}</div>
                    <div className="text-sm text-gray-300">Yearly Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {energyOffsetPct != null ? `${Number(energyOffsetPct).toFixed(1)}%` : "N/A"}
                    </div>
                    <div className="text-sm text-gray-300">Bill Offset</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-400">
                    Consumption trend: <span className="font-semibold text-yellow-400">{consumptionTrend}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ROI Analysis (if available) */}
            {roi && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaCoins className="text-2xl text-green-400" />
                  <h2 className="text-2xl font-semibold">Financial Analysis</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">{formatCurrency(initialInvestment)}</div>
                    <div className="text-sm text-gray-300">Initial Investment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{formatCurrency(annualSavings)}</div>
                    <div className="text-sm text-gray-300">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">{paybackYears}</div>
                    <div className="text-sm text-gray-300">Payback Period (years)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">{roiPct != null ? `${roiPct}%` : "N/A"}</div>
                    <div className="text-sm text-gray-300">25-Year ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{formatCurrency(netSavings25)}</div>
                    <div className="text-sm text-gray-300">Net 25-Year Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">{formatCurrency(monthlySavings)}</div>
                    <div className="text-sm text-gray-300">Monthly Savings</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Environmental Impact & Visual */}
          <div className="space-y-6">
            {/* Environmental Impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaLeaf className="text-2xl text-green-400" />
                <h2 className="text-xl font-semibold">Environmental Impact</h2>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{formatNumber(co2Offset)}</div>
                  <div className="text-sm text-gray-300">kg CO₂ offset/year</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{formatNumber(treesEquivalent)}</div>
                  <div className="text-sm text-gray-300">Equivalent trees planted</div>
                </div>
              </div>
            </motion.div>

            {/* Panel Specifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaSun className="text-2xl text-blue-400" />
                <h2 className="text-xl font-semibold">Panel Specifications</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Type:</span>
                  <span className="font-semibold">{panelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Efficiency:</span>
                  <span className="font-semibold text-green-400">
                    {panelEfficiencyPct != null ? `${formatNumber(panelEfficiencyPct)}%` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Power per Panel:</span>
                  <span className="font-semibold">{formatNumber(powerPerPanelW)}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Dimensions:</span>
                  <span className="font-semibold">{panelDimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Warranty:</span>
                  <span className="font-semibold">{warrantyYears} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Degradation:</span>
                  <span className="font-semibold">{degradation}</span>
                </div>
              </div>
            </motion.div>

            {/* Processed Image */}
            {imageBase64 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4">Solar Panel Layout</h2>
                <div className="relative">
                  <img
                    src={`data:image/png;base64,${imageBase64}`}
                    alt="Solar panel layout on roof"
                    className="w-full rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    Optimized panel placement
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 text-center text-gray-300"
              >
                No layout image available.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarResultsDisplay;
