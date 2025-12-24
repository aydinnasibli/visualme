"use client";

import React, { useEffect, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeDiagramData } from '@/lib/types/visualization';
import { useExtendedNodes } from '@/lib/context/ExtendedNodesContext';
import NodeDetailPanel from './NodeDetailPanel';

interface TreeDiagramProps {
  data: TreeDiagramData;
  onExpand?: (nodeId: string, nodeContent: string) => Promise<void>;
  readOnly?: boolean;
  visualizationKey?: string;
}

interface TreeCustomNode {
  name: string;
  attributes?: {
    description?: string;
    extendable?: boolean;
    [key: string]: any;
  };
  children?: TreeCustomNode[];
  __rd3t: {
    id: string;
    depth: number;
    collapsed: boolean;
  };
}

// Custom Node Component for Tree
const CustomNode = ({ nodeDatum, onNodeClick }: { nodeDatum: TreeCustomNode; onNodeClick: () => void }) => {
  const isRoot = nodeDatum.__rd3t.depth === 0;
  // Node colors based on depth (cycling)
  const colors = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
  const color = colors[(nodeDatum.__rd3t.depth || 0) % colors.length];
  
  return (
    <g>
      <circle
        r={isRoot ? 20 : 15}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        onClick={onNodeClick}
        style={{ cursor: 'pointer', filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
      <text
        fill="#e4e4e7"
        strokeWidth="0"
        x="25"
        y="5"
        onClick={onNodeClick}
        style={{ 
          fontSize: isRoot ? '16px' : '14px', 
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer',
          fontWeight: isRoot ? 600 : 400,
          textShadow: '0 1px 3px rgba(0,0,0,0.8)'
        }}
      >
        {nodeDatum.name}
      </text>
      {nodeDatum.attributes?.extendable && (
        <circle 
          r={4} 
          cx={isRoot ? 20 : 15} 
          cy={-15} 
          fill="#fbbf24" 
          className="animate-pulse" 
        />
      )}
    </g>
  );
};

export default function TreeDiagram({ data, onExpand, readOnly = false, visualizationKey = "default" }: TreeDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<TreeCustomNode | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const { addExtendedNode } = useExtendedNodes();

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
    
    // Resize observer to update dimensions on window resize
    const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
            setDimensions({
                width: entries[0].contentRect.width,
                height: entries[0].contentRect.height,
            });
        }
    });
    
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = (nodeDatum: TreeCustomNode) => {
    setSelectedNode(nodeDatum);
  };

  const handleExpandNode = async () => {
    if (!selectedNode || !onExpand) return;
    
    // Check if node is extendable (stored in attributes)
    if (!selectedNode.attributes?.extendable) return;

    setIsExpanding(true);
    try {
      await onExpand(selectedNode.__rd3t.id, selectedNode.name); // react-d3-tree adds __rd3t.id
      // Since tree structure might be dynamic, relying on __rd3t.id is safe for session but maybe not for persistence if IDs regenerate.
      // Ideally the backend provides stable IDs in `attributes.id` if persistence is critical.
      // For now we assume this works for the session.
      // await addExtendedNode(selectedNode.__rd3t.id, visualizationKey); // Temporarily disabled if ID isn't stable or needed for this specific logic
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to expand tree node:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  // Prepare node data for the detailed panel
  const getPanelData = () => {
    if (!selectedNode) return null;

    // Generate a consistent color based on depth
    const colors = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
    const color = colors[(selectedNode.__rd3t.depth || 0) % colors.length];

    return {
      id: selectedNode.__rd3t.id,
      label: selectedNode.name,
      category: `Level ${selectedNode.__rd3t.depth}`,
      color: color,
      description: selectedNode.attributes?.description,
      extendable: selectedNode.attributes?.extendable,
      keyPoints: selectedNode.attributes?.keyPoints, // Map rich data if available
      relatedConcepts: selectedNode.attributes?.relatedConcepts,
      degree: selectedNode.children ? selectedNode.children.length : 0,
    };
  };

  return (
    <div ref={containerRef} className="w-full h-[750px] bg-[#0f1419] rounded-2xl border border-zinc-800/50 relative overflow-hidden shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }} 
      />

      {dimensions.width > 0 && (
        <Tree
          data={data}
          translate={{ x: dimensions.width / 2, y: 50 }}
          nodeSize={{ x: 200, y: 100 }}
          renderCustomNodeElement={(rd3tProps) => (
            <CustomNode 
              {...rd3tProps} 
              onNodeClick={() => handleNodeClick(rd3tProps.nodeDatum)} 
            />
          )}
          pathClassFunc={() => 'custom-link'}
          zoomable={true}
          draggable={true}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          orientation="vertical"
        />
      )}

      {/* Details Panel */}
      <NodeDetailPanel
        selectedNode={getPanelData()}
        onClose={() => setSelectedNode(null)}
        onExpand={handleExpandNode}
        isExpanding={isExpanding}
        readOnly={readOnly}
      />
    </div>
  );
}
