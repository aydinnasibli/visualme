"use client";

import React from "react";

interface ToolbarProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onPan?: () => void; // Optional if pan is toggleable
  scale?: number; // Current scale to display
}

const Toolbar = ({ onZoomIn, onZoomOut, onReset, scale = 100 }: ToolbarProps) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 glass-panel p-1.5 rounded-full shadow-2xl transition-transform hover:scale-105">
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors tooltip"
        title="Reset View"
        onClick={onReset}
      >
        <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
      <span className="text-xs text-stone-300 font-mono px-2 min-w-[3rem] text-center">
        {Math.round(scale)}%
      </span>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      {/*
        You might add Export/Share buttons here later.
        For now, let's keep it focused on view controls.
      */}
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"
        title="Fit to Screen"
        onClick={onReset}
      >
        <span className="material-symbols-outlined text-[20px]">fit_screen</span>
      </button>
    </div>
  );
};

export default Toolbar;
