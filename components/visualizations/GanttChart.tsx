"use client";

import React, { useState, useMemo } from "react";
import { GanttChartData, GanttTask } from "@/lib/types/visualization";
import { X, ZoomIn, ZoomOut, Calendar } from "lucide-react";

interface GanttChartProps {
  data: GanttChartData;
  readOnly?: boolean;
}

type ViewMode = "Day" | "Week" | "Month" | "Year";

export default function GanttChart({ data, readOnly = false }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [zoom, setZoom] = useState(1);

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

    // Calculate column width based on view mode and zoom
    let colWidth = 40;
    let cols: { date: Date; label: string }[] = [];

    switch (viewMode) {
      case "Day":
        colWidth = 50 * zoom;
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
        colWidth = 80 * zoom;
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
        colWidth = 100 * zoom;
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
        colWidth = 120 * zoom;
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
  }, [data.tasks, viewMode, zoom]);

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

  // Build task map and dependencies
  const taskMap = useMemo(() => {
    const map = new Map<string, { task: GanttTask; index: number }>();
    data.tasks.forEach((task, index) => {
      map.set(task.id, { task, index });
    });
    return map;
  }, [data.tasks]);

  // Calculate today position
  const getTodayPosition = () => {
    const today = new Date();
    const todayDiff = Math.abs(today.getTime() - startDate.getTime());
    const todayDays = Math.ceil(todayDiff / (1000 * 60 * 60 * 24));

    switch (viewMode) {
      case "Day":
        return todayDays * columnWidth;
      case "Week":
        return (todayDays / 7) * columnWidth;
      case "Month":
        return (todayDays / 30) * columnWidth;
      case "Year":
        return (todayDays / 365) * columnWidth;
      default:
        return 0;
    }
  };

  const rowHeight = 50;
  const headerHeight = 60;
  const taskNameWidth = 200;
  const chartHeight = data.tasks.length * rowHeight + headerHeight + 20;
  const chartWidth = Math.max(columns.length * columnWidth, 600);

  const handleReset = () => {
    setViewMode("Week");
    setZoom(1);
    setSelectedTask(null);
  };

  return (
    <div className="w-full h-[800px] bg-[#0f1419] rounded-2xl border border-zinc-800/50 relative overflow-hidden shadow-2xl">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header with Controls */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#141922]">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Gantt Chart</h3>
          <span className="text-sm text-zinc-500">
            {data.tasks.length} task{data.tasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-700">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-700">
            {(["Day", "Week", "Month", "Year"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all text-xs font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100%-60px)]">
        {/* Task Names Sidebar */}
        <div className="w-[200px] border-r border-zinc-800 bg-[#0f1419] overflow-y-auto custom-scrollbar flex-shrink-0">
          {/* Header */}
          <div
            className="sticky top-0 z-20 bg-[#1a1f28] border-b border-zinc-800 flex items-center px-4"
            style={{ height: headerHeight }}
          >
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Tasks
            </span>
          </div>

          {/* Task List */}
          {data.tasks.map((task, index) => {
            const color = getTaskColor(task.type);
            const isSelected = selectedTask?.id === task.id;
            const isHovered = hoveredTask === task.id;

            return (
              <div
                key={task.id}
                className={`px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-zinc-800/50"
                    : isHovered
                    ? "bg-zinc-900/50"
                    : ""
                }`}
                style={{ height: rowHeight }}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">
                      {task.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {task.progress}% complete
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Area */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="relative" style={{ minWidth: chartWidth }}>
            <svg
              width={chartWidth}
              height={chartHeight}
              className="w-full"
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
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
                </marker>
              </defs>

              <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

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

              {/* Today Indicator */}
              {(() => {
                const todayX = getTodayPosition();
                const today = new Date();
                if (
                  todayX >= 0 &&
                  todayX <= chartWidth &&
                  today >= startDate &&
                  today <= endDate
                ) {
                  return (
                    <g>
                      <line
                        x1={todayX}
                        y1={headerHeight}
                        x2={todayX}
                        y2={chartHeight}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                      />
                      <circle
                        cx={todayX}
                        cy={headerHeight - 10}
                        r="4"
                        fill="#ef4444"
                      />
                      <text
                        x={todayX}
                        y={headerHeight - 20}
                        textAnchor="middle"
                        fill="#ef4444"
                        fontSize="10"
                        fontWeight="600"
                      >
                        TODAY
                      </text>
                    </g>
                  );
                }
                return null;
              })()}

              {/* Dependency Arrows */}
              {data.tasks.map((task) => {
                if (!task.dependencies || task.dependencies.length === 0)
                  return null;

                const targetPos = getTaskPosition(task);
                const targetIndex = taskMap.get(task.id)?.index ?? 0;
                const targetY = headerHeight + targetIndex * rowHeight + 25;

                return task.dependencies.map((depId) => {
                  const dep = taskMap.get(depId);
                  if (!dep) return null;

                  const sourcePos = getTaskPosition(dep.task);
                  const sourceY = headerHeight + dep.index * rowHeight + 25;

                  const startX = sourcePos.x + sourcePos.width;
                  const startY = sourceY;
                  const endX = targetPos.x;
                  const endY = targetY;

                  const midX = (startX + endX) / 2;
                  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                  return (
                    <path
                      key={`${depId}-${task.id}`}
                      d={path}
                      stroke="#64748b"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      opacity="0.6"
                    />
                  );
                });
              })}

              {/* Tasks */}
              {data.tasks.map((task, index) => {
                const { x, width } = getTaskPosition(task);
                const y = headerHeight + index * rowHeight + 10;
                const barHeight = 30;
                const color = getTaskColor(task.type);
                const isHovered = hoveredTask === task.id;
                const isSelected = selectedTask?.id === task.id;
                const isMilestone = task.type === "milestone";

                return (
                  <g
                    key={task.id}
                    onMouseEnter={() => setHoveredTask(task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    onClick={() => setSelectedTask(task)}
                    className="cursor-pointer transition-all"
                  >
                    {isMilestone ? (
                      <>
                        <polygon
                          points={`${x + width / 2},${y} ${x + width},${
                            y + barHeight / 2
                          } ${x + width / 2},${y + barHeight} ${x},${
                            y + barHeight / 2
                          }`}
                          fill={color}
                          opacity={isSelected ? 1 : isHovered ? 0.9 : 0.8}
                          stroke={isSelected || isHovered ? "#fff" : color}
                          strokeWidth={isSelected ? "3" : isHovered ? "3" : "2"}
                          className="transition-all duration-200"
                        />
                        <text
                          x={x + width / 2}
                          y={y + barHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="600"
                          className="pointer-events-none"
                        >
                          ⬥
                        </text>
                      </>
                    ) : (
                      <>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={barHeight}
                          fill={color}
                          opacity={isSelected ? 1 : isHovered ? 0.9 : 0.7}
                          rx="4"
                          stroke={isSelected || isHovered ? "#fff" : color}
                          strokeWidth={isSelected ? "2" : isHovered ? "2" : "1"}
                          className="transition-all duration-200"
                        />

                        {task.progress > 0 && (
                          <rect
                            x={x}
                            y={y}
                            width={(width * task.progress) / 100}
                            height={barHeight}
                            fill="#60a5fa"
                            opacity="0.8"
                            rx="4"
                            className="pointer-events-none"
                          />
                        )}

                        {width > 60 && (
                          <text
                            x={x + 8}
                            y={y + barHeight / 2}
                            dominantBaseline="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="500"
                            className="pointer-events-none"
                          >
                            {task.name.length > 15
                              ? task.name.substring(0, 15) + "..."
                              : task.name}
                          </text>
                        )}
                      </>
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl w-full max-w-lg mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getTaskColor(selectedTask.type) }}
                />
                <h3 className="text-lg font-semibold text-white">
                  Task Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  {selectedTask.name}
                </h4>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: getTaskColor(selectedTask.type) + "20",
                    color: getTaskColor(selectedTask.type),
                  }}
                >
                  {selectedTask.type || "task"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Start Date</p>
                  <p className="text-sm text-white font-medium">
                    {new Date(selectedTask.start).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">End Date</p>
                  <p className="text-sm text-white font-medium">
                    {new Date(selectedTask.end).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-2">Progress</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {selectedTask.progress}%
                  </span>
                </div>
              </div>

              {selectedTask.dependencies &&
                selectedTask.dependencies.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Dependencies</p>
                    <div className="space-y-2">
                      {selectedTask.dependencies.map((depId) => {
                        const depTask = taskMap.get(depId)?.task;
                        if (!depTask) return null;
                        return (
                          <div
                            key={depId}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: getTaskColor(depTask.type),
                              }}
                            />
                            <span className="text-sm text-zinc-300">
                              {depTask.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div>
                <p className="text-xs text-zinc-500 mb-1">Duration</p>
                <p className="text-sm text-white">
                  {Math.ceil(
                    (new Date(selectedTask.end).getTime() -
                      new Date(selectedTask.start).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-zinc-800">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
