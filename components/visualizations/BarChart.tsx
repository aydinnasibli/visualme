"use client";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import type { BarChartData } from "@/lib/types/visualization";

interface BarChartProps {
  data: BarChartData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-xs font-bold text-zinc-300 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const EmptyState = () => (
  <div className="w-full h-full flex items-center justify-center">
    <p className="text-zinc-500 text-sm">No data to display</p>
  </div>
);

export default function BarChart({ data }: BarChartProps) {
  if (!data?.data?.length) return <EmptyState />;
  const bars = data.bars || ["value"];
  const multi = bars.length > 1;

  return (
    <div className="w-full h-full p-6">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data.data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }} barGap={4} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          {multi && <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />}
          {bars.map((key, i) => (
            <Bar key={key} dataKey={key} radius={[4, 4, 0, 0]} fill={COLORS[i % COLORS.length]}>
              {!multi &&
                data.data.map((_, ci) => (
                  <Cell key={ci} fill={COLORS[ci % COLORS.length]} fillOpacity={0.85} />
                ))}
            </Bar>
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
