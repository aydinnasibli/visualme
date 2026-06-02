"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, GripVertical, Link2 } from "lucide-react";
import type { VisualizationType } from "@/lib/types/visualization";

export interface WidgetHandle {
  zoomIn?: () => void;
  zoomOut?: () => void;
  fit?: () => void;
}

interface WidgetWrapperProps {
  id: string;
  title: string;
  type: VisualizationType;
  onClose: () => void;
  onConnect?: (id: string) => void;
  isConnecting?: boolean;
  isConnectionSource?: boolean;
  widgetHandle?: WidgetHandle | null;
  children: React.ReactNode;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  network_graph:        { icon: "🕸️",  color: "#8b5cf6" },
  mind_map:             { icon: "🧠",  color: "#a855f7" },
  tree_diagram:         { icon: "🌳",  color: "#10b981" },
  timeline:             { icon: "📅",  color: "#06b6d4" },
  gantt_chart:          { icon: "📊",  color: "#6366f1" },
  animated_timeline:    { icon: "🎬",  color: "#ec4899" },
  flowchart:            { icon: "🔀",  color: "#14b8a6" },
  sankey_diagram:       { icon: "🌊",  color: "#06b6d4" },
  swimlane_diagram:     { icon: "🏊",  color: "#0ea5e9" },
  line_chart:           { icon: "📈",  color: "#10b981" },
  bar_chart:            { icon: "📊",  color: "#f59e0b" },
  scatter_plot:         { icon: "⚫",  color: "#6366f1" },
  heatmap:              { icon: "🔥",  color: "#ef4444" },
  radar_chart:          { icon: "🎯",  color: "#8b5cf6" },
  pie_chart:            { icon: "🥧",  color: "#f97316" },
  comparison_table:     { icon: "📋",  color: "#64748b" },
  parallel_coordinates: { icon: "📏",  color: "#a78bfa" },
  word_cloud:           { icon: "☁️",  color: "#06b6d4" },
  syntax_diagram:       { icon: "🛤️",  color: "#84cc16" },
};

const ZOOMABLE = new Set(["network_graph","mind_map","tree_diagram","flowchart","sankey_diagram","swimlane_diagram"]);

