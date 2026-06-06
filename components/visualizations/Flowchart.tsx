"use client";

import { useMemo, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import type { FlowchartData, FlowchartNodeType } from "@/lib/types/visualization";
import NodeDetailPanel from "./NodeDetailPanel";

interface FlowchartProps {
  data: FlowchartData;
  readOnly?: boolean;
}

export interface FlowchartHandle {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const NODE_COLORS: Record<FlowchartNodeType, string> = {
  start:    "#10b981",
  end:      "#ec4899",
  process:  "#6366f1",
  decision: "#f59e0b",
  input:    "#06b6d4",
  output:   "#8b5cf6",
};

const NODE_STYLES: Record<FlowchartNodeType, { bg: string; border: string }> = {
  start:    { bg: "#10b98130", border: "#10b981" },
  end:      { bg: "#ec489930", border: "#ec4899" },
  process:  { bg: "#6366f128", border: "#6366f1" },
  decision: { bg: "#f59e0b28", border: "#f59e0b" },
  input:    { bg: "#06b6d428", border: "#06b6d4" },
  output:   { bg: "#8b5cf628", border: "#8b5cf6" },
};

interface FlowNodeSelectPayload {
  id: string;
  label: string;
  nodeType: FlowchartNodeType;
  color?: string;
  description?: string;
  keyPoints?: string[];
  relatedConcepts?: string[];
}

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowchartNodeType;
  nodeId: string;
  color?: string;
  description?: string;
  keyPoints?: string[];
  relatedConcepts?: string[];
  onSelect: (payload: FlowNodeSelectPayload) => void;
}

const FlowNode = ({ data }: NodeProps) => {
  const d = data as FlowNodeData;
  const baseStyle = NODE_STYLES[d.nodeType] || NODE_STYLES.process;
  const style = d.color
    ? { bg: `${d.color}30`, border: d.color }
    : baseStyle;
  const isDecision = d.nodeType === "decision";
  const isTerminal = d.nodeType === "start" || d.nodeType === "end";
  const hs = { opacity: 0, width: 6, height: 6 };

  return (
    <div
      style={{ position: "relative", cursor: "pointer" }}
      onClick={() => d.onSelect({
        id: d.nodeId,
        label: d.label,
        nodeType: d.nodeType,
        color: d.color,
        description: d.description,
        keyPoints: d.keyPoints,
        relatedConcepts: d.relatedConcepts,
      })}
    >
      <Handle type="target" position={Position.Top} style={hs} />
      <Handle type="target" position={Position.Left} style={hs} />

      {isDecision ? (
        <div
          style={{
            width: 90,
            height: 90,
            background: style.bg,
            border: `1.5px solid ${style.border}88`,
            boxShadow: `0 0 10px ${style.border}25`,
            transform: "rotate(45deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              transform: "rotate(-45deg)",
              color: "#e4e4e7",
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "Inter, ui-sans-serif",
              textAlign: "center",
              padding: "0 12px",
              maxWidth: 80,
              lineHeight: 1.3,
            }}
          >
            {d.label}
          </div>
        </div>
      ) : (
        <div
          style={{
            minWidth: isTerminal ? 90 : 120,
            maxWidth: 180,
            padding: isTerminal ? "8px 20px" : "8px 16px",
            borderRadius: isTerminal ? 999 : 8,
            background: style.bg,
            border: `1.5px solid ${style.border}88`,
            boxShadow: `0 0 10px ${style.border}25`,
            color: "#e4e4e7",
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "Inter, ui-sans-serif",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {d.label}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={hs} />
      <Handle type="source" position={Position.Right} style={hs} />
    </div>
  );
};

const nodeTypes = { flowNode: FlowNode };

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  nodes.forEach((n) => g.setNode(n.id, { width: 160, height: 70 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - 80, y: pos.y - 35 } };
  });
}

const FlowchartInner = forwardRef<FlowchartHandle, FlowchartProps>(
  ({ data, readOnly = false }, ref) => {
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<{
      id: string; label: string; category: string; color: string;
      description?: string; keyPoints?: string[]; relatedConcepts?: string[];
    } | null>(null);

    const handleSelect = useCallback((payload: FlowNodeSelectPayload) => {
      const { id, label, nodeType, color, description, keyPoints, relatedConcepts } = payload;
      setSelectedNode(prev => prev?.id === id ? null : {
        id,
        label: label || id,
        category: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        color: color || NODE_COLORS[nodeType] || "#6366f1",
        description,
        keyPoints,
        relatedConcepts,
      });
    }, []);

    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!data?.nodes) return { nodes: [], edges: [] };

      const rawNodes: Node[] = data.nodes.map((n) => ({
        id: n.id,
        type: "flowNode",
        position: n.position || { x: 0, y: 0 },
        data: {
          label: n.data?.label || n.id,
          nodeType: n.type || "process",
          nodeId: n.id,
          color: n.data?.color,
          description: n.data?.description,
          keyPoints: n.data?.keyPoints,
          relatedConcepts: n.data?.relatedConcepts,
        } as Omit<FlowNodeData, "onSelect">,
      }));

      const rawEdges: Edge[] = (data.edges || []).map((e, i) => ({
        id: e.id || `e-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        labelStyle: { fill: "#a1a1aa", fontSize: 11 },
        labelBgStyle: { fill: "#1c1c24", fillOpacity: 0.9 },
        style: { stroke: "#52525b", strokeWidth: 1.5 },
        animated: true,
      }));

      return { nodes: applyDagreLayout(rawNodes, rawEdges), edges: rawEdges };
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(
      layoutedNodes.map(n => ({ ...n, data: { ...n.data, onSelect: handleSelect } }))
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    useEffect(() => {
      setNodes(layoutedNodes.map(n => ({ ...n, data: { ...n.data, onSelect: handleSelect } })));
      setEdges(layoutedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    useImperativeHandle(ref, () => ({
      fit: () => fitView({ padding: 0.2, duration: 400 }),
      zoomIn: () => zoomIn({ duration: 200 }),
      zoomOut: () => zoomOut({ duration: 200 }),
    }));

    return (
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onPaneClick={() => setSelectedNode(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <Background gap={16} size={1} color="#27272a" />
        </ReactFlow>

        <NodeDetailPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          readOnly={readOnly}
        />
      </div>
    );
  }
);

FlowchartInner.displayName = "FlowchartInner";

const Flowchart = forwardRef<FlowchartHandle, FlowchartProps>((props, ref) => (
  <ReactFlowProvider>
    <FlowchartInner {...props} ref={ref} />
  </ReactFlowProvider>
));

Flowchart.displayName = "Flowchart";
export default Flowchart;
