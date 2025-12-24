"use client";

import React, { useRef } from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { RadarChartData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface RadarChartProps {
  data: RadarChartData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/50 p-3 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="text-zinc-200 text-sm font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.stroke }}
            />
            <span className="text-zinc-300 text-xs">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RadarChart({ data }: RadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-6">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data.data}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "auto"]} // Ensure domain starts at 0
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
               wrapperStyle={{ paddingTop: "20px" }}
               iconType="circle"
               formatter={(value) => (
                 <span className="text-zinc-400 text-sm ml-1">{value}</span>
               )}
            />
            {data.metrics.map((metric, index) => (
              <Radar
                key={metric}
                name={metric}
                dataKey={metric}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationContainer>
  );
}
