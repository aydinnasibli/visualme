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
  BackgroundVariant,
} from '@xyflow/react';
import { motion } from 'framer-motion';
import type { NetworkGraphData } from '@/lib/types/visualization';
import '@xyflow/react/dist/style.css';

interface NetworkGraphProps {
  data: NetworkGraphData;
}

// Custom node component with enhanced animations and styling
const AnimatedNode = ({ data }: { data: any }) => {
  const categoryColors: Record<string, string> = {
    default: 'from-blue-500 to-purple-600',
    primary: 'from-blue-500 to-cyan-500',
    secondary: 'from-purple-500 to-pink-500',
    tertiary: 'from-green-500 to-emerald-500',
    quaternary: 'from-orange-500 to-red-500',
  };

  const gradientClass = categoryColors[data.category || 'default'] || categoryColors.default;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotateY: -180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
        delay: 0.1
      }}
      whileHover={{ scale: 1.05 }}
      className={`px-5 py-3 rounded-xl bg-gradient-to-br ${gradientClass} text-white shadow-xl border-2 border-white/30 backdrop-blur-sm min-w-[120px] max-w-[250px]`}
    >
      <div className="font-bold text-sm mb-1">{data.label}</div>
      {data.description && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.3 }}
          className="text-xs opacity-90 leading-tight"
        >
          {data.description}
        </motion.div>
      )}
    </motion.div>
  );
};

const nodeTypes = {
  animated: AnimatedNode,
};

// Helper function for better circular layout
function circularLayout(nodes: any[], centerX: number, centerY: number, radius: number) {
  return nodes.map((node, index) => {
    const angle = (index * 2 * Math.PI) / nodes.length;
    return {
      ...node,
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
    };
  });
}

export default function NetworkGraph({ data }: NetworkGraphProps) {
  // Convert our data to React Flow format with better layout
  const initialNodes: Node[] = useMemo(() => {
    const baseNodes = data.nodes.map((node, index) => ({
      id: node.id,
      type: 'animated',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        label: node.label,
        description: node.description,
        category: node.category,
      },
    }));

    // Apply circular layout
    return circularLayout(baseNodes, 500, 350, 280);
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
        width: 20,
        height: 20,
      },
      style: {
        stroke: '#60a5fa',
        strokeWidth: 2.5,
      },
      labelStyle: {
        fill: '#e5e7eb',
        fontSize: 12,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: '#1f2937',
        fillOpacity: 0.9,
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-[650px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background
          color="#4b5563"
          gap={20}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="bg-gray-800/90 border-gray-600 rounded-lg shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="bg-gray-800/90 border-2 border-gray-600 rounded-lg shadow-lg"
          nodeColor={(node) => {
            const category = (node.data?.category as string) || 'default';
            const colors: Record<string, string> = {
              default: '#3b82f6',
              primary: '#06b6d4',
              secondary: '#a855f7',
              tertiary: '#10b981',
              quaternary: '#f97316',
            };
            return colors[category] || colors.default;
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </motion.div>
  );
}
