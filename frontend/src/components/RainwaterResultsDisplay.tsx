"use client";

import React from "react";
import { motion } from "framer-motion";
import { RainwaterAnalysisResponse } from "../lib/api";
import { formatCurrency, formatNumber } from "../lib/utils";
import {
  FaTint,
  FaHome,
  FaChartBar,
  FaLeaf,
  FaMoneyBillWave,
  FaCloudRain,
} from "react-icons/fa";
import Link from "next/link";

interface RainwaterResultsDisplayProps {
  results: RainwaterAnalysisResponse;
  onBack?: () => void;
}

const RainwaterResultsDisplay: React.FC<RainwaterResultsDisplayProps> = ({
  results,
  onBack,
}) => {
  // defensive defaults
  const summary = results?.summary ?? ({} as any);
  const monthlyData: Array<any> = results?.monthly_data ?? [];

  // prefer these canonical fields if available; fall back to older/alternate names
  const totalHarvestable =
    summary?.totals?.captured_liters ??
    0;
  const annualSavings =
    summary?.totals?.savings_rs ?? 0;
  const roofArea = summary?.roof?.area_m2 ?? 0;
  const collectionEfficiency =
    summary?.roof?.collection_efficiency ?? 0.9;

  // Peak month by captured liters (safe)
  const peakMonth =
    monthlyData.length > 0
      ? monthlyData.reduce((prev, current) =>
          (prev?.captured_liters ?? 0) > (current?.captured_liters ?? 0)
            ? prev
            : current
        )
      : {
          month: "N/A",
          captured_liters: 0,
          rain_mm: 0,
        };

  // Wet / dry season classification (>50mm considered wet as in original UI)
  const wetSeason = monthlyData.filter((m) => (m?.rain_mm ?? 0) > 50);
  const drySeason = monthlyData.filter((m) => (m?.rain_mm ?? 0) < 50);

  // percentage of demand met if demand is provided, otherwise fallback to provided percent
  const percentageDemandMet = null; // This data is not available in the current API structure

  // Recommended tank: monthly average harvest (as per UI)
  const recommendedTankSizeL = Math.ceil((totalHarvestable ?? 0) / 12);

  // coordinates
  const lat = summary?.coords?.lat;
  const lon = summary?.coords?.lon;

  // date period
  const periodStart = summary?.period?.start ?? "—";
  const periodEnd = summary?.period?.end ?? "—";

  // daily data count fallback
  const dailyDataCount = results?.daily_data_count ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Rainwater Harvesting Analysis
            </h1>
            <p className="text-gray-300 mt-2">
              Your sustainable water conservation assessment
            </p>
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
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg transition-colors">
                View Equipment Guide
              </button>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {results?.success && results?.message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mb-8"
          >
            <p className="text-green-300">{results.message}</p>
          </motion.div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-blur-lg border border-blue-500/30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <FaHome className="text-blue-400 text-2xl" />
              <span className="text-blue-300 text-sm">Roof Area</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {formatNumber(roofArea)}
              </div>
              <div className="text-xs text-gray-400">square meters</div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-600/30 to-green-800/30 backdrop-blur-lg border border-green-500/30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <FaTint className="text-green-400 text-2xl" />
              <span className="text-green-300 text-sm">Water Captured</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {formatNumber(totalHarvestable)}
              </div>
              <div className="text-xs text-gray-400">liters annually</div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 backdrop-blur-lg border border-yellow-500/30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <FaMoneyBillWave className="text-yellow-400 text-2xl" />
              <span className="text-yellow-300 text-sm">Cost Savings</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {formatCurrency(annualSavings)}
              </div>
              <div className="text-xs text-gray-400">per year</div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 backdrop-blur-lg border border-purple-500/30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <FaChartBar className="text-purple-400 text-2xl" />
              <span className="text-purple-300 text-sm">System Efficiency</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {(collectionEfficiency * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">collection rate</div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Summary */}
          <motion.div
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-gray-600/30 rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-cyan-300 mb-6">
              System Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Roof Type:</span>
                <span className="font-semibold text-cyan-400 capitalize">
                  {summary?.roof?.roof_type ?? "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Runoff Coefficient:</span>
                <span className="font-semibold text-blue-400">
                  {((summary?.roof?.runoff_coeff ?? 0.85) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">First Flush:</span>
                <span className="font-semibold text-orange-400">
                  {summary?.roof?.first_flush_mm ?? "N/A"}mm
                </span>
              </div>

              {summary?.tank?.enabled && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Tank Capacity:</span>
                    <span className="font-semibold text-green-400">
                      {formatNumber(summary.tank.capacity_liters ?? 0)}L
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">System Reliability:</span>
                    <span className="font-semibold text-green-400">
                      {(summary.tank.reliability_pct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Financial Summary */}
          <motion.div
            className="bg-gradient-to-br from-green-800/50 to-emerald-900/50 backdrop-blur-lg border border-green-600/30 rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-green-300 mb-6">
              Financial Benefits
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Connection Type:</span>
                <span className="font-semibold text-blue-400 capitalize">
                  {summary?.billing?.connection_type ?? "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Baseline Annual Bill:</span>
                <span className="font-semibold text-red-400">
                  {formatCurrency(summary?.billing?.baseline_total_rs ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Net Annual Bill:</span>
                <span className="font-semibold text-orange-400">
                  {formatCurrency(summary?.billing?.net_total_rs ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                <span className="text-gray-300">Annual Savings:</span>
                <span className="font-bold text-green-400 text-lg">
                  {formatCurrency(annualSavings)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Monthly Savings:</span>
                <span className="font-semibold text-green-400">
                  {formatCurrency((annualSavings ?? 0) / 12)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Data Period */}
        <motion.div
          className="mt-8 bg-gradient-to-br from-blue-800/30 to-cyan-900/30 backdrop-blur-lg border border-blue-600/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-xl font-bold text-cyan-300 mb-4">Analysis Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-gray-400">Analysis Period</div>
              <div className="font-semibold text-blue-300">
                {periodStart} to {periodEnd}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Daily Data Points</div>
              <div className="font-semibold text-cyan-300">{dailyDataCount} days</div>
            </div>
            <div>
              <div className="text-gray-400">Location</div>
              <div className="font-semibold text-green-300">
                {typeof lat === "number" && typeof lon === "number"
                  ? `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
                  : "N/A"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main content area (two columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            {/* System Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaHome className="text-2xl text-cyan-400" />
                <h2 className="text-2xl font-semibold">System Overview</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {formatNumber(roofArea)}
                  </div>
                  <div className="text-sm text-gray-300">Roof Area (m²)</div>
                  <div className="text-xs text-gray-400">Catchment area</div>
                </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {formatNumber(
                    monthlyData.reduce((total, month) => total + (month?.rain_mm ?? 0), 0)
                  )}
                </div>
                <div className="text-sm text-gray-300">Annual Rainfall (mm)</div>
                <div className="text-xs text-gray-400">Local precipitation</div>
              </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {formatNumber(totalHarvestable)}
                  </div>
                  <div className="text-sm text-gray-300">Harvestable Water (L)</div>
                  <div className="text-xs text-gray-400">Annual potential</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {percentageDemandMet !== null ? `${Number(percentageDemandMet).toFixed(1)}%` : "N/A"}
                  </div>
                  <div className="text-sm text-gray-300">Demand Met</div>
                  <div className="text-xs text-gray-400">Annual coverage</div>
                </div>
              </div>
            </motion.div>

            {/* Financial Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaMoneyBillWave className="text-2xl text-green-400" />
                <h2 className="text-2xl font-semibold">Financial Benefits</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">
                    {formatCurrency(annualSavings)}
                  </div>
                  <div className="text-lg text-gray-300">Annual Savings</div>
                  <div className="text-sm text-gray-400">Water bill reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-400">
                    {"—"}
                  </div>
                  <div className="text-lg text-gray-300">Payback Period (years)</div>
                  <div className="text-sm text-gray-400">Return on investment</div>
                </div>
              </div>
            </motion.div>

            {/* Monthly Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaChartBar className="text-2xl text-purple-400" />
                <h2 className="text-2xl font-semibold">Monthly Analysis</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-300">
                    {typeof peakMonth?.month === "string"
                      ? new Date(peakMonth.month).toLocaleString("en-US", { month: "short", year: "numeric" })
                      : String(peakMonth?.month ?? "N/A")}
                  </div>
                  <div className="text-sm text-gray-300">Peak Harvest Month</div>
                  <div className="text-xs text-gray-400">
                    {formatNumber(peakMonth.captured_liters ?? 0)}L
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-300">
                    {wetSeason.length}
                  </div>
                  <div className="text-sm text-gray-300">Wet Season Months</div>
                  <div className="text-xs text-gray-400">{">"}50mm rainfall</div>
                </div>
                <div className="text-center p-4 bg-red-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-300">
                    {drySeason.length}
                  </div>
                  <div className="text-sm text-gray-300">Dry Season Months</div>
                  <div className="text-xs text-gray-400">{"<"}50mm rainfall</div>
                </div>
              </div>

              {/* Monthly Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-2">Month</th>
                      <th className="text-center p-2">Rainfall (mm)</th>
                      <th className="text-center p-2">Harvested (L)</th>
                      <th className="text-center p-2">Offset (L)</th>
                      <th className="text-center p-2">Unmet Demand (L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="p-2 font-medium">
                          {typeof month.month === "string"
                            ? new Date(month.month).toLocaleString("en-US", { month: "short", year: "numeric" })
                            : `M${index + 1}`}
                        </td>
                        <td className="p-2 text-center">{month.rain_mm ?? 0}</td>
                        <td className="p-2 text-center text-cyan-300">
                          {formatNumber(month.captured_liters ?? 0)}
                        </td>
                        <td className="p-2 text-center text-orange-300">
                          {formatNumber(month.offset_liters ?? 0)}
                        </td>
                        <td className="p-2 text-center text-red-300">
                          {formatNumber(month.unmet_demand_liters ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Environmental Impact & System Details */}
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
                <div className="bg-green-500/20 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-green-300">
                    {(summary as any)?.environmental_impact ?? "Reduced municipal demand"}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Sustainable water management
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatNumber((totalHarvestable ?? 0) / 1000)}
                    </div>
                    <div className="text-sm text-gray-300">Thousand liters/year</div>
                    <div className="text-xs text-gray-400">Water conservation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round((totalHarvestable ?? 0) / 150)}
                    </div>
                    <div className="text-sm text-gray-300">Days of water supply</div>
                    <div className="text-xs text-gray-400">For average family</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* System Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaTint className="text-2xl text-blue-400" />
                <h2 className="text-xl font-semibold">System Recommendations</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-500/20 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-blue-300 mb-2">
                    Recommended Tank Size
                  </div>
                  <div className="text-lg font-bold text-white">
                    {recommendedTankSizeL.toLocaleString()}L
                  </div>
                  <div className="text-xs text-gray-400">Based on monthly average</div>
                </div>

                <div className="bg-purple-500/20 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-purple-300 mb-2">
                    First Flush Diverter
                  </div>
                  <div className="text-lg font-bold text-white">Essential</div>
                  <div className="text-xs text-gray-400">Improves water quality</div>
                </div>

                <div className="bg-green-500/20 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-green-300 mb-2">
                    Filtration System
                  </div>
                  <div className="text-lg font-bold text-white">Multi-stage</div>
                  <div className="text-xs text-gray-400">Sand + Carbon filters</div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <FaCloudRain className="text-2xl text-cyan-400" />
                <h2 className="text-xl font-semibold">Quick Facts</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total data points:</span>
                  <span className="font-semibold">{dailyDataCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Average monthly rainfall:</span>
                  <span className="font-semibold">
                    {(monthlyData.reduce((total, month) => total + (month?.rain_mm ?? 0), 0) / 12).toFixed(1)}mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Collection efficiency:</span>
                  <span className="font-semibold text-green-400">
                    {(collectionEfficiency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Monthly savings:</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency((annualSavings ?? 0) / 12)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RainwaterResultsDisplay;
