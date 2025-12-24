"use client";

import React, { useMemo } from 'react';
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
import { SwimlaneDiagramData } from '@/lib/types/visualization';
import VisualizationContainer from './VisualizationContainer';

// Custom Group Node (The Lane)
const LaneNode = ({ data, style }: any) => {
  return (
    <div
      className="h-full border-r border-zinc-700 bg-zinc-900/30 relative"
      style={{ minWidth: style?.width || 300, minHeight: style?.height || 600 }}
    >
      <div className="absolute top-0 left-0 right-0 py-2 bg-zinc-800/80 border-b border-zinc-700 text-center font-bold text-zinc-200 uppercase tracking-wider text-sm backdrop-blur-sm">
        {data.label}
      </div>
    </div>
  );
};

// Task Node inside Lane
const TaskNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-md bg-zinc-800 border border-zinc-600 shadow-lg text-zinc-100 text-sm font-medium w-48 text-center hover:border-blue-500 transition-colors">
    <Handle type="target" position={Position.Top} className="!bg-zinc-500" />
    <Handle type="source" position={Position.Bottom} className="!bg-zinc-500" />
    {data.label}
  </div>
);

const nodeTypes = {
  lane: LaneNode,
  task: TaskNode,
};

interface SwimlaneDiagramProps {
  data: SwimlaneDiagramData;
  readOnly?: boolean;
}

export default function SwimlaneDiagram({ data, readOnly }: SwimlaneDiagramProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create Lanes
    const LANE_WIDTH = 350;
    const LANE_HEIGHT = 800;

    data.lanes.forEach((lane, index) => {
      nodes.push({
        id: lane.id,
        type: 'lane',
        position: { x: index * LANE_WIDTH, y: 0 },
        data: { label: lane.name },
        style: { width: LANE_WIDTH, height: LANE_HEIGHT },
        selectable: false,
        draggable: false,
        zIndex: -1,
      });
    });

    // Create Tasks
    // Simple auto-layout: Stack tasks vertically within their lane
    const laneTaskCounts: Record<string, number> = {};

    data.tasks.forEach((task) => {
      const laneIndex = data.lanes.findIndex(l => l.id === task.lane);
      if (laneIndex === -1) return;

      const currentCount = laneTaskCounts[task.lane] || 0;
      laneTaskCounts[task.lane] = currentCount + 1;

      // Position logic
      // x: relative to lane start + padding
      // y: header height (40) + spacing * count
      const x = laneIndex * LANE_WIDTH + (LANE_WIDTH - 192) / 2; // Center 48 (192px) node
      const y = 80 + currentCount * 120;

      nodes.push({
        id: task.id,
        type: 'task',
        position: { x, y },
        data: { label: task.content },
        extent: 'parent', // Optional: restrict to lane if we made lanes parents
        draggable: !readOnly,
      });
    });

    return { nodes, edges };
  }, [data, readOnly]);

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
