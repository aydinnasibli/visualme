"use client";

import { ZoomIn, ZoomOut, Maximize2, Trash2, Link2, Link2Off } from "lucide-react";

interface ToolbarProps {
  zoom: number;
  widgetCount: number;
  connectMode: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
  onClear: () => void;
  onToggleConnect: () => void;
}

export default function Toolbar({
  zoom,
  widgetCount,
  connectMode,
  onZoomIn,
  onZoomOut,
  onFitAll,
  onClear,
  onToggleConnect,
}: ToolbarProps) {
  if (widgetCount === 0) return null;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-2xl shadow-2xl"
      style={{
        background: "rgba(13, 17, 23, 0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Widget count badge */}
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-lg mr-1"
        style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
      >
        {widgetCount} widget{widgetCount !== 1 ? "s" : ""}
      </span>

      <Divider />

      {/* Zoom controls */}
      <Btn title="Zoom out (Ctrl −)" onClick={onZoomOut}>
        <ZoomOut className="w-3.5 h-3.5" />
      </Btn>

      <span
        className="text-xs font-mono px-2 tabular-nums"
        style={{ color: "#71717a", minWidth: 38, textAlign: "center" }}
      >
        {Math.round(zoom * 100)}%
      </span>

      <Btn title="Zoom in (Ctrl +)" onClick={onZoomIn}>
        <ZoomIn className="w-3.5 h-3.5" />
      </Btn>

      <Btn title="Fit all (reset zoom)" onClick={onFitAll}>
        <Maximize2 className="w-3.5 h-3.5" />
      </Btn>

      <Divider />

      {/* Connect mode */}
      <Btn
        title={connectMode ? "Exit connect mode" : "Connect widgets"}
        onClick={onToggleConnect}
        active={connectMode}
        activeColor="#8b5cf6"
      >
        {connectMode ? <Link2Off className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      </Btn>

      <Divider />

      {/* Clear all */}
      <Btn
        title="Clear canvas"
        onClick={() => { if (window.confirm('Clear all widgets from the canvas?')) onClear(); }}
        danger
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Btn>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />;
}

function Btn({
  children, title, onClick, active, activeColor, danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  danger?: boolean;
}) {
  const color = active ? (activeColor ?? "#8b5cf6") : danger ? "#ef4444" : "#71717a";
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-100"
      style={{
        color: active ? (activeColor ?? "#8b5cf6") : "#71717a",
        background: active ? `${activeColor ?? "#8b5cf6"}18` : "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = danger ? "#f87171" : active ? (activeColor ?? "#a78bfa") : "#e4e4e7";
        e.currentTarget.style.background = danger
          ? "rgba(239,68,68,0.12)"
          : active
          ? `${activeColor ?? "#8b5cf6"}28`
          : "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = active ? (activeColor ?? "#8b5cf6") : "#71717a";
        e.currentTarget.style.background = active ? `${activeColor ?? "#8b5cf6"}18` : "transparent";
      }}
    >
      {children}
    </button>
  );
}
