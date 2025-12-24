"use client";

import React, { useMemo, useState } from 'react';
import * as d3 from 'd3-hierarchy';
import { linkHorizontal } from 'd3-shape';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeDiagramData } from '@/lib/types/visualization';
import { useExtendedNodes } from '@/lib/context/ExtendedNodesContext';
import NodeDetailPanel from './NodeDetailPanel';
import VisualizationContainer from './VisualizationContainer';

interface TreeDiagramProps {
  data: TreeDiagramData;
  onExpand?: (nodeId: string, nodeContent: string) => Promise<void>;
  readOnly?: boolean;
  visualizationKey?: string;
}

// Helper to convert generic TreeDiagramData to D3 Hierarchy
const processData = (data: TreeDiagramData) => {
  return d3.hierarchy(data);
};

export default function TreeDiagram({ data, onExpand, readOnly = false, visualizationKey = "default" }: TreeDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const { addExtendedNode } = useExtendedNodes();

  // 1. Calculate Layout
  const { nodes, links, width, height } = useMemo(() => {
    const root = processData(data);
    
    // Set size based on node count to ensure spacing
    // Horizontal layout: height depends on leaves, width on depth
    const nodeWidth = 250;
    const nodeHeight = 100;
    
    // Calculate required dimensions
    let maxDepth = 0;
    let leaves = 0;
    root.each((node) => {
      if (node.depth > maxDepth) maxDepth = node.depth;
      if (!node.children) leaves++;
    });

    const calculatedWidth = Math.max(1200, (maxDepth + 1) * 300);
    const calculatedHeight = Math.max(800, leaves * 80);

    // Create Tree Layout (Left-to-Right)
    const treeLayout = d3.tree<TreeDiagramData>()
      .size([calculatedHeight - 100, calculatedWidth - 200]) // [height, width] for horizontal
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));

    treeLayout(root);

    return {
      nodes: root.descendants(),
      links: root.links(),
      width: calculatedWidth,
      height: calculatedHeight
    };
  }, [data]);

  // 2. Interaction Handlers
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  const handleExpandNode = async () => {
    if (!selectedNode || !onExpand) return;
    const attributes = selectedNode.data.attributes;
    if (!attributes?.extendable) return;

    setIsExpanding(true);
    try {
      // Use node label (name) as ID if specific ID missing, or implement ID generation
      // d3-hierarchy doesn't strictly require IDs, but our expansion logic needs one.
      // We'll use a generated ID path or name.
      const nodeId = selectedNode.data.id || selectedNode.data.name;
      await onExpand(nodeId, selectedNode.data.name);
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to expand tree node:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  // 3. Prepare Panel Data
  const getPanelData = () => {
    if (!selectedNode) return null;
    const d = selectedNode.data;
    const colors = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
    const color = colors[(selectedNode.depth || 0) % colors.length];

    return {
      id: d.id || d.name,
      label: d.name,
      category: `Level ${selectedNode.depth}`,
      color: color,
      description: d.attributes?.description,
      extendable: d.attributes?.extendable,
      keyPoints: d.attributes?.keyPoints,
      relatedConcepts: d.attributes?.relatedConcepts,
      degree: d.children ? d.children.length : 0,
    };
  };

  // 4. Link Generator
  const linkGenerator = linkHorizontal()
    .x((d: any) => d.y)
    .y((d: any) => d.x);

  return (
    <VisualizationContainer>
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
               <button
                onClick={() => resetTransform()}
                className="px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/50 backdrop-blur-md transition-all text-sm font-semibold shadow-xl flex items-center gap-2"
              >
                Reset
              </button>
            </div>

            <TransformComponent
              wrapperClass="w-full h-full cursor-move"
              contentClass="w-full h-full"
            >
              <div
                style={{
                  width: width,
                  height: height,
                  position: 'relative',
                  // Center the tree visually in the container initially via padding if needed,
                  // but TransformWrapper's centerOnInit handles centering.
                }}
              >
                {/* Links Layer */}
                <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
                  {links.map((link, i) => (
                    <path
                      key={i}
                      d={linkGenerator(link as any) || ""}
                      fill="none"
                      stroke="#3f3f46"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                  ))}
                </svg>

                {/* Nodes Layer */}
                {nodes.map((node: any, i) => {
                  const colors = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
                  const color = colors[(node.depth || 0) % colors.length];

                  // In horizontal tree: d3 x is vertical, y is horizontal
                  // So left = node.y, top = node.x
                  return (
                    <motion.div
                      key={i}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 px-4 py-2 rounded-xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-md shadow-lg cursor-pointer hover:border-zinc-500 transition-colors group"
                      style={{
                        left: node.y + 100, // +offset
                        top: node.x,
                        borderLeftWidth: '4px',
                        borderLeftColor: color
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start if needed, though react-zoom-pan-pinch usually handles it
                        handleNodeClick(node);
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: node.depth * 0.1 }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white whitespace-nowrap">
                          {node.data.name}
                        </span>
                        {node.data.attributes?.description && (
                           <span className="text-[10px] text-zinc-400 max-w-[200px] truncate">
                             {node.data.attributes.description}
                           </span>
                        )}
                      </div>

                      {/* Expand Indicator */}
                      {node.data.attributes?.extendable && (
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Details Panel */}
      <NodeDetailPanel
        selectedNode={getPanelData()}
        onClose={() => setSelectedNode(null)}
        onExpand={handleExpandNode}
        isExpanding={isExpanding}
        readOnly={readOnly}
      />
    </VisualizationContainer>
  );
}
