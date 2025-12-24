"use client";

import React, { useState, useMemo } from "react";
import { GanttChartData, GanttTask } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface GanttChartProps {
  data: GanttChartData;
  readOnly?: boolean;
}

type ViewMode = "Day" | "Week" | "Month" | "Year";

export default function GanttChart({ data, readOnly = false }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Calculate time scale based on view mode
  const { startDate, endDate, totalDays, columnWidth, columns } = useMemo(() => {
    if (!data.tasks.length) {
      return {
        startDate: new Date(),
        endDate: new Date(),
        totalDays: 0,
        columnWidth: 0,
        columns: [],
      };
    }

    // Find min and max dates
    const dates = data.tasks.flatMap((t) => [
      new Date(t.start),
      new Date(t.end),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    const start = new Date(minDate);
    const end = new Date(maxDate);
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() + 1);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate column width based on view mode
    let colWidth = 40;
    let cols: { date: Date; label: string }[] = [];

    switch (viewMode) {
      case "Day":
        colWidth = 50;
        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          cols.push({
            date: d,
            label: d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          });
        }
        break;
      case "Week":
        colWidth = 80;
        const weeks = Math.ceil(diffDays / 7);
        for (let i = 0; i < weeks; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i * 7);
          cols.push({
            date: d,
            label: `Week ${i + 1}`,
          });
        }
        break;
      case "Month":
        colWidth = 100;
        const months = Math.ceil(diffDays / 30);
        for (let i = 0; i < months; i++) {
          const d = new Date(start);
          d.setMonth(d.getMonth() + i);
          cols.push({
            date: d,
            label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          });
        }
        break;
      case "Year":
        colWidth = 120;
        const years = Math.ceil(diffDays / 365);
        for (let i = 0; i < years; i++) {
          const d = new Date(start);
          d.setFullYear(d.getFullYear() + i);
          cols.push({ date: d, label: d.getFullYear().toString() });
        }
        break;
    }

    return {
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      columnWidth: colWidth,
      columns: cols,
    };
  }, [data.tasks, viewMode]);

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);

    const startDiff = Math.abs(taskStart.getTime() - startDate.getTime());
    const startDays = Math.ceil(startDiff / (1000 * 60 * 60 * 24));

    const duration =
      Math.abs(taskEnd.getTime() - taskStart.getTime()) /
      (1000 * 60 * 60 * 24);

    let x, width;
    switch (viewMode) {
      case "Day":
        x = startDays * columnWidth;
        width = duration * columnWidth;
        break;
      case "Week":
        x = (startDays / 7) * columnWidth;
        width = (duration / 7) * columnWidth;
        break;
      case "Month":
        x = (startDays / 30) * columnWidth;
        width = (duration / 30) * columnWidth;
        break;
      case "Year":
        x = (startDays / 365) * columnWidth;
        width = (duration / 365) * columnWidth;
        break;
    }

    return { x, width: Math.max(width, 20) };
  };

  const getTaskColor = (type?: string) => {
    switch (type) {
      case "milestone":
        return "#ec4899"; // pink-500
      case "project":
        return "#8b5cf6"; // violet-500
      default:
        return "#3b82f6"; // blue-500
    }
  };

  const rowHeight = 50;
  const headerHeight = 60;
  const chartHeight = data.tasks.length * rowHeight + headerHeight + 20;
  const chartWidth = Math.max(columns.length * columnWidth, 800);

  return (
    <VisualizationContainer
      onReset={() => {
        setViewMode("Week");
      }}
    >
      <div className="flex flex-col h-full w-full bg-[#0f1419]">
        {/* Controls */}
        <div className="flex justify-end px-4 py-2 border-b border-zinc-800 bg-[#141922]">
          <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-700">
            {(["Day", "Week", "Month", "Year"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 overflow-auto custom-scrollbar p-4 relative">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 shadow-xl min-h-[400px] p-4">
            <svg
              width={chartWidth}
              height={chartHeight}
              className="w-full"
              style={{ minWidth: chartWidth }}
            >
              {/* Grid Background */}
              <defs>
                <pattern
                  id="grid"
                  width={columnWidth}
                  height={rowHeight}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${columnWidth} 0 L 0 0 0 ${rowHeight}`}
                    fill="none"
                    stroke="#282e39"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>

              <rect
                width={chartWidth}
                height={chartHeight}
                fill="url(#grid)"
              />

              {/* Header */}
              <rect
                x={0}
                y={0}
                width={chartWidth}
                height={headerHeight}
                fill="#1a1f28"
              />

              {/* Column Headers */}
              {columns.map((col, i) => (
                <g key={i}>
                  <line
                    x1={i * columnWidth}
                    y1={0}
                    x2={i * columnWidth}
                    y2={chartHeight}
                    stroke="#282e39"
                    strokeWidth="1"
                  />
                  <text
                    x={i * columnWidth + columnWidth / 2}
                    y={headerHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#9ca3af"
                    fontSize="12"
                    fontWeight="500"
                  >
                    {col.label}
                  </text>
                </g>
              ))}

              {/* Tasks */}
              {data.tasks.map((task, index) => {
                const { x, width } = getTaskPosition(task);
                const y = headerHeight + index * rowHeight + 10;
                const barHeight = 30;
                const color = getTaskColor(task.type);
                const isHovered = hoveredTask === task.id;

                return (
                  <g
                    key={task.id}
                    onMouseEnter={() => setHoveredTask(task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    className="cursor-pointer transition-all"
                  >
                    {/* Task Bar Background */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={barHeight}
                      fill={color}
                      opacity={isHovered ? 0.9 : 0.7}
                      rx="4"
                      stroke={isHovered ? "#fff" : color}
                      strokeWidth={isHovered ? "2" : "1"}
                      className="transition-all duration-200"
                    />

                    {/* Progress Bar */}
                    {task.progress > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={(width * task.progress) / 100}
                        height={barHeight}
                        fill="#60a5fa"
                        opacity="0.8"
                        rx="4"
                      />
                    )}

                    {/* Task Label */}
                    <text
                      x={x + 8}
                      y={y + barHeight / 2}
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {task.name}
                    </text>

                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x}
                          y={y - 60}
                          width="200"
                          height="55"
                          fill="#0f1419"
                          stroke="#334155"
                          strokeWidth="1"
                          rx="6"
                          filter="url(#shadow)"
                        />
                        <text
                          x={x + 10}
                          y={y - 45}
                          fill="#fff"
                          fontSize="13"
                          fontWeight="600"
                        >
                          {task.name}
                        </text>
                        <text
                          x={x + 10}
                          y={y - 28}
                          fill="#94a3b8"
                          fontSize="11"
                        >
                          {new Date(task.start).toLocaleDateString()} -{" "}
                          {new Date(task.end).toLocaleDateString()}
                        </text>
                        <text
                          x={x + 10}
                          y={y - 12}
                          fill="#3b82f6"
                          fontSize="11"
                          fontWeight="500"
                        >
                          Progress: {task.progress}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Shadow Filter */}
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="8"
                    floodColor="#000"
                    floodOpacity="0.3"
                  />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </VisualizationContainer>
  );
}
