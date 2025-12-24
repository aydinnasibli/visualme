"use client";

import React, { ReactNode } from "react";

interface VisualizationContainerProps {
  children: ReactNode;
  onReset?: () => void;
  onExport?: () => void;
  title?: string; // Optional title if we want to show it in the container
  className?: string;
}

export default function VisualizationContainer({
  children,
  onReset,
  onExport,
  className = "",
}: VisualizationContainerProps) {
  return (
    <div
      className={`w-full h-[800px] bg-[#0f1419] rounded-2xl border border-zinc-800/50 relative overflow-hidden shadow-2xl group ${className}`}
    >
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        {/* Subtle Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#4b5563 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/50 backdrop-blur-md transition-all text-sm font-semibold shadow-xl flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Reset View
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/50 backdrop-blur-md transition-all text-sm font-semibold shadow-xl flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export PNG
          </button>
        )}
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10">{children}</div>
    </div>
  );
}
