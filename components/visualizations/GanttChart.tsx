"use client";

import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import Gantt from "frappe-gantt";
import { GanttChartData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface GanttChartProps {
  data: GanttChartData;
  readOnly?: boolean;
}

type ViewMode = "Day" | "Week" | "Month" | "Year";

export default function GanttChart({ data, readOnly = false }: GanttChartProps) {
  const ganttRef = useRef<Gantt | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");

  useEffect(() => {
    if (!containerRef.current || !data.tasks.length) return;

    // Clear container
    containerRef.current.innerHTML = "";

    // Transform data for Frappe Gantt
    const tasks = data.tasks.map((t) => {
      // Ensure dates are Date objects or properly formatted strings
      const startDate = typeof t.start === 'string' ? t.start : t.start.toISOString().split('T')[0];
      const endDate = typeof t.end === 'string' ? t.end : t.end.toISOString().split('T')[0];

      return {
        id: t.id,
        name: t.name,
        start: startDate,
        end: endDate,
        progress: t.progress,
        dependencies: t.dependencies?.join(", ") || "",
        custom_class: t.type === "milestone" ? "bar-milestone" : t.type === "project" ? "bar-project" : "bar-task",
      };
    });

    try {
      // Initialize Frappe Gantt
      ganttRef.current = new Gantt(containerRef.current, tasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month", "Year"],
        bar_height: 25,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: viewMode,
        date_format: "YYYY-MM-DD",
        custom_popup_html: (task: any) => {
          // Custom tooltip
          return `
            <div class="gantt-tooltip-content">
              <div class="gantt-tooltip-header">${task.name}</div>
              <div class="gantt-tooltip-dates">
                ${task._start.toLocaleDateString()} - ${task._end.toLocaleDateString()}
              </div>
              <div class="gantt-tooltip-progress">
                Progress: ${task.progress}%
              </div>
            </div>
          `;
        },
        on_click: (task: any) => {
          console.log("Clicked", task);
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          if (readOnly) return;
          console.log("Date changed", task, start, end);
        },
        on_progress_change: (task: any, progress: number) => {
          if (readOnly) return;
          console.log("Progress changed", task, progress);
        },
        on_view_change: (mode: string) => {
          console.log("View change", mode);
        },
      });

      // Apply view mode
      ganttRef.current.change_view_mode(viewMode);
    } catch (error) {
      console.error("Error initializing Gantt chart:", error);
    }

    // Cleanup function
    return () => {
      if (ganttRef.current && containerRef.current) {
        containerRef.current.innerHTML = "";
        ganttRef.current = null;
      }
    };
  }, [data, viewMode, readOnly]);

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
          {/* We need a specific wrapper for frappe-gantt to attach to */}
          <div
            ref={containerRef}
            className="frappe-gantt-wrapper bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 shadow-xl overflow-auto min-h-[400px]"
          />
        </div>
      </div>

      <style jsx global>{`
        /* FRAPPE GANTT BASE STYLES */
        .gantt-container {
          line-height: 14.5px;
          position: relative;
          overflow: auto;
          font-size: 12px;
          width: 100%;
          border-radius: 8px;
        }

        .gantt {
          user-select: none;
          -webkit-user-select: none;
          position: relative;
        }

        .gantt .grid-background {
          fill: none;
        }

        .gantt .bar-wrapper {
          cursor: pointer;
        }

        .gantt .bar-wrapper:hover .bar {
          transition: transform 0.3s ease;
        }

        .gantt .handle {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .gantt .handle.active,
        .gantt .handle.visible {
          cursor: ew-resize;
          opacity: 1;
        }

        /* FRAPPE GANTT CUSTOM STYLES - DARK MODE SLEEK */

        .gantt .grid-header {
          fill: #1a1f28;
          stroke: #282e39;
        }

        .gantt .grid-row {
          fill: transparent;
        }

        .gantt .grid-row:nth-child(even) {
          fill: rgba(255, 255, 255, 0.02);
        }

        .gantt .row-line {
          stroke: #282e39;
        }

        .gantt .tick {
          stroke: #282e39;
        }

        .gantt .today-highlight {
          fill: rgba(59, 130, 246, 0.1);
        }

        /* Text */
        .gantt .bar-label {
          fill: #cbd5e1;
          font-family: inherit;
          font-size: 12px;
        }

        .gantt .lower-text, .gantt .upper-text {
          fill: #9ca3af;
          font-family: inherit;
        }

        .gantt .upper-text {
          font-weight: 600;
          font-size: 14px;
        }

        /* Bars */
        .gantt .bar {
          fill: #3b82f6; /* blue-500 */
          stroke: #2563eb; /* blue-600 */
        }

        .gantt .bar-progress {
          fill: #60a5fa; /* blue-400 */
        }

        /* Bar Types */
        .gantt .bar-milestone .bar {
          fill: #ec4899; /* pink-500 */
        }
        .gantt .bar-project .bar {
          fill: #8b5cf6; /* violet-500 */
        }

        /* Arrows */
        .gantt .arrow {
          stroke: #64748b;
          stroke-width: 1.5;
        }

        /* Popup / Tooltip */
        .gantt-container .popup-wrapper {
          background-color: #0f1419 !important;
          color: #f1f5f9 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
          border: 1px solid #334155 !important;
          border-radius: 0.5rem !important;
          padding: 0 !important;
          opacity: 1 !important;
          transition: opacity 0.2s !important;
        }

        .gantt-container .popup-wrapper.active {
          opacity: 1 !important;
        }

        .gantt-tooltip-content {
          padding: 12px;
          min-width: 200px;
        }

        .gantt-tooltip-header {
          font-weight: bold;
          margin-bottom: 4px;
          color: #fff;
          font-size: 14px;
        }

        .gantt-tooltip-dates {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .gantt-tooltip-progress {
          color: #3b82f6;
          font-size: 12px;
          font-weight: 500;
        }

        /* Scrollbar fix for the svg container */
        .frappe-gantt-wrapper {
          overflow: auto;
        }

        /* Hide default scrollbars but allow scrolling */
        .frappe-gantt-wrapper::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .frappe-gantt-wrapper::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.3);
        }
        .frappe-gantt-wrapper::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.5);
          border-radius: 4px;
        }
      `}</style>
    </VisualizationContainer>
  );
}
