"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { TimelineData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

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

  // Generate colors cyclically
  const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

  const handleReset = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  return (
    <VisualizationContainer onReset={handleReset}>
      {/* Header / Legend could go here if needed */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
          Chronology
        </h3>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center relative"
      >
        {/* The Central Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800/80 min-w-full transform -translate-y-1/2" />

        <div className="flex items-center px-10 min-w-max h-full pt-10 pb-10 gap-8">
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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div
                    className="w-4 h-4 rounded-full border-[3px] border-[#0f1419] transition-all duration-300 group-hover/item:scale-125 group-hover/item:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}60` }}
                  />
                </div>

                {/* Date Label on the line */}
                <div
                  className={`absolute left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap ${
                    isTop ? "top-[calc(50%+1rem)]" : "bottom-[calc(50%+1rem)]"
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
                  className={`relative w-full p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/40 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-900/60 hover:-translate-y-1 ${
                    isTop ? "mb-12" : "mt-12"
                  }`}
                  style={{
                    order: isTop ? 0 : 2,
                  }}
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
