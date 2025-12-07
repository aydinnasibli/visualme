'use client';

import React, { useCallback, useMemo, memo, useRef, useImperativeHandle, forwardRef, useState } from 'react';
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
  NodeProps,
  useReactFlow,
} from '@xyflow/react';
import html2canvas from 'html2canvas';
import type { NetworkGraphData } from '@/lib/types/visualization';
import '@xyflow/react/dist/style.css';

interface NetworkGraphProps {
  data: NetworkGraphData;
}

export interface NetworkGraphHandle {
  exportPNG: (scale?: number) => Promise<void>;
  getContainer: () => HTMLDivElement | null;
}

// Obsidian-inspired node with improved sizing and design
const ObsidianNode = memo(({ data, selected }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Category-based colors - Obsidian style
  const categoryColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    default: {
      bg: 'bg-gray-800/90',
      border: 'border-blue-500/70',
      text: 'text-gray-100',
      glow: 'shadow-blue-500/30'
    },
    primary: {
      bg: 'bg-blue-900/80',
      border: 'border-blue-400',
      text: 'text-blue-50',
      glow: 'shadow-blue-400/40'
    },
    secondary: {
      bg: 'bg-purple-900/80',
      border: 'border-purple-400',
      text: 'text-purple-50',
      glow: 'shadow-purple-400/40'
    },
    tertiary: {
      bg: 'bg-emerald-900/80',
      border: 'border-emerald-400',
      text: 'text-emerald-50',
      glow: 'shadow-emerald-400/40'
    },
    quaternary: {
      bg: 'bg-amber-900/80',
      border: 'border-amber-400',
      text: 'text-amber-50',
      glow: 'shadow-amber-400/40'
    },
  };

  const colors = categoryColors[data.category || 'default'] || categoryColors.default;

  // Dynamic sizing based on importance/connections
  const importance = data.importance || 1;
  const sizeClass = importance > 3 ? 'min-w-[200px] max-w-[280px] px-6 py-4' :
                    importance > 2 ? 'min-w-[160px] max-w-[240px] px-5 py-3.5' :
                    'min-w-[120px] max-w-[200px] px-4 py-3';

  const fontSize = importance > 3 ? 'text-base' : importance > 2 ? 'text-sm' : 'text-sm';

  return (
    <div className="relative group">
      {/* Label above node - Obsidian style to avoid cursor occlusion */}
      {isHovered && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-200 whitespace-nowrap z-50 pointer-events-none">
          {data.label}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-blue-400 !border-2 !border-blue-600"
      />

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${colors.bg} ${colors.border} ${colors.text} ${sizeClass}
          border-2 rounded-xl
          shadow-xl ${isHovered || selected ? colors.glow : 'shadow-black/40'}
          backdrop-blur-md
          transition-all duration-300 ease-out
          ${isHovered ? 'scale-110 -translate-y-1' : selected ? 'scale-105' : 'scale-100'}
          ${isHovered || selected ? 'border-opacity-100 shadow-2xl' : 'border-opacity-70'}
          cursor-pointer
          relative
        `}
      >
        {/* Node content */}
        <div className={`font-semibold ${fontSize} leading-tight text-center`}>
          {data.label}
        </div>

        {data.description && (
          <div className="text-xs opacity-80 leading-snug mt-2 text-center">
            {data.description}
          </div>
        )}

        {/* Connection count indicator */}
        {importance > 1 && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-gray-900">
            {importance}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-blue-400 !border-2 !border-blue-600"
      />
    </div>
  );
});

ObsidianNode.displayName = 'ObsidianNode';

const nodeTypes = {
  obsidian: ObsidianNode,
};

// Enhanced force-directed layout with better node distribution
function calculateLayout(nodes: any[], edges: any[]) {
  const width = 1200;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;

  // If only one node, place it in center
  if (nodes.length === 1) {
    return nodes.map(node => ({
      ...node,
      position: { x: centerX, y: centerY },
      data: { ...node.data, importance: 1 }
    }));
  }

  // Build adjacency list and count connections
  const connections = new Map<string, Set<string>>();
  nodes.forEach(n => connections.set(n.id, new Set()));
  edges.forEach(e => {
    connections.get(e.source)?.add(e.target);
    connections.get(e.target)?.add(e.source);
  });

  // Calculate importance (connection count) for each node
  const importance = new Map<string, number>();
  nodes.forEach(node => {
    const count = connections.get(node.id)?.size || 0;
    importance.set(node.id, count);
  });

  // Find central nodes (top 3 by connections)
  const sortedByConnections = [...nodes].sort((a, b) => {
    return (importance.get(b.id) || 0) - (importance.get(a.id) || 0);
  });

  const centralNode = sortedByConnections[0];
  const secondaryNodes = sortedByConnections.slice(1, 4);
  const peripheralNodes = sortedByConnections.slice(4);

  const positioned = new Map();

  // Place central node
  positioned.set(centralNode.id, { x: centerX, y: centerY });

  // Place secondary nodes in inner circle
  const innerRadius = 220;
  secondaryNodes.forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / secondaryNodes.length;
    positioned.set(node.id, {
      x: centerX + Math.cos(angle) * innerRadius,
      y: centerY + Math.sin(angle) * innerRadius,
    });
  });

  // Place peripheral nodes in outer circle
  const outerRadius = 380;
  peripheralNodes.forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / peripheralNodes.length + Math.PI / peripheralNodes.length;
    positioned.set(node.id, {
      x: centerX + Math.cos(angle) * outerRadius,
      y: centerY + Math.sin(angle) * outerRadius,
    });
  });

  // Return nodes with positions and importance data
  return nodes.map(node => ({
    ...node,
    position: positioned.get(node.id) || { x: centerX, y: centerY },
    data: {
      ...node.data,
      importance: importance.get(node.id) || 1
    }
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
        strokeWidth: 2.5,
        strokeOpacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#60a5fa',
        width: 24,
        height: 24,
      },
      labelStyle: {
        fill: '#f3f4f6',
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

  // Expose export methods via ref
  useImperativeHandle(ref, () => ({
    exportPNG: async (scale = 2) => {
      if (!reactFlowWrapper.current) {
        throw new Error('ReactFlow wrapper not found');
      }

      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: '#0a0a0f',
        scale: scale,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `network-graph-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
    getContainer: () => reactFlowWrapper.current,
  }), []);

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-[800px] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl shadow-black/50"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.4, maxZoom: 1.5 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#60a5fa', strokeWidth: 2.5 },
        }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background
          color="#4b5563"
          gap={20}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="!bg-gray-800/95 !border-gray-600 !rounded-lg !shadow-xl !shadow-black/50"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-gray-800/95 !border-2 !border-gray-600 !rounded-lg !shadow-xl !shadow-black/50"
          nodeColor={(node) => {
            const category = (node.data?.category as string) || 'default';
            const colors: Record<string, string> = {
              default: '#3b82f6',
              primary: '#60a5fa',
              secondary: '#a78bfa',
              tertiary: '#34d399',
              quaternary: '#fbbf24',
            };
            return colors[category] || colors.default;
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </div>
  );
});

NetworkGraph.displayName = 'NetworkGraph';

export default NetworkGraph;
