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

export default function GanttChart({ data }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");

  useEffect(() => {
    if (containerRef.current && data.tasks.length > 0) {
      // Clear previous instance if any
      containerRef.current.innerHTML = "";

      // Format data for Frappe Gantt
      const tasks = data.tasks.map((t) => ({
        id: t.id,
        name: t.name,
        start: t.start,
        end: t.end,
        progress: t.progress,
        dependencies: t.dependencies?.join(", ") || "",
        custom_class: "gantt-chart-bar", // We will style this class globally or via injected styles
      }));

      // Initialize Frappe Gantt
      ganttRef.current = new Gantt(containerRef.current, tasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
        bar_height: 30,
        bar_corner_radius: 8,
        arrow_curve: 5,
        padding: 18,
        view_mode: viewMode,
        date_format: "YYYY-MM-DD",
        custom_popup_html: function (task: any) {
          // Custom tooltip html matching our design system
          return `
            <div class="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs z-50 w-64">
              <div class="font-bold text-white mb-1">${task.name}</div>
              <div class="text-zinc-400 mb-2">
                ${task._start.toLocaleDateString()} - ${task._end.toLocaleDateString()}
              </div>
              <div class="w-full bg-zinc-800 rounded-full h-1.5 mb-1">
                <div class="bg-purple-500 h-1.5 rounded-full" style="width: ${task.progress}%"></div>
              </div>
              <div class="text-right text-zinc-500 font-mono">${task.progress}%</div>
            </div>
          `;
        },
      });
    }
  }, [data, viewMode]);

  return (
    <VisualizationContainer>
      <div className="flex flex-col h-full w-full">
        {/* View Mode Controls */}
        <div className="absolute top-4 right-4 z-10 flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          {(["Day", "Week", "Month"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* CSS Overrides for Dark Mode / Neon Theme */}
        <style jsx global>{`
          .gantt .grid-background {
             fill: none;
          }
          .gantt .grid-header {
            fill: #27272a; /* zinc-800 background for header */
            stroke: #3f3f46; /* zinc-700 border */
          }
          .gantt .grid-header text {
            fill: #e4e4e7 !important; /* zinc-200 text */
          }
          .gantt .grid-row {
            fill: #09090b; /* zinc-950 */
            stroke: #27272a;
          }
          .gantt .grid-row:nth-child(even) {
            fill: #18181b; /* zinc-900 */
          }
          .gantt .row-line {
            stroke: #27272a;
          }
          .gantt .tick text {
            fill: #a1a1aa !important; /* zinc-400 */
            font-size: 11px;
            font-family: inherit;
          }
          .gantt .upper-text {
            fill: #e4e4e7 !important; /* zinc-200 */
            font-weight: 600;
          }
          .gantt .lower-text {
            fill: #a1a1aa !important;
          }

          /* Bars */
          .gantt .bar-wrapper {
            cursor: pointer;
          }
          .gantt .bar-group .bar {
            fill: #8b5cf6; /* purple-500 */
            stroke: #7c3aed; /* purple-600 */
            stroke-width: 0;
            filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.4));
          }
          .gantt .bar-progress {
            fill: #a78bfa; /* purple-400 */
          }
          .gantt .bar-label {
             fill: #fff;
             font-size: 12px;
             font-weight: bold;
          }

          /* Arrows/Dependencies */
          .gantt .arrow {
             stroke: #52525b; /* zinc-600 */
             stroke-width: 1.5;
          }

          /* Today Highlight */
          .gantt .today-highlight {
            fill: #fcd34d;
            opacity: 0.1;
          }

          /* Tooltip position fix */
          .gantt-container .popup-wrapper {
            opacity: 0;
            transform-origin: center bottom;
            transition: all 0.2s;
            pointer-events: none;
            background: #18181b;
            color: white;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #27272a;
          }
          .gantt-container .popup-wrapper .title {
             border-bottom: 1px solid #27272a;
             margin-bottom: 4px;
             padding-bottom: 4px;
          }
          .gantt-container .popup-wrapper .subtitle {
             color: #a1a1aa;
          }
        `}</style>

        {/* Chart Container */}
        <div
          className="flex-1 overflow-auto custom-scrollbar p-6 pt-16"
          ref={containerRef}
        />
      </div>
    </VisualizationContainer>
  );
}
