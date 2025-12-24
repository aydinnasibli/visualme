"use client";

import React, { useRef } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LineChartData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface LineChartProps {
  data: LineChartData;
  readOnly?: boolean;
}

// Neon color palette
const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/50 p-3 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="text-zinc-400 text-xs mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-zinc-200 text-sm font-medium">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LineChart({ data }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform data if needed, currently assuming standard Recharts format
  // data.data is Array<{ name: string, [key: string]: number }>
  // data.lines is Array<string> of keys to plot

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-6">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data.data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#71717a"
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46" }} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-zinc-400 text-sm ml-1">{value}</span>
              )}
            />
            {data.lines.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                dot={{
                  fill: "#09090b",
                  stroke: COLORS[index % COLORS.length],
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: COLORS[index % COLORS.length],
                  stroke: "#fff",
                  strokeWidth: 2,
                  r: 6,
                }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </VisualizationContainer>
  );
}
