"use client";

import React, { useRef } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChartData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface BarChartProps {
  data: BarChartData;
  readOnly?: boolean;
}

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
              style={{ backgroundColor: entry.fill }}
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

export default function BarChart({ data }: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-6">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
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
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#27272a", opacity: 0.4 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-zinc-400 text-sm ml-1">{value}</span>
              )}
            />
            {data.bars.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={COLORS[index % COLORS.length]}
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              >
                {data.data.map((entry, cellIndex) => (
                  <Cell
                    key={`cell-${cellIndex}`}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.8}
                    className="transition-all duration-300 hover:opacity-100"
                  />
                ))}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationContainer>
  );
}
