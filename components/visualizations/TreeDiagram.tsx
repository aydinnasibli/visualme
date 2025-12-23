"use client";

import React, { useEffect, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { TreeDiagramData } from '@/lib/types/visualization';
import { useExtendedNodes } from '@/lib/context/ExtendedNodesContext';

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
      await addExtendedNode(selectedNode.__rd3t.id, visualizationKey);
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to expand tree node:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  // Transform data if necessary to ensure it works with react-d3-tree
  // react-d3-tree expects `name` and `children`.
  // Our TreeDiagramData has `name`, `children`.
  
  // We need to inject unique IDs if they don't exist for extending logic?
  // react-d3-tree generates its own IDs internally (__rd3t.id), but for our persistence we might need stable IDs.
  // Ideally our data generation provides IDs.
  // The schema says: `name`, `children`, `attributes`. No explicit ID in schema?
  // Let's check visualization-generator.ts:
  // "each node: name (required), children (optional array), value (optional number)"
  // It seems we don't strictly enforce ID in schema for TreeDiagram.
  // We should rely on hierarchy or generate IDs if missing. 
  // For now, let's use the provided structure.

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
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 w-80 bg-zinc-900/95 border border-zinc-700 backdrop-blur-md rounded-xl p-5 shadow-2xl z-10"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">{selectedNode.name}</h3>
            
            <div className="space-y-4">
              {selectedNode.attributes?.description && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Description</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selectedNode.attributes.description}
                  </p>
                </div>
              )}

              {selectedNode.attributes?.extendable && !readOnly && (
                <button
                  onClick={handleExpandNode}
                  disabled={isExpanding}
                  className="w-full mt-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isExpanding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isExpanding ? 'Extending...' : 'Extend Branch'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
