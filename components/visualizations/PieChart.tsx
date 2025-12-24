"use client";

import React, { useRef } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChartData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface PieChartProps {
  data: PieChartData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/50 p-3 rounded-xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="text-zinc-200 text-sm font-medium">
            {data.name}: {data.value} ({data.percent ? (data.percent * 100).toFixed(0) : 0}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function PieChart({ data }: PieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-6 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data.data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                  className="transition-all duration-300 hover:opacity-80 outline-none"
                  stroke="rgba(0,0,0,0)"
                  strokeWidth={0}
                  style={{ filter: `drop-shadow(0 0 10px ${entry.color || COLORS[index % COLORS.length]}40)` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-zinc-400 text-sm ml-1">{value}</span>
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </VisualizationContainer>
  );
}
