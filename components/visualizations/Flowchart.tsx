"use client";

import { useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  useReactFlow,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import type { FlowchartData, FlowchartNodeType } from "@/lib/types/visualization";

interface FlowchartProps {
  data: FlowchartData;
  readOnly?: boolean;
}

export interface FlowchartHandle {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const NODE_STYLES: Record<FlowchartNodeType, { bg: string; border: string; shape: string }> = {
  start:    { bg: "#10b98130", border: "#10b981", shape: "rounded-full" },
  end:      { bg: "#ec489930", border: "#ec4899", shape: "rounded-full" },
  process:  { bg: "#6366f128", border: "#6366f1", shape: "rounded-lg" },
  decision: { bg: "#f59e0b28", border: "#f59e0b", shape: "rounded-lg" },
  input:    { bg: "#06b6d428", border: "#06b6d4", shape: "rounded-lg" },
  output:   { bg: "#8b5cf628", border: "#8b5cf6", shape: "rounded-lg" },
};

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowchartNodeType;
}

const FlowNode = ({ data }: NodeProps) => {
  const d = data as FlowNodeData;
  const style = NODE_STYLES[d.nodeType] || NODE_STYLES.process;
  const isDecision = d.nodeType === "decision";
  const isTerminal = d.nodeType === "start" || d.nodeType === "end";
  const hs = { opacity: 0, width: 6, height: 6 };

  return (
    <div style={{ position: "relative" }}>
      <Handle type="target" position={Position.Top} style={hs} />
      <Handle type="target" position={Position.Left} style={hs} />

      {isDecision ? (
        /* Diamond: rotate a square, put text in a counter-rotated inner div */
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
  ({ data }, ref) => {
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    const { nodes, edges } = useMemo(() => {
      if (!data?.nodes) return { nodes: [], edges: [] };

      const rawNodes: Node[] = data.nodes.map((n) => ({
        id: n.id,
        type: "flowNode",
        position: n.position || { x: 0, y: 0 },
        data: { label: n.data?.label || n.id, nodeType: n.type || "process" } satisfies FlowNodeData,
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

      const layoutedNodes = applyDagreLayout(rawNodes, rawEdges);
      return { nodes: layoutedNodes, edges: rawEdges };
    }, [data]);

    useImperativeHandle(ref, () => ({
      fit: () => fitView({ padding: 0.2, duration: 400 }),
      zoomIn: () => zoomIn({ duration: 200 }),
      zoomOut: () => zoomOut({ duration: 200 }),
    }));

    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        panOnScroll
        nodesDraggable
        nodesConnectable={false}
        style={{ width: "100%", height: "100%" }}
      >
        <Background gap={16} size={1} color="#27272a" />
      </ReactFlow>
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
