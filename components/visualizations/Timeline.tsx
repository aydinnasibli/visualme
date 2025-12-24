"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineData, TimelineItem } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";
import NodeDetailPanel from "./NodeDetailPanel";

interface TimelineProps {
  data: TimelineData;
  readOnly?: boolean;
}

export default function Timeline({ data, readOnly = false }: TimelineProps) {
  // Sort items by date
  const sortedItems = [...data.items].sort((a, b) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // Generate colors cyclically
  const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

  const handleReset = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  // Prepare node data for the detailed panel
  const getPanelData = () => {
    if (!selectedItem) return null;

    // Find index to reuse the same color logic
    const index = sortedItems.findIndex(i => i.id === selectedItem.id);
    const color = COLORS[index % COLORS.length];

    // Format date for description
    const dateStr = new Date(selectedItem.start).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const endDateStr = selectedItem.end
      ? ` - ${new Date(selectedItem.end).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`
      : '';

    return {
      id: selectedItem.id,
      label: selectedItem.content, // Content is usually short enough for label
      category: selectedItem.group || "Event",
      color: color,
      description: `Occurred on ${dateStr}${endDateStr}.`, // Generic description since Vis-timeline data is limited
      extendable: false, // Timelines usually static unless we add API support
      keyPoints: [],
      relatedConcepts: [],
      degree: 0,
    };
  };

  return (
    <VisualizationContainer onReset={handleReset}>
      {/* Header / Legend */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
          Chronology
        </h3>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center relative cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          const ele = containerRef.current;
          if (!ele) return;
          ele.style.cursor = 'grabbing';
          ele.style.userSelect = 'none';

          const startX = e.pageX - ele.offsetLeft;
          const scrollLeft = ele.scrollLeft;

          const mouseMoveHandler = (e: MouseEvent) => {
            const x = e.pageX - ele.offsetLeft;
            const walk = (x - startX) * 2; // Scroll-fast
            ele.scrollLeft = scrollLeft - walk;
          };

          const mouseUpHandler = () => {
            ele.style.cursor = 'grab';
            ele.style.removeProperty('user-select');
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
          };

          document.addEventListener('mousemove', mouseMoveHandler);
          document.addEventListener('mouseup', mouseUpHandler);
        }}
      >
        {/* The Central Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800/80 min-w-full transform -translate-y-1/2" />

        {/* Time Indicators (Ticks) - Simplified every 100px or so */}
        <div className="absolute top-1/2 left-0 right-0 min-w-full h-0 transform -translate-y-1/2 pointer-events-none">
           {/* We could render ticks based on date range, but for now lets rely on item dates */}
        </div>

        <div className="flex items-center px-10 min-w-max h-full pt-10 pb-10 gap-16">
          {sortedItems.map((item, index) => {
            const color = COLORS[index % COLORS.length];
            const isTop = index % 2 === 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: isTop ? 20 : -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative flex flex-col items-center group/item"
                style={{ width: 280 }}
              >
                {/* Connector Line */}
                <div
                  className={`absolute left-1/2 w-[2px] bg-gradient-to-b from-transparent to-transparent group-hover/item:bg-current transition-colors duration-300 ${
                    isTop
                      ? "bottom-1/2 h-16 origin-bottom"
                      : "top-1/2 h-16 origin-top"
                  }`}
                  style={{
                    backgroundColor: isTop ? undefined : undefined,
                    backgroundImage: isTop
                      ? `linear-gradient(to top, ${color}40, transparent)`
                      : `linear-gradient(to bottom, ${color}40, transparent)`,
                  }}
                />

                {/* Central Node */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-[3px] border-[#0f1419] transition-all duration-300 group-hover/item:scale-125 group-hover/item:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}60` }}
                  />
                </div>

                {/* Date Label on the line */}
                <div
                  className={`absolute left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap bg-[#0f1419] px-2 py-0.5 rounded-full border border-zinc-800/50 shadow-sm ${
                    isTop ? "top-[calc(50%+1.5rem)]" : "bottom-[calc(50%+1.5rem)]"
                  }`}
                >
                  {new Date(item.start).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>

                {/* Content Card */}
                <div
                  className={`relative w-full p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/40 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-900/60 hover:-translate-y-1 cursor-pointer ${
                    isTop ? "mb-20" : "mt-20"
                  }`}
                  style={{
                    order: isTop ? 0 : 2,
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                >
                  {/* Glowing border accent */}
                  <div
                    className="absolute inset-x-0 h-[1px] opacity-50"
                    style={{
                      top: isTop ? 'auto' : 0,
                      bottom: isTop ? 0 : 'auto',
                      background: `linear-gradient(90deg, transparent, ${color}, transparent)`
                    }}
                  />

                  <h4 className="text-sm font-bold text-white mb-2 line-clamp-2" title={item.content}>
                    {item.content}
                  </h4>

                  {item.group && (
                     <span
                       className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-zinc-800 text-zinc-400 border border-zinc-700/50 mb-2"
                     >
                       {item.group}
                     </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Add some padding at the end */}
          <div className="w-10 flex-shrink-0" />
        </div>
      </div>

      {/* Shared Details Panel */}
      <NodeDetailPanel
        selectedNode={getPanelData()}
        onClose={() => setSelectedItem(null)}
        readOnly={readOnly}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.7);
        }
      `}</style>
    </VisualizationContainer>
  );
}
