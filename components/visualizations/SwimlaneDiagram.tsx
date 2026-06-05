"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { SwimlaneDiagramData } from "@/lib/types/visualization";

interface SwimlaneDiagramProps {
  data: SwimlaneDiagramData;
  readOnly?: boolean;
}

const LANE_COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#6366f1"];

export default function SwimlaneDiagram({ data }: SwimlaneDiagramProps) {
  const lanes = data?.lanes || [];
  const tasks = data?.tasks || [];

  // positions are 0-indexed; derive the total number of columns
  const maxPosition = useMemo(
    () => tasks.length ? Math.max(...tasks.map((t) => t.position)) + 1 : 1,
    [tasks]
  );

  const tasksByLane = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    lanes.forEach((l) => map.set(l.id, []));
    tasks.forEach((t) => {
      const arr = map.get(t.lane);
      if (arr) arr.push(t);
    });
    return map;
  }, [lanes, tasks]);

  if (!lanes.length) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-zinc-500 text-sm">No data to display</p>
    </div>
  );

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className="min-w-max">
        {/* Column headers */}
        <div className="flex mb-2 ml-36">
          {Array.from({ length: maxPosition }, (_, i) => (
            <div
              key={i}
              className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center"
              style={{ width: 160, minWidth: 160 }}
            >
              Step {i + 1}
            </div>
          ))}
        </div>

        {/* Lanes */}
        {lanes.map((lane, laneIdx) => {
          const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
          const laneTasks = tasksByLane.get(lane.id) || [];

          return (
            <div key={lane.id} className="flex mb-3">
              {/* Lane label */}
              <div
                className="flex items-center justify-center font-bold text-xs rounded-l-xl px-3 text-center"
                style={{
                  width: 140,
                  minWidth: 140,
                  background: `${color}22`,
                  border: `1px solid ${color}35`,
                  borderRight: "none",
                  color,
                  minHeight: 72,
                }}
              >
                {lane.name}
              </div>

              {/* Task grid */}
              <div
                className="flex border-t border-b border-r border-zinc-800 rounded-r-xl"
                style={{ background: `${color}06`, minHeight: 72, alignItems: "center" }}
              >
                {Array.from({ length: maxPosition }, (_, pos) => {
                  const task = laneTasks.find((t) => t.position === pos);
                  return (
                    <div
                      key={pos}
                      className="flex items-center justify-center p-2"
                      style={{ width: 160, minWidth: 160 }}
                    >
                      {task && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (laneIdx * maxPosition + pos) * 0.05 }}
                          className="w-full px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 text-center cursor-default"
                          style={{
                            background: `${color}22`,
                            border: `1px solid ${color}50`,
                          }}
                        >
                          {task.content}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrow connectors between sequential tasks (same lane) */}
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-600">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-zinc-600" />
          <span>Flow direction →</span>
        </div>
      </div>
    </div>
  );
}