export default function WidgetWrapper({
  id, title, type, onClose, onConnect,
  isConnecting, isConnectionSource, widgetHandle, children,
}: WidgetWrapperProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meta = TYPE_META[type] ?? { icon: "📊", color: "#6366f1" };
  const canZoom = ZOOMABLE.has(type) && widgetHandle;
  const accentColor = isConnectionSource ? "#8b5cf6" : meta.color;

  return (
    <motion.div
      className="w-full h-full flex flex-col rounded-2xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: "rgba(13, 17, 23, 0.96)",
        border: `1px solid ${isConnectionSource ? "#8b5cf6" : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered
          ? `0 0 0 1px ${accentColor}20, 0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)`
          : "0 8px 32px rgba(0,0,0,0.4)",
        cursor: isConnecting ? "crosshair" : "default",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onClick={() => isConnecting && onConnect?.(id)}
    >
      {/* Accent stripe on left edge */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${accentColor}cc, ${accentColor}40)`,
          opacity: hovered || isConnectionSource ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />

      {/* ── Header ── */}
      <div
        className="drag-handle flex items-center gap-2 px-3 py-0 flex-shrink-0 select-none group/header"
        style={{
          height: 38,
          background: "rgba(255,255,255,0.025)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          cursor: "grab",
        }}
      >
        {/* Grip icon */}
        <GripVertical
          className="w-3 h-3 flex-shrink-0 transition-opacity"
          style={{ color: "#3f3f46", opacity: hovered ? 1 : 0.4 }}
        />

        {/* Type icon */}
        <span className="text-sm flex-shrink-0 leading-none">{meta.icon}</span>

        {/* Title */}
        <span
          className="text-xs font-semibold truncate flex-1"
          style={{ color: "#d4d4d8" }}
          title={title}
        >
          {title}
        </span>

        {/* Controls — slide in on hover */}
        <motion.div
          className="flex items-center gap-0.5 flex-shrink-0"
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 4 }}
          transition={{ duration: 0.15 }}
        >
          {/* Connect button */}
          {onConnect && (
            <HeaderBtn
              title="Connect to widget"
              onClick={(e) => { e.stopPropagation(); onConnect(id); }}
              active={isConnectionSource}
              color="#8b5cf6"
            >
              <Link2 className="w-3 h-3" />
            </HeaderBtn>
          )}

          {canZoom && (
            <>
              <HeaderBtn title="Zoom out" onClick={() => widgetHandle?.zoomOut?.()}>
                <ZoomOut className="w-3 h-3" />
              </HeaderBtn>
              <HeaderBtn title="Fit view" onClick={() => widgetHandle?.fit?.()}>
                <RotateCcw className="w-3 h-3" />
              </HeaderBtn>
              <HeaderBtn title="Zoom in" onClick={() => widgetHandle?.zoomIn?.()}>
                <ZoomIn className="w-3 h-3" />
              </HeaderBtn>
            </>
          )}

          <div className="w-px h-3 bg-white/10 mx-0.5" />

          <HeaderBtn title="Expand" onClick={() => setExpanded(true)}>
            <Maximize2 className="w-3 h-3" />
          </HeaderBtn>

          <HeaderBtn title="Remove" onClick={onClose} danger>
            <X className="w-3 h-3" />
          </HeaderBtn>
        </motion.div>
      </div>

      {/* ── Body ── (hidden when fullscreen so children only mount once) */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {!expanded && children}
      </div>

      {/* ── Fullscreen overlay ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-[9999] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10, 11, 15, 0.98)",
              border: `1px solid ${meta.color}30`,
              boxShadow: `0 0 0 1px ${meta.color}20, 0 40px 120px rgba(0,0,0,0.8)`,
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Fullscreen header */}
            <div
              className="flex items-center gap-3 px-4 flex-shrink-0"
              style={{ height: 52, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-base">{meta.icon}</span>
              <span className="text-sm font-semibold text-zinc-200 flex-1">{title}</span>
              {canZoom && (
                <div className="flex items-center gap-1 mr-2">
                  <HeaderBtn title="Zoom out" onClick={() => widgetHandle?.zoomOut?.()}>
                    <ZoomOut className="w-3.5 h-3.5" />
                  </HeaderBtn>
                  <HeaderBtn title="Fit view" onClick={() => widgetHandle?.fit?.()}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </HeaderBtn>
                  <HeaderBtn title="Zoom in" onClick={() => widgetHandle?.zoomIn?.()}>
                    <ZoomIn className="w-3.5 h-3.5" />
                  </HeaderBtn>
                </div>
              )}
              <HeaderBtn title="Close fullscreen" onClick={() => setExpanded(false)} danger>
                <Minimize2 className="w-3.5 h-3.5" />
              </HeaderBtn>
            </div>

            {/* Fullscreen body */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Shared button ── */
function HeaderBtn({
  children, title, onClick, active, danger, color,
}: {
  children: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
  color?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-5 h-5 flex items-center justify-center rounded transition-all duration-100"
      style={{
        color: active ? (color ?? "#8b5cf6") : "#52525b",
        background: active ? `${color ?? "#8b5cf6"}20` : "transparent",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = danger ? "rgba(239,68,68,0.15)" : active ? `${color ?? "#8b5cf6"}30` : "rgba(255,255,255,0.08)";
        el.style.color = danger ? "#f87171" : active ? (color ?? "#a78bfa") : "#d4d4d8";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = active ? `${color ?? "#8b5cf6"}20` : "transparent";
        el.style.color = active ? (color ?? "#8b5cf6") : "#52525b";
      }}
    >
      {children}
    </button>
  );
}
