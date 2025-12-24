"use client";

import React, { useEffect, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
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

  // State to force re-render/reset
  const [translate, setTranslate] = useState({ x: 100, y: 350 });
  const [zoom, setZoom] = useState(1);

  // Helper for tracking wheel events for panning
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      // Set initial translation based on new dimensions
      setTranslate({ x: 100, y: containerRef.current.clientHeight / 2 });
    }
    
    // Resize observer to update dimensions on window resize
    const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        }
    });
    
    const currentRef = containerRef.current;
    if (currentRef) {
        observer.observe(currentRef);
    }

    // Add wheel event listener for custom panning (emulating trackpad pan)
    const handleWheel = (e: WheelEvent) => {
      // Prevent default to stop browser going back/forward or scrolling page
      e.preventDefault();

      // If ctrl key is pressed, it's a zoom gesture on some trackpads/mice
      if (e.ctrlKey) {
        // Simple zoom approximation
        const zoomDelta = -e.deltaY * 0.001;
        setZoom(prev => Math.max(0.1, Math.min(3, prev + zoomDelta)));
      } else {
        // Pan
        setTranslate(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      observer.disconnect();
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleNodeClick = (nodeDatum: TreeCustomNode) => {
    setSelectedNode(nodeDatum);
  };

  const handleExpandNode = async () => {
    if (!selectedNode || !onExpand) return;
    
    if (!selectedNode.attributes?.extendable) return;

    setIsExpanding(true);
    try {
      await onExpand(selectedNode.__rd3t.id, selectedNode.name);
      // await addExtendedNode(selectedNode.__rd3t.id, visualizationKey);
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to expand tree node:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleReset = () => {
    // Reset zoom and translate
    setZoom(1);
    setTranslate({ x: 100, y: dimensions.height / 2 });
  };

  // Prepare node data for the detailed panel
  const getPanelData = () => {
    if (!selectedNode) return null;

    const colors = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
    const color = colors[(selectedNode.__rd3t.depth || 0) % colors.length];

    return {
      id: selectedNode.__rd3t.id,
      label: selectedNode.name,
      category: `Level ${selectedNode.__rd3t.depth}`,
      color: color,
      description: selectedNode.attributes?.description,
      extendable: selectedNode.attributes?.extendable,
      keyPoints: selectedNode.attributes?.keyPoints,
      relatedConcepts: selectedNode.attributes?.relatedConcepts,
      degree: selectedNode.children ? selectedNode.children.length : 0,
    };
  };

  return (
    <VisualizationContainer onReset={handleReset}>
      <div ref={containerRef} className="w-full h-full relative cursor-move">
        {dimensions.width > 0 && (
          <Tree
            data={data}
            translate={translate}
            zoom={zoom}
            nodeSize={{ x: 200, y: 100 }}
            renderCustomNodeElement={(rd3tProps) => (
              <CustomNode
                {...rd3tProps}
                onNodeClick={() => handleNodeClick(rd3tProps.nodeDatum)}
              />
            )}
            pathClassFunc={() => 'custom-link'}
            zoomable={true}
            draggable={false} // Disable d3-tree dragging to rely on our custom pan, or we can keep it for click-drag
            separation={{ siblings: 1.5, nonSiblings: 2 }}
            orientation="horizontal"
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
    </VisualizationContainer>
  );
}
