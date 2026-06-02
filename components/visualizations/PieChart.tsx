"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
import type { PieChartData } from "@/lib/types/visualization";

interface PieChartProps {
  data: PieChartData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316","#6366f1","#14b8a6"];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#e4e4e7" fontSize={14} fontWeight={700}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#a1a1aa" fontSize={12}>
        {value} ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-xs font-bold text-white">{d.name}</p>
      <p className="text-xs text-zinc-400">Value: <span className="text-white font-bold">{d.value}</span></p>
      <p className="text-xs text-zinc-400">Share: <span className="text-white font-bold">{(d.percent * 100).toFixed(1)}%</span></p>
    </div>
  );
};

export default function PieChart({ data }: PieChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | undefined>(undefined);
  if (!data?.data?.length) return null;

  const isDoughnut = data.data.length >= 4;

  return (
    <div className="w-full h-full p-6">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Pie {...{
            data: data.data,
            cx: "50%", cy: "50%",
            innerRadius: isDoughnut ? "40%" : 0,
            outerRadius: "65%",
            dataKey: "value",
            activeIndex: activeIdx,
            activeShape: renderActiveShape,
            onMouseEnter: (_: unknown, idx: number) => setActiveIdx(idx),
            onMouseLeave: () => setActiveIdx(undefined),
            strokeWidth: 0,
          } as any}>
            {data.data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.color || COLORS[i % COLORS.length]}
                fillOpacity={activeIdx === undefined || activeIdx === i ? 0.9 : 0.45}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
            formatter={(value) => <span style={{ color: "#a1a1aa" }}>{value}</span>}
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}
