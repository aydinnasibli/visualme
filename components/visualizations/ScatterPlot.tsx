"use client";

import React, { useRef } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { ScatterPlotData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface ScatterPlotProps {
  data: ScatterPlotData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/50 p-3 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="text-zinc-200 text-sm font-bold mb-1">{data.name}</p>
        <p className="text-zinc-400 text-xs">Category: {data.category}</p>
        <div className="flex gap-3 mt-2">
          <span className="text-zinc-300 text-xs">X: {data.x}</span>
          <span className="text-zinc-300 text-xs">Y: {data.y}</span>
          {data.z && <span className="text-zinc-300 text-xs">Z: {data.z}</span>}
        </div>
      </div>
    );
  }
  return null;
};

export default function ScatterPlot({ data }: ScatterPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group data by category for legend if available
  const categories = Array.from(new Set(data.data.map((d) => d.category || "Default")));

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-6">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              dataKey="x"
              name="X"
              stroke="#71717a"
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Y"
              stroke="#71717a"
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Z" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#52525b" }} />
            <Legend
               wrapperStyle={{ paddingTop: "20px" }}
               iconType="circle"
               formatter={(value) => (
                 <span className="text-zinc-400 text-sm ml-1">{value}</span>
               )}
            />
            {categories.map((category, index) => (
              <Scatter
                key={category}
                name={category}
                data={data.data.filter((d) => (d.category || "Default") === category)}
                fill={COLORS[index % COLORS.length]}
              >
                 {data.data.map((entry, i) => (
                    <Cell
                        key={`cell-${i}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}60)` }}
                    />
                 ))}
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </VisualizationContainer>
  );
}
