"use client";

import {
  ResponsiveContainer,
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { RadarChartData } from "@/lib/types/visualization";

interface RadarChartProps {
  data: RadarChartData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function RadarChart({ data }: RadarChartProps) {
  if (!data?.data?.length) return null;

  return (
    <div className="w-full h-full p-6">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart data={data.data} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {(data.metrics || ["value"]).map((key, i) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          ))}
          {(data.metrics?.length ?? 0) > 1 && (
            <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
          )}
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
