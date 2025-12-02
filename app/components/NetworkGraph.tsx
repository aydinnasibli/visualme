'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import { motion } from 'framer-motion';
import type { NetworkGraphData } from '@/lib/types/visualization';
import '@xyflow/react/dist/style.css';

interface NetworkGraphProps {
  data: NetworkGraphData;
}

// Custom node component with animations
const AnimatedNode = ({ data }: { data: any }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-2 border-blue-400"
    >
      <div className="font-semibold text-sm">{data.label}</div>
      {data.description && (
        <div className="text-xs mt-1 opacity-90">{data.description}</div>
      )}
    </motion.div>
  );
};

const nodeTypes = {
  animated: AnimatedNode,
};

export default function NetworkGraph({ data }: NetworkGraphProps) {
  // Convert our data to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map((node, index) => ({
      id: node.id,
      type: 'animated',
      position: {
        // Simple circular layout
        x: 400 + Math.cos((index * 2 * Math.PI) / data.nodes.length) * 250,
        y: 300 + Math.sin((index * 2 * Math.PI) / data.nodes.length) * 250,
      },
      data: {
        label: node.label,
        description: node.description,
        category: node.category,
      },
    }));
  }, [data.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#60a5fa',
      },
      style: {
        stroke: '#60a5fa',
        strokeWidth: 2,
      },
      labelStyle: {
        fill: '#e5e7eb',
        fontSize: 12,
      },
      labelBgStyle: {
        fill: '#1f2937',
        fillOpacity: 0.8,
      },
    }));
  }, [data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#374151" gap={16} />
        <Controls className="bg-gray-800 border-gray-600" />
        <MiniMap
          className="bg-gray-800 border-gray-600"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
