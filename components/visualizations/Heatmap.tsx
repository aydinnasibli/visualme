"use client";

import React, { useRef } from "react";
import { HeatmapData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";
import { Tooltip } from "recharts";

interface HeatmapProps {
  data: HeatmapData;
  readOnly?: boolean;
}

// Custom Tooltip component for hover state
const HeatmapTooltip = ({ x, y, value, show }: { x: string | number, y: string | number, value: number, show: boolean }) => {
  if (!show) return null;
  return (
    <div className="absolute z-50 bg-zinc-900 border border-zinc-700 p-2 rounded shadow-xl pointer-events-none transform -translate-y-full -mt-2">
      <div className="text-xs text-zinc-400 font-bold mb-1">{x} / {y}</div>
      <div className="text-sm text-white font-mono">Value: {value}</div>
    </div>
  );
};

export default function Heatmap({ data }: HeatmapProps) {
  // Extract unique X and Y keys to build the grid
  const xKeys = Array.from(new Set(data.data.map((d) => d.x)));
  const yKeys = Array.from(new Set(data.data.map((d) => d.y)));

  // Find value range for color interpolation
  const values = data.data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Helper to get color based on value
  const getColor = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    // Gradient from transparent purple to bright cyan/white
    // Low: #1e1b4b (indigo-950) -> High: #22d3ee (cyan-400)
    // Simple distinct steps for "blocky" heatmap look or smooth rgba
    return `rgba(6, 182, 212, ${0.1 + ratio * 0.9})`;
  };

  const getCellData = (x: string | number, y: string | number) => {
    return data.data.find((d) => d.x === x && d.y === y);
  };

  return (
    <VisualizationContainer>
      <div className="w-full h-full flex flex-col p-8 overflow-auto custom-scrollbar">
        <div className="m-auto min-w-max">
          {/* Grid Container */}
          <div
            className="grid gap-1"
            style={{
                gridTemplateColumns: `auto repeat(${xKeys.length}, minmax(60px, 1fr))`,
            }}
          >
            {/* Header Row (X Axis) */}
            <div className="h-8"></div> {/* Top-left empty corner */}
            {xKeys.map((x) => (
                <div key={`header-${x}`} className="flex items-center justify-center p-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {x}
                </div>
            ))}

            {/* Rows (Y Axis + Cells) */}
            {yKeys.map((y) => (
                <React.Fragment key={`row-${y}`}>
                    {/* Y Label */}
                    <div className="flex items-center justify-end pr-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        {y}
                    </div>
                    {/* Cells */}
                    {xKeys.map((x) => {
                        const cell = getCellData(x, y);
                        const val = cell ? cell.value : 0;
                        return (
                            <div
                                key={`${x}-${y}`}
                                className="group relative aspect-square rounded-md transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer border border-transparent hover:border-cyan-400"
                                style={{ backgroundColor: getColor(val) }}
                                title={`${x} / ${y}: ${val}`}
                            >
                                {/* Simple centered value text if large enough */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold text-white drop-shadow-md">{val}</span>
                                </div>
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
          </div>

          {/* Legend / Scale */}
          <div className="flex items-center justify-center mt-8 gap-4">
            <span className="text-xs text-zinc-500 font-mono">{minVal}</span>
            <div className="h-2 w-48 rounded-full bg-gradient-to-r from-[rgba(6,182,212,0.1)] to-[rgba(6,182,212,1)]" />
            <span className="text-xs text-zinc-500 font-mono">{maxVal}</span>
          </div>

        </div>
      </div>
    </VisualizationContainer>
  );
}
