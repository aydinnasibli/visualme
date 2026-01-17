"use client";

import React from "react";
import { Maximize, Minus, Plus, RefreshCw } from "lucide-react";

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
        <RefreshCw className="w-5 h-5" />
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <Minus className="w-5 h-5" />
      </button>
      <span className="text-xs text-stone-300 font-mono px-2 min-w-[3rem] text-center">
        {Math.round(scale)}%
      </span>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <Plus className="w-5 h-5" />
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
        <Maximize className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toolbar;
