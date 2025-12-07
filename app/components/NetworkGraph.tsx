'use client';

import React, { useCallback, useMemo, memo, useRef, useImperativeHandle, forwardRef } from 'react';
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
  Handle,
  Position,
  ReactFlowInstance,
} from '@xyflow/react';
import { toPng, toSvg } from '@xyflow/react';
import type { NetworkGraphData } from '@/lib/types/visualization';
import '@xyflow/react/dist/style.css';

interface NetworkGraphProps {
  data: NetworkGraphData;
}

export interface NetworkGraphHandle {
  exportPNG: () => Promise<void>;
  exportSVG: () => Promise<void>;
}

// Obsidian-style custom node component
const ObsidianNode = memo(({ data }: { data: any }) => {
  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    default: { bg: 'bg-gray-800', border: 'border-blue-500', text: 'text-blue-100' },
    primary: { bg: 'bg-blue-900/50', border: 'border-blue-400', text: 'text-blue-50' },
    secondary: { bg: 'bg-purple-900/50', border: 'border-purple-400', text: 'text-purple-50' },
    tertiary: { bg: 'bg-green-900/50', border: 'border-green-400', text: 'text-green-50' },
    quaternary: { bg: 'bg-orange-900/50', border: 'border-orange-400', text: 'text-orange-50' },
  };

  const colors = categoryColors[data.category || 'default'] || categoryColors.default;

  return (
    <div className={`group relative`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-blue-400" />
      <div
        className={`
          ${colors.bg} ${colors.border} ${colors.text}
          border-2 rounded-lg px-4 py-3 min-w-[140px] max-w-[240px]
          shadow-lg backdrop-blur-sm
          transition-all duration-200
          hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105
          hover:border-blue-400
        `}
      >
        <div className="font-semibold text-sm mb-1 leading-tight">{data.label}</div>
        {data.description && (
          <div className="text-xs opacity-75 leading-snug mt-1">
            {data.description}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-blue-400" />
    </div>
  );
});

ObsidianNode.displayName = 'ObsidianNode';

const nodeTypes = {
  obsidian: ObsidianNode,
};

// Force-directed layout simulation (simplified)
function calculateLayout(nodes: any[], edges: any[]) {
  const width = 1000;
  const height = 700;
  const centerX = width / 2;
  const centerY = height / 2;

  // If only one node, place it in center
  if (nodes.length === 1) {
    return nodes.map(node => ({
      ...node,
      position: { x: centerX, y: centerY }
    }));
  }

  // Build adjacency list for connections
  const connections = new Map<string, Set<string>>();
  nodes.forEach(n => connections.set(n.id, new Set()));
  edges.forEach(e => {
    connections.get(e.source)?.add(e.target);
    connections.get(e.target)?.add(e.source);
  });

  // Find central node (most connections)
  let centralNode = nodes[0];
  let maxConnections = 0;
  nodes.forEach(node => {
    const count = connections.get(node.id)?.size || 0;
    if (count > maxConnections) {
      maxConnections = count;
      centralNode = node;
    }
  });

  // Place central node in center
  const positioned = new Map();
  positioned.set(centralNode.id, { x: centerX, y: centerY });

  // Place connected nodes in circles around center
  const radius = 250;
  let angle = 0;
  const angleStep = (2 * Math.PI) / Math.max(nodes.length - 1, 1);

  nodes.forEach(node => {
    if (node.id !== centralNode.id) {
      positioned.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
      angle += angleStep;
    }
  });

  return nodes.map(node => ({
    ...node,
    position: positioned.get(node.id) || { x: centerX, y: centerY },
  }));
}

const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(({ data }, ref) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Convert data to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    const baseNodes = data.nodes.map((node) => ({
      id: node.id,
      type: 'obsidian',
      position: { x: 0, y: 0 },
      data: {
        label: node.label,
        description: node.description,
        category: node.category,
      },
    }));

    return calculateLayout(baseNodes, data.edges);
  }, [data.nodes, data.edges]);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((edge, index) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#60a5fa',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#60a5fa',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: '#e5e7eb',
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#1f2937',
        fillOpacity: 0.85,
      },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 3,
    }));
  }, [data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Expose export methods via ref
  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      if (!reactFlowWrapper.current) {
        throw new Error('ReactFlow wrapper not found');
      }

      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: '#0a0a0f',
        width: 1920,
        height: 1080,
      });

      const link = document.createElement('a');
      link.download = `network-graph-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    },
    exportSVG: async () => {
      if (!reactFlowWrapper.current) {
        throw new Error('ReactFlow wrapper not found');
      }

      const dataUrl = await toSvg(reactFlowWrapper.current, {
        backgroundColor: '#0a0a0f',
        width: 1920,
        height: 1080,
      });

      const link = document.createElement('a');
      link.download = `network-graph-${Date.now()}.svg`;
      link.href = dataUrl;
      link.click();
    },
  }), []);

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-[700px] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-xl overflow-hidden border border-gray-800 shadow-2xl"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#60a5fa', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#374151"
          gap={16}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="!bg-gray-800/90 !border-gray-700 !rounded-lg !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-gray-800/90 !border-2 !border-gray-700 !rounded-lg !shadow-lg"
          nodeColor={(node) => {
            const category = (node.data?.category as string) || 'default';
            const colors: Record<string, string> = {
              default: '#3b82f6',
              primary: '#60a5fa',
              secondary: '#a855f7',
              tertiary: '#10b981',
              quaternary: '#f97316',
            };
            return colors[category] || colors.default;
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          nodeStrokeWidth={2}
        />
      </ReactFlow>
    </div>
  );
});

NetworkGraph.displayName = 'NetworkGraph';

export default NetworkGraph;
