"use client";

import {
  useCallback,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  useReactFlow,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { NetworkGraphData, NetworkNode } from "@/lib/types/visualization";
import { useExtendedNodes } from "@/lib/context/ExtendedNodesContext";
import NodeDetailPanel from "./NodeDetailPanel";

const CATEGORY_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

/* -------------------------------------------------------------------------- */
/* TYPES                                                                       */
/* -------------------------------------------------------------------------- */

interface NetworkGraphProps {
  data: NetworkGraphData;
  onExpand?: (nodeId: string, nodeLabel: string) => Promise<void>;
  readOnly?: boolean;
  visualizationKey?: string;
}

export interface NetworkGraphHandle {
  exportPNG: () => Promise<void>;
  getContainer: () => HTMLDivElement | null;
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface SelectedNodeInfo {
  id: string;
  label: string;
  category: string;
  description?: string;
  color: string;
  degree: number;
  extendable?: boolean;
  keyPoints?: string[];
  relatedConcepts?: string[];
}

interface NetworkNodeData extends Record<string, unknown> {
  label: string;
  category: string;
  color: string;
  description?: string;
  size: number;
  degree: number;
  extendable: boolean;
  dimmed: boolean;
  highlighted: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/* CUSTOM NODE                                                                 */
/* -------------------------------------------------------------------------- */

const NetworkNodeComponent = ({ id, data }: NodeProps) => {
  const d = data as NetworkNodeData;
  const color = d.color;
  const size = d.size ?? 40;

  return (
    <div
      onMouseEnter={() => d.onHover(id)}
      onMouseLeave={() => d.onHover(null)}
      onClick={() => d.onSelect(id)}
      className="cursor-pointer select-none"
      style={{ position: "relative", width: size, height: size }}
    >
      <Handle type="source" position={Position.Top} style={{ opacity: 0, width: 4, height: 4, top: "50%", left: "50%" }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 4, height: 4, top: "50%", left: "50%" }} />

      {/* Focus ring on hover */}
      {d.highlighted && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: `1px solid ${color}40`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Node disc */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: d.highlighted
            ? `${color}55`
            : `${color}30`,
          border: `1.5px solid ${color}${d.highlighted ? "ee" : "77"}`,
          boxShadow: d.highlighted
            ? `0 0 ${Math.round(size * 0.9)}px ${color}60, 0 0 ${Math.round(size * 0.35)}px ${color}90`
            : `0 0 ${Math.round(size * 0.55)}px ${color}35`,
          opacity: d.dimmed ? 0.07 : 1,
          transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease",
        }}
      />

      {/* Extendable dot */}
      {d.extendable && !d.dimmed && (
        <div
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 5px ${color}cc`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Label */}
      <div
        style={{
          position: "absolute",
          top: size + 7,
          left: "50%",
          transform: "translateX(-50%)",
          color: d.dimmed ? "transparent" : d.highlighted ? "#f4f4f5" : "#a1a1aa",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: "Inter, ui-sans-serif",
          pointerEvents: "none",
          transition: "color 0.18s ease",
        }}
      >
        {d.label}
      </div>
    </div>
  );
};

const nodeTypes = { networkNode: NetworkNodeComponent };

/* -------------------------------------------------------------------------- */
/* LAYOUT: simple force-relaxation                                             */
/* -------------------------------------------------------------------------- */

function computeForceLayout(
  rawNodes: NetworkNode[],
  rawEdges: { source: string; target: string }[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const n = rawNodes.length;
  if (n === 0) return positions;

  const pos: Record<string, { x: number; y: number }> = {};
  rawNodes.forEach((node, i) => {
    const angle = (i / n) * 2 * Math.PI;
    const radius = Math.max(200, n * 30);
    pos[node.id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

  for (let iter = 0; iter < 150; iter++) {
    const forces: Record<string, { fx: number; fy: number }> = {};
    rawNodes.forEach((node) => { forces[node.id] = { fx: 0, fy: 0 }; });

    // Repulsion
    for (let i = 0; i < rawNodes.length; i++) {
      for (let j = i + 1; j < rawNodes.length; j++) {
        const a = rawNodes[i].id;
        const b = rawNodes[j].id;
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 15000 / (dist * dist);
        forces[a].fx -= (dx / dist) * force;
        forces[a].fy -= (dy / dist) * force;
        forces[b].fx += (dx / dist) * force;
        forces[b].fy += (dy / dist) * force;
      }
    }

    // Attraction along edges
    rawEdges.forEach((e) => {
      if (!pos[e.source] || !pos[e.target]) return;
      const dx = pos[e.target].x - pos[e.source].x;
      const dy = pos[e.target].y - pos[e.source].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 250) * 0.05;
      forces[e.source].fx += (dx / dist) * force;
      forces[e.source].fy += (dy / dist) * force;
      forces[e.target].fx -= (dx / dist) * force;
      forces[e.target].fy -= (dy / dist) * force;
    });

    // Gravity
    rawNodes.forEach((node) => {
      forces[node.id].fx -= pos[node.id].x * 0.01;
      forces[node.id].fy -= pos[node.id].y * 0.01;
    });

    const damping = Math.max(0.1, 0.85 - iter * 0.004);
    rawNodes.forEach((node) => {
      pos[node.id].x += forces[node.id].fx * damping;
      pos[node.id].y += forces[node.id].fy * damping;
    });
  }

  rawNodes.forEach((node) => { positions.set(node.id, pos[node.id]); });
  return positions;
}

/* -------------------------------------------------------------------------- */
/* INNER COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const NetworkGraphInner = forwardRef<NetworkGraphHandle, NetworkGraphProps>(
  ({ data, onExpand, readOnly = false, visualizationKey = "default" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { fitView, zoomIn: rfZoomIn, zoomOut: rfZoomOut } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);
    const { addExtendedNode, isNodeExtended } = useExtendedNodes();

    const nodeDataMap = useMemo(() => {
      const map = new Map<string, NetworkNode>();
      data?.nodes?.forEach((n) => map.set(n.id, n));
      return map;
    }, [data]);

    const neighborMap = useMemo(() => {
      const map = new Map<string, Set<string>>();
      data?.nodes?.forEach((n) => map.set(n.id, new Set()));
      data?.edges?.forEach((e) => {
        map.get(e.source)?.add(e.target);
        map.get(e.target)?.add(e.source);
      });
      return map;
    }, [data]);

    const colorMap = useMemo(() => {
      const uniqueCats = Array.from(new Set(data?.nodes?.map((n) => n.category || "default")));
      const map = new Map<string, string>();
      uniqueCats.forEach((cat, i) => map.set(cat, CATEGORY_COLORS[i % CATEGORY_COLORS.length]));
      return map;
    }, [data]);

    const positions = useMemo(
      () => computeForceLayout(data?.nodes || [], data?.edges || []),
      [data]
    );

    const buildNodes = useCallback(
      (hovered: string | null): Node[] => {
        if (!data?.nodes) return [];
        const degrees: Record<string, number> = {};
        data.edges?.forEach((e) => {
          degrees[e.source] = (degrees[e.source] || 0) + 1;
          degrees[e.target] = (degrees[e.target] || 0) + 1;
        });
        const neighbors = hovered ? neighborMap.get(hovered) || new Set() : new Set();
        return data.nodes.map((node) => {
          const degree = degrees[node.id] || 0;
          const size = Math.min(55, 24 + Math.sqrt(degree) * 5);
          const color = node.color || colorMap.get(node.category || "default") || "#6366f1";
          const pos = positions.get(node.id) || { x: 0, y: 0 };
          const dimmed = hovered !== null && node.id !== hovered && !neighbors.has(node.id);
          const highlighted = node.id === hovered;
          return {
            id: node.id,
            type: "networkNode",
            position: { x: pos.x - size / 2, y: pos.y - size / 2 },
            data: {
              label: node.label,
              category: node.category || "General",
              color,
              description: node.description,
              size,
              degree,
              extendable: node.extendable || false,
              dimmed,
              highlighted,
              onHover: handleHoverRef.current,
              onSelect: handleSelectRef.current,
            } satisfies NetworkNodeData,
            draggable: true,
          };
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data, colorMap, positions, neighborMap]
    );

    const buildEdges = useCallback(
      (hovered: string | null): Edge[] => {
        if (!data?.edges) return [];
        return data.edges.map((edge, i) => ({
          id: edge.id || `e-${i}`,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          labelStyle: { fill: "#52525b", fontSize: 9, fontWeight: 400 },
          labelBgStyle: { fill: "transparent", fillOpacity: 0 },
          style: {
            stroke: hovered && (edge.source === hovered || edge.target === hovered)
              ? "#e4e4e7"
              : "#52525b",
            strokeWidth: hovered && (edge.source === hovered || edge.target === hovered) ? 2 : 1,
            opacity: hovered && edge.source !== hovered && edge.target !== hovered ? 0.05 : 0.65,
          },
        }));
      },
      [data]
    );

    // Use refs so stable callbacks inside buildNodes don't re-create on each render
    const handleHoverRef = useRef<(id: string | null) => void>(() => {});
    const handleSelectRef = useRef<(id: string) => void>(() => {});

    const handleHover = useCallback((id: string | null) => {
      const neighbors = id ? neighborMap.get(id) || new Set<string>() : new Set<string>();
      setNodes(prev => prev.map(node => ({
        ...node,
        data: {
          ...node.data,
          dimmed: id !== null && node.id !== id && !neighbors.has(node.id),
          highlighted: node.id === id,
        },
      })));
      setEdges(buildEdges(id));
    // setNodes/setEdges are stable refs from useNodesState/useEdgesState — declared below but safe in closure body
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildEdges, neighborMap]);

    const handleSelect = useCallback(
      (id: string) => {
        const node = nodeDataMap.get(id);
        if (!node) return;
        const degrees: Record<string, number> = {};
        data?.edges?.forEach((e) => {
          degrees[e.source] = (degrees[e.source] || 0) + 1;
          degrees[e.target] = (degrees[e.target] || 0) + 1;
        });
        setSelectedNode({
          id,
          label: node.label,
          category: node.category || "General",
          description: node.description,
          color: node.color || colorMap.get(node.category || "default") || "#6366f1",
          degree: degrees[id] || 0,
          extendable: node.extendable,
          keyPoints: node.metadata?.keyPoints,
          relatedConcepts: node.metadata?.relatedConcepts,
        });
      },
      [nodeDataMap, colorMap, data]
    );

    useEffect(() => {
      handleHoverRef.current = handleHover;
      handleSelectRef.current = handleSelect;
    }, [handleHover, handleSelect]);

    const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(null));
    const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(null));

    useEffect(() => {
      setNodes(buildNodes(null));
      setEdges(buildEdges(null));
      setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const handleExpand = async () => {
      if (!selectedNode || !onExpand || !selectedNode.extendable) return;
      setIsExpanding(true);
      try {
        await onExpand(selectedNode.id, selectedNode.label);
        await addExtendedNode(selectedNode.id, visualizationKey);
        setSelectedNode(null);
      } catch (e) {
        console.error("Extension failed", e);
      } finally {
        setIsExpanding(false);
      }
    };

    useImperativeHandle(ref, () => ({
      exportPNG: async () => {
        const el = containerRef.current;
        if (!el) return;
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(el, { backgroundColor: "#09090b", pixelRatio: 2 });
        const link = document.createElement("a");
        link.download = `graph-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      },
      getContainer: () => containerRef.current,
      fit: () => fitView({ padding: 0.15, duration: 400 }),
      zoomIn: () => rfZoomIn({ duration: 200 }),
      zoomOut: () => rfZoomOut({ duration: 200 }),
    }));

    return (
      <div ref={containerRef} className="w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onPaneClick={() => {
            setSelectedNode(null);
            setNodes(prev => prev.map(node => ({
              ...node,
              data: { ...node.data, dimmed: false, highlighted: false },
            })));
            setEdges(buildEdges(null));
          }}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={3}
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          nodesDraggable
          nodesConnectable={false}
          style={{ width: "100%", height: "100%" }}
        >
          <Background gap={16} size={1} color="#27272a" />
        </ReactFlow>

        <NodeDetailPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          onExpand={handleExpand}
          isExpanding={isExpanding}
          readOnly={readOnly}
          isExtended={selectedNode ? isNodeExtended(selectedNode.id, visualizationKey) : false}
        />
      </div>
    );
  }
);

NetworkGraphInner.displayName = "NetworkGraphInner";

/* -------------------------------------------------------------------------- */
/* WRAPPER WITH PROVIDER                                                       */
/* -------------------------------------------------------------------------- */

const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(
  (props, ref) => (
    <ReactFlowProvider>
      <NetworkGraphInner {...props} ref={ref} />
    </ReactFlowProvider>
  )
);

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;
