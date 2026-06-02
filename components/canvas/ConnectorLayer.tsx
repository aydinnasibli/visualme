"use client";

import { useEffect, useRef, useState } from "react";

export interface CanvasConnection {
  id: string;
  fromId: string;
  toId: string;
}

interface ConnectorLayerProps {
  connections: CanvasConnection[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onRemove?: (id: string) => void;
}

interface Rect { left: number; top: number; width: number; height: number; }

function getWidgetRect(containerId: string, containerRef: React.RefObject<HTMLDivElement | null>): Rect | null {
  if (!containerRef.current) return null;
  const el = containerRef.current.querySelector(`[data-widget-id="${containerId}"]`);
  if (!el) return null;
  const containerRect = containerRef.current.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number): string {
  const cp1x = x1 + (x2 - x1) * 0.5;
  const cp2x = x1 + (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
}

export default function ConnectorLayer({ connections, containerRef, onRemove }: ConnectorLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<{ id: string; d: string; midX: number; midY: number }[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const compute = () => {
      const newPaths = connections.map((conn) => {
        const from = getWidgetRect(conn.fromId, containerRef);
        const to = getWidgetRect(conn.toId, containerRef);
        if (!from || !to) return null;

        const x1 = from.left + from.width;
        const y1 = from.top + from.height / 2;
        const x2 = to.left;
        const y2 = to.top + to.height / 2;
        const d = cubicBezier(x1, y1, x2, y2);
        return { id: conn.id, d, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 };
      }).filter(Boolean) as { id: string; d: string; midX: number; midY: number }[];
      setPaths(newPaths);
    };

    compute();
    const ro = new ResizeObserver(compute);
    const mo = new MutationObserver(compute);
    ro.observe(containerRef.current);
    mo.observe(containerRef.current, { childList: true, subtree: true, attributes: true });

    return () => { ro.disconnect(); mo.disconnect(); };
  }, [connections, containerRef]);

  if (!paths.length) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#8b5cf680" />
        </marker>
      </defs>
      {paths.map((p) => (
        <g key={p.id}>
          {/* Fat invisible hit area */}
          <path
            d={p.d}
            fill="none"
            stroke="transparent"
            strokeWidth={16}
            className="pointer-events-auto cursor-pointer"
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onRemove?.(p.id)}
          />
          {/* Visible line */}
          <path
            d={p.d}
            fill="none"
            stroke={hoveredId === p.id ? "#ef4444" : "#8b5cf680"}
            strokeWidth={hoveredId === p.id ? 2 : 1.5}
            strokeDasharray={hoveredId === p.id ? "none" : "6 3"}
            markerEnd="url(#arrowhead)"
            style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
          />
          {/* Delete hint on hover */}
          {hoveredId === p.id && (
            <g className="pointer-events-none">
              <circle cx={p.midX} cy={p.midY} r={10} fill="#1c1c24" stroke="#ef4444" strokeWidth={1} />
              <text x={p.midX} y={p.midY + 4} textAnchor="middle" fill="#ef4444" fontSize={12} fontWeight={700}>✕</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
