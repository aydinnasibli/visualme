"use client";

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowchartData } from '@/lib/types/visualization';
import VisualizationContainer from './VisualizationContainer';

// Custom Node Types for Flowchart
const StartNode = ({ data }: any) => (
  <div className="px-6 py-3 rounded-full bg-green-500/20 border-2 border-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-green-100 font-semibold min-w-[120px] text-center backdrop-blur-md">
    <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
    {data.label}
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="px-6 py-3 rounded-full bg-red-500/20 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-red-100 font-semibold min-w-[120px] text-center backdrop-blur-md">
    <Handle type="target" position={Position.Top} className="!bg-red-500 !w-3 !h-3" />
    {data.label}
  </div>
);

const ProcessNode = ({ data }: any) => (
  <div className="px-6 py-4 rounded-lg bg-blue-500/10 border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-100 font-medium min-w-[150px] text-center backdrop-blur-md">
    <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2" />
    <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
    {data.label}
  </div>
);

const DecisionNode = ({ data }: any) => (
  <div className="w-32 h-32 flex items-center justify-center relative">
    {/* Rhombus shape using CSS transform */}
    <div className="absolute inset-0 bg-yellow-500/10 border border-yellow-500 transform rotate-45 rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md" />
    <div className="relative z-10 text-yellow-100 font-medium text-center p-2 text-sm leading-tight">
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className="!bg-yellow-500 !w-2 !h-2 -mt-16" />
    <Handle type="source" position={Position.Right} id="yes" className="!bg-yellow-500 !w-2 !h-2 -mr-16" />
    <Handle type="source" position={Position.Bottom} id="no" className="!bg-yellow-500 !w-2 !h-2 -mb-16" />
    <Handle type="source" position={Position.Left} className="!bg-yellow-500 !w-2 !h-2 -ml-16" />
  </div>
);

const InputNode = ({ data }: any) => (
  <div className="px-6 py-3 bg-purple-500/10 border border-purple-500 transform -skew-x-12 shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md ml-2 mr-2">
    <div className="transform skew-x-12 text-purple-100 font-medium text-center min-w-[120px]">
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className="transform skew-x-12 !bg-purple-500 !w-2 !h-2" />
    <Handle type="source" position={Position.Bottom} className="transform skew-x-12 !bg-purple-500 !w-2 !h-2" />
  </div>
);

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  input: InputNode,
  output: InputNode, // Reusing Input style for Output commonly
};

interface FlowchartProps {
  data: FlowchartData;
  readOnly?: boolean;
}

export default function Flowchart({ data, readOnly }: FlowchartProps) {
  // Convert generic data to ReactFlow format if needed
  // Assumption: data.nodes already contains { id, type, position, data: { label } }

  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map(n => ({
      ...n,
      type: n.type || 'process', // Fallback
      draggable: !readOnly,
      connectable: !readOnly,
    }));
  }, [data.nodes, readOnly]);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map(e => ({
      ...e,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#71717a', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#71717a',
      },
      labelStyle: { fill: '#a1a1aa', fontWeight: 500 },
      labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
    }));
  }, [data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <VisualizationContainer>
      <div className="w-full h-full bg-[#0f1419]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.2}
          maxZoom={4}
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls className="bg-zinc-800 border-zinc-700 fill-zinc-400" />
        </ReactFlow>
      </div>
    </VisualizationContainer>
  );
}
