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
  start:    { bg: "#10b98120", border: "#10b981", shape: "rounded-full" },
  end:      { bg: "#ec489920", border: "#ec4899", shape: "rounded-full" },
  process:  { bg: "#6366f120", border: "#6366f1", shape: "rounded-xl" },
  decision: { bg: "#f59e0b20", border: "#f59e0b", shape: "rounded-lg rotate-0" },
  input:    { bg: "#06b6d420", border: "#06b6d4", shape: "rounded-xl" },
  output:   { bg: "#8b5cf620", border: "#8b5cf6", shape: "rounded-xl" },
};

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowchartNodeType;
}

const FlowNode = ({ data }: NodeProps) => {
  const d = data as FlowNodeData;
  const style = NODE_STYLES[d.nodeType] || NODE_STYLES.process;
  const isDecision = d.nodeType === "decision";

  return (
    <div style={{ position: "relative" }}>
      <Handle type="target" position={Position.Top} style={{ background: style.border, border: "none", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} style={{ background: style.border, border: "none", width: 8, height: 8 }} />

      {isDecision ? (
        <div
          className="flex items-center justify-center text-center font-semibold text-white text-xs"
          style={{
            width: 120,
            height: 60,
            background: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: 8,
            boxShadow: `0 0 12px ${style.border}40`,
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            padding: "0 24px",
          }}
        >
          {d.label}
        </div>
      ) : (
        <div
          className={`flex items-center justify-center text-center font-semibold text-white text-xs px-4 py-3 ${style.shape}`}
          style={{
            minWidth: 110,
            maxWidth: 160,
            background: style.bg,
            border: `2px solid ${style.border}`,
            boxShadow: `0 0 12px ${style.border}40`,
          }}
        >
          {d.label}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: style.border, border: "none", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: style.border, border: "none", width: 8, height: 8 }} />
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
