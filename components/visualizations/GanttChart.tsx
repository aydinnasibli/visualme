"use client";

import React, { useState, useMemo, useCallback } from "react";
import { GanttChartData, GanttTask } from "@/lib/types/visualization";
import { X, ZoomIn, ZoomOut, Calendar } from "lucide-react";

interface GanttChartProps {
  data: GanttChartData;
}

type ViewMode = "Day" | "Week" | "Month" | "Year";

// Constants
const VIEW_MODE_CONFIG = {
  Day: { baseWidth: 50, divisor: 1 },
  Week: { baseWidth: 80, divisor: 7 },
  Month: { baseWidth: 100, divisor: 30 },
  Year: { baseWidth: 120, divisor: 365 },
} as const;

const TASK_COLORS = {
  milestone: "#ec4899", // pink-500
  project: "#8b5cf6", // violet-500
  task: "#3b82f6", // blue-500
} as const;

const LAYOUT_CONSTANTS = {
  rowHeight: 50,
  headerHeight: 60,
  taskNameWidth: 200,
  availableWidth: 1000,
  minChartWidth: 1000,
  barHeight: 30,
  taskYOffset: 10,
} as const;

export default function GanttChart({ data }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [zoom, setZoom] = useState(1);

  // Utility functions
  const getTaskColor = useCallback((type?: string): string => {
    if (type === "milestone") return TASK_COLORS.milestone;
    if (type === "project") return TASK_COLORS.project;
    return TASK_COLORS.task;
  }, []);

  const calculateDaysBetween = useCallback((start: Date, end: Date): number => {
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

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

    // Find min and max dates efficiently
    const dates = data.tasks.flatMap((t) => [new Date(t.start), new Date(t.end)]);
    const timestamps = dates.map((d) => d.getTime());
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    // Add padding
    const start = new Date(minDate);
    const end = new Date(maxDate);
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() + 1);

    const diffDays = Math.ceil(
      Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const config = VIEW_MODE_CONFIG[viewMode];
    const baseColWidth = config.baseWidth * zoom;
    const cols: { date: Date; label: string }[] = [];

    // Generate columns based on view mode
    const periodCount = Math.ceil(diffDays / config.divisor);

    for (let i = 0; i < periodCount; i++) {
      const d = new Date(start);

      switch (viewMode) {
        case "Day":
          d.setDate(d.getDate() + i);
          cols.push({
            date: d,
            label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          });
          break;
        case "Week":
          d.setDate(d.getDate() + i * 7);
          cols.push({ date: d, label: `Week ${i + 1}` });
          break;
        case "Month":
          d.setMonth(d.getMonth() + i);
          cols.push({
            date: d,
            label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          });
          break;
        case "Year":
          d.setFullYear(d.getFullYear() + i);
          cols.push({ date: d, label: d.getFullYear().toString() });
          break;
      }
    }

    // Always fill available width by distributing space across columns
    const finalColWidth = Math.max(
      baseColWidth,
      LAYOUT_CONSTANTS.availableWidth / cols.length
    );

    return {
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      columnWidth: finalColWidth,
      columns: cols,
    };
  }, [data.tasks, viewMode, zoom]);

  // Memoize task positions for performance
  const taskPositions = useMemo(() => {
    const positions = new Map<string, { x: number; width: number }>();

    data.tasks.forEach((task) => {
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);

      const startDays = calculateDaysBetween(startDate, taskStart);
      const duration = calculateDaysBetween(taskStart, taskEnd);

      const config = VIEW_MODE_CONFIG[viewMode];
      const x = (startDays / config.divisor) * columnWidth;
      const width = (duration / config.divisor) * columnWidth;

      positions.set(task.id, { x, width: Math.max(width, 20) });
    });

    return positions;
  }, [data.tasks, startDate, viewMode, columnWidth, calculateDaysBetween]);

  // Build task map and dependencies
  const taskMap = useMemo(() => {
    const map = new Map<string, { task: GanttTask; index: number }>();
    data.tasks.forEach((task, index) => {
      map.set(task.id, { task, index });
    });
    return map;
  }, [data.tasks]);

  // Memoize today position for performance
  const todayPosition = useMemo(() => {
    const today = new Date();
    const todayDays = calculateDaysBetween(startDate, today);
    const config = VIEW_MODE_CONFIG[viewMode];
    return (todayDays / config.divisor) * columnWidth;
  }, [startDate, viewMode, columnWidth, calculateDaysBetween]);

  // Chart dimensions
  const chartHeight =
    data.tasks.length * LAYOUT_CONSTANTS.rowHeight +
    LAYOUT_CONSTANTS.headerHeight +
    20;
  const chartWidth = Math.max(
    columns.length * columnWidth,
    LAYOUT_CONSTANTS.minChartWidth
  );

  // Event handlers
  const handleReset = useCallback(() => {
    setViewMode("Week");
    setZoom(1);
    setSelectedTask(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2, z + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z - 0.25));
  }, []);

  const handleTaskClick = useCallback((task: GanttTask) => {
    setSelectedTask(task);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

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
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
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
            style={{ height: LAYOUT_CONSTANTS.headerHeight }}
          >
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Tasks
            </span>
          </div>

          {/* Task List */}
          {data.tasks.map((task) => {
            const color = getTaskColor(task.type);
            const isSelected = selectedTask?.id === task.id;
            const isHovered = hoveredTask === task.id;
            const duration = calculateDaysBetween(
              new Date(task.start),
              new Date(task.end)
            );

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
                style={{ height: LAYOUT_CONSTANTS.rowHeight }}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
                onClick={() => handleTaskClick(task)}
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
                      {duration} days
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
                  height={LAYOUT_CONSTANTS.rowHeight}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${columnWidth} 0 L 0 0 0 ${LAYOUT_CONSTANTS.rowHeight}`}
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
                height={LAYOUT_CONSTANTS.headerHeight}
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
                    y={LAYOUT_CONSTANTS.headerHeight / 2}
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
                const today = new Date();
                const isInRange =
                  todayPosition >= 0 &&
                  todayPosition <= chartWidth &&
                  today >= startDate &&
                  today <= endDate;

                if (!isInRange) return null;

                return (
                  <g>
                    <line
                      x1={todayPosition}
                      y1={LAYOUT_CONSTANTS.headerHeight}
                      x2={todayPosition}
                      y2={chartHeight}
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.6"
                    />
                    <circle
                      cx={todayPosition}
                      cy={LAYOUT_CONSTANTS.headerHeight - 10}
                      r="4"
                      fill="#ef4444"
                    />
                    <text
                      x={todayPosition}
                      y={LAYOUT_CONSTANTS.headerHeight - 20}
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="10"
                      fontWeight="600"
                    >
                      TODAY
                    </text>
                  </g>
                );
              })()}

              {/* Dependency Arrows */}
              {data.tasks.map((task) => {
                if (!task.dependencies?.length) return null;

                const targetPos = taskPositions.get(task.id);
                if (!targetPos) return null;

                const targetIndex = taskMap.get(task.id)?.index ?? 0;
                const targetY =
                  LAYOUT_CONSTANTS.headerHeight +
                  targetIndex * LAYOUT_CONSTANTS.rowHeight +
                  25;

                return task.dependencies.map((depId) => {
                  const dep = taskMap.get(depId);
                  if (!dep) return null;

                  const sourcePos = taskPositions.get(dep.task.id);
                  if (!sourcePos) return null;

                  const sourceY =
                    LAYOUT_CONSTANTS.headerHeight +
                    dep.index * LAYOUT_CONSTANTS.rowHeight +
                    25;

                  // Start from end of source task
                  const startX = sourcePos.x + sourcePos.width;
                  const endX = targetPos.x;

                  // Only draw arrow if target is after source (valid dependency)
                  if (endX <= startX + 10) return null;

                  // Create smooth curved path
                  const horizontalGap = endX - startX;
                  const verticalGap = Math.abs(targetY - sourceY);
                  const controlOffset = Math.min(horizontalGap / 3, 50);

                  const path = `M ${startX} ${sourceY} C ${
                    startX + controlOffset
                  } ${sourceY}, ${endX - controlOffset} ${targetY}, ${endX} ${targetY}`;

                  return (
                    <path
                      key={`${depId}-${task.id}`}
                      d={path}
                      stroke="#64748b"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      opacity="0.5"
                      strokeDasharray={
                        verticalGap > LAYOUT_CONSTANTS.rowHeight * 2
                          ? "5,5"
                          : "none"
                      }
                    />
                  );
                });
              })}

              {/* Tasks */}
              {data.tasks.map((task, index) => {
                const position = taskPositions.get(task.id);
                if (!position) return null;

                const { x, width } = position;
                const y =
                  LAYOUT_CONSTANTS.headerHeight +
                  index * LAYOUT_CONSTANTS.rowHeight +
                  LAYOUT_CONSTANTS.taskYOffset;
                const color = getTaskColor(task.type);
                const isHovered = hoveredTask === task.id;
                const isSelected = selectedTask?.id === task.id;
                const isMilestone = task.type === "milestone";

                return (
                  <g
                    key={task.id}
                    onMouseEnter={() => setHoveredTask(task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    onClick={() => handleTaskClick(task)}
                    className="cursor-pointer transition-all"
                  >
                    {isMilestone ? (
                      <>
                        <polygon
                          points={`${x + width / 2},${y} ${x + width},${
                            y + LAYOUT_CONSTANTS.barHeight / 2
                          } ${x + width / 2},${y + LAYOUT_CONSTANTS.barHeight} ${x},${
                            y + LAYOUT_CONSTANTS.barHeight / 2
                          }`}
                          fill={color}
                          opacity={isSelected ? 1 : isHovered ? 0.9 : 0.8}
                          stroke={isSelected || isHovered ? "#fff" : color}
                          strokeWidth={isSelected ? "3" : isHovered ? "3" : "2"}
                          className="transition-all duration-200"
                        />
                        <text
                          x={x + width / 2}
                          y={y + LAYOUT_CONSTANTS.barHeight / 2}
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
                          height={LAYOUT_CONSTANTS.barHeight}
                          fill={color}
                          opacity={isSelected ? 1 : isHovered ? 0.9 : 0.7}
                          rx="4"
                          stroke={isSelected || isHovered ? "#fff" : color}
                          strokeWidth={isSelected ? "2" : isHovered ? "2" : "1"}
                          className="transition-all duration-200"
                        />

                        {width > 60 && (
                          <text
                            x={x + 8}
                            y={y + LAYOUT_CONSTANTS.barHeight / 2}
                            dominantBaseline="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="500"
                            className="pointer-events-none"
                          >
                            {task.name.length > 15
                              ? `${task.name.substring(0, 15)}...`
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
                onClick={handleCloseModal}
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
                    backgroundColor: `${getTaskColor(selectedTask.type)}20`,
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
                <p className="text-xs text-zinc-500 mb-1">Duration</p>
                <p className="text-sm text-white font-medium">
                  {calculateDaysBetween(
                    new Date(selectedTask.start),
                    new Date(selectedTask.end)
                  )}{" "}
                  days
                </p>
              </div>

              {(selectedTask.dependencies?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Dependencies</p>
                  <div className="space-y-2">
                    {selectedTask.dependencies?.map((depId) => {
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
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-zinc-800">
              <button
                onClick={handleCloseModal}
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
