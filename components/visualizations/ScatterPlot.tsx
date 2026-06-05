"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis,
  Cell,
} from "recharts";
import type { ScatterPlotData } from "@/lib/types/visualization";

interface ScatterPlotProps {
  data: ScatterPlotData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
      {d?.name && <p className="text-xs font-bold text-zinc-300 mb-1">{d.name}</p>}
      <p className="text-xs text-zinc-400">x: <span className="text-white font-bold">{d?.x}</span></p>
      <p className="text-xs text-zinc-400">y: <span className="text-white font-bold">{d?.y}</span></p>
      {d?.z !== undefined && <p className="text-xs text-zinc-400">z: <span className="text-white font-bold">{d.z}</span></p>}
    </div>
  );
};

const EmptyState = () => (
  <div className="w-full h-full flex items-center justify-center">
    <p className="text-zinc-500 text-sm">No data to display</p>
  </div>
);

export default function ScatterPlot({ data }: ScatterPlotProps) {
  if (!data?.data?.length) return <EmptyState />;

  // Group by category if present
  const categories = Array.from(new Set(data.data.map((d) => d.category || "default")));
  const grouped = categories.map((cat) => ({
    cat,
    points: data.data.filter((d) => (d.category || "default") === cat),
  }));

  return (
    <div className="w-full h-full p-6">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" dataKey="x" name="X" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
          <YAxis type="number" dataKey="y" name="Y" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
          <ZAxis type="number" dataKey="z" range={[40, 200]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#52525b" }} />
          {categories.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />}
          {grouped.map(({ cat, points }, i) => (
            <Scatter key={cat} name={cat === "default" ? "Data" : cat} data={points} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
