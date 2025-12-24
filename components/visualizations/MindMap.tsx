"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Background,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  MindMapData,
  MindMapNode as MindMapNodeType,
} from "@/lib/types/visualization";
import { Sparkles } from "lucide-react";
import FloatingEdge from "./utils/FloatingEdge";
import FloatingConnectionLine from "./utils/FloatingConnectionLine";
import { useExtendedNodes } from "@/lib/context/ExtendedNodesContext";
import VisualizationContainer from "./VisualizationContainer";
import NodeDetailPanel from "./NodeDetailPanel";

interface MindMapProps {
  data: MindMapData;
  onExpand?: (nodeId: string, nodeContent: string) => Promise<void>;
  readOnly?: boolean;
  visualizationKey?: string;
}

export interface MindMapHandle {
  exportPNG: (scale?: number) => Promise<void>;
  exportSVG: () => Promise<void>;
  getData: () => MindMapData;
}

const COLORS = [
  "#a855f7",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
];

interface NodeData {
  label: string;
  description?: string;
  level: number;
  extendable?: boolean;
  keyPoints?: string[];
  relatedConcepts?: string[];
  nodeId: string;
  onExpand: (nodeId: string, content: string) => Promise<void>;
  onShowDetails: (data: NodeData) => void;
  readOnly?: boolean;
}

const MindMapNode = ({ data }: { data: NodeData }) => {
  const color = COLORS[data.level % COLORS.length];
  const isRoot = data.level === 0;

  return (
    <div
      onClick={() => data.onShowDetails(data)}
      className="cursor-pointer"
      style={{ minWidth: isRoot ? "200px" : "150px" }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Right} />
      <Handle type="target" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />

      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />

      <div
        className="px-5 py-3 rounded-2xl shadow-xl transition-all duration-200 hover:scale-105"
        style={{
          background: isRoot
            ? `linear-gradient(135deg, ${color}, ${color}dd)`
            : `linear-gradient(135deg, ${color}35, ${color}25)`,
          border: `3px solid ${color}`,
          boxShadow: `0 0 25px ${color}60`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-bold text-white text-center flex-1"
            style={{
              fontSize: isRoot ? "17px" : "14px",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {data.label}
          </p>

          {data.extendable && !data.readOnly && (
            <div className="p-1 rounded-full">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  mindMapNode: MindMapNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

// Improved hierarchical radial layout with better spacing
const createMindMapLayout = (
  root: MindMapNodeType | undefined
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!root?.id) return { nodes, edges };

  const centerX = 0;
  const centerY = 0;
  const baseRadius = 320; // Increased spacing between levels
  const nodeWidth = 200;
  const nodeHeight = 60;

  const buildTree = (
    node: MindMapNodeType,
    parentId: string | null,
    level: number,
    siblingIndex: number,
    totalSiblings: number,
    parentAngle: number = 0
  ) => {
    if (!node?.id) return;

    let x = centerX;
    let y = centerY;
    let currentAngle = 0;

    if (level === 0) {
      // Root at center
      x = centerX;
      y = centerY;
    } else if (level === 1) {
      // First level: evenly distributed in full circle
      currentAngle = (siblingIndex / totalSiblings) * 2 * Math.PI;
      x = centerX + baseRadius * Math.cos(currentAngle);
      y = centerY + baseRadius * Math.sin(currentAngle);
    } else {
      // Deeper levels: positioned in wider arcs around parent
      const baseAngle = parentAngle;
      // Use dynamic arc span based on number of children (wider for more children)
      const arcSpan = Math.min(Math.PI * 1.2, Math.PI / 2 + (totalSiblings * 0.15));
      const angleStep = totalSiblings > 1 ? arcSpan / (totalSiblings - 1) : 0;
      currentAngle = baseAngle - arcSpan / 2 + siblingIndex * angleStep;
      // Increase radius for each level with better spacing
      const radius = level * baseRadius * 0.85;
      x = centerX + radius * Math.cos(currentAngle);
      y = centerY + radius * Math.sin(currentAngle);
    }

    // Center node based on actual size
    nodes.push({
      id: node.id,
      type: "mindMapNode",
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2
      },
      data: {
        label: node.content,
        description: node.description,
        level: node.level || 0,
        extendable: node.extendable || false,
        keyPoints: node.metadata?.keyPoints,
        relatedConcepts: node.metadata?.relatedConcepts,
        nodeId: node.id,
      },
      draggable: true,
    });

    if (parentId) {
      const color = COLORS[(node.level || 0) % COLORS.length];
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "floating",
        animated: true,
        style: {
          stroke: color,
          strokeWidth: 4,
        },
      });
    }

    if (node.children?.length) {
      node.children.forEach((child, i) => {
        buildTree(
          child,
          node.id,
          level + 1,
          i,
          node.children!.length,
          currentAngle
        );
      });
    }
  };

  buildTree(root, null, 0, 0, 1, 0);
  return { nodes, edges };
};

const MindMapInner = forwardRef<MindMapHandle, MindMapProps>(
  ({ data, onExpand, readOnly = false, visualizationKey = "default" }, ref) => {
    const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(
      null
    );
    const [isExpanding, setIsExpanding] = useState(false);
    const { addExtendedNode, isNodeExtended } = useExtendedNodes();
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    const handleExpand = useCallback(
      async (nodeId: string, content: string) => {
        if (!onExpand) return;
        setIsExpanding(true);
        try {
          await onExpand(nodeId, content);
          // Mark node as extended for this visualization (save to database)
          await addExtendedNode(nodeId, visualizationKey);
        } finally {
          setIsExpanding(false);
        }
      },
      [onExpand, addExtendedNode, visualizationKey]
    );

    const handleShowDetails = useCallback((nodeData: NodeData) => {
      setSelectedNodeData(nodeData);
    }, []);

    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!data?.root) return { nodes: [], edges: [] };

      const result = createMindMapLayout(data.root);

      const nodesWithHandlers = result.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onExpand: handleExpand,
          onShowDetails: handleShowDetails,
          readOnly,
        },
      }));

      return { nodes: nodesWithHandlers, edges: result.edges };
    }, [data, handleExpand, handleShowDetails, readOnly]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    useEffect(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    const handleExportPNG = useCallback(async () => {
      const element = document.querySelector('.react-flow') as HTMLElement;
      if (!element) return;

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, {
        backgroundColor: '#09090b',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `mindmap-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }, []);

    const handleReset = () => {
        fitView({ padding: 0.25, duration: 400 });
    };

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Shift + R: Reset view
        if (e.shiftKey && e.key === 'R') {
          e.preventDefault();
          fitView({ padding: 0.25, duration: 400 });
        }
        // Shift + E: Export PNG
        if (e.shiftKey && e.key === 'E') {
          e.preventDefault();
          handleExportPNG();
        }
        // +/=: Zoom in
        if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          zoomIn({ duration: 200 });
        }
        // -: Zoom out
        if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          zoomOut({ duration: 200 });
        }
        // Escape: Close panels
        if (e.key === 'Escape') {
          setSelectedNodeData(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fitView, handleExportPNG, zoomIn, zoomOut]);

    useImperativeHandle(
      ref,
      () => ({
        exportPNG: handleExportPNG,
        exportSVG: async () => console.log("Export SVG not implemented"),
        getData: () => data,
      }),
      [data, handleExportPNG]
    );

    // Map NodeData to standard selectedNode structure for NodeDetailPanel
    const panelNode = useMemo(() => {
      if (!selectedNodeData) return null;
      const color = COLORS[selectedNodeData.level % COLORS.length];
      return {
        id: selectedNodeData.nodeId,
        label: selectedNodeData.label,
        category: `Level ${selectedNodeData.level}`,
        description: selectedNodeData.description,
        color: color,
        extendable: selectedNodeData.extendable,
        keyPoints: selectedNodeData.keyPoints,
        relatedConcepts: selectedNodeData.relatedConcepts,
      };
    }, [selectedNodeData]);

    const handlePanelExpand = () => {
        if (selectedNodeData) {
            handleExpand(selectedNodeData.nodeId, selectedNodeData.label);
            setSelectedNodeData(null);
        }
    };

    return (
      <VisualizationContainer onReset={handleReset} onExport={handleExportPNG}>
        <div className="w-full h-full relative floating-edges">
            <style>{`
            .floating-edges .react-flow__handle {
                opacity: 0;
            }
            .react-flow__edge-path {
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            .react-flow__edge.animated path {
                stroke-dasharray: 5;
                animation: dashdraw 0.5s linear infinite;
            }
            @keyframes dashdraw {
                to {
                stroke-dashoffset: -10;
                }
            }
            `}</style>

            {(!data || !data.root) && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-zinc-400 text-center">
                <p className="text-lg font-semibold">No mind map data</p>
                </div>
            </div>
            )}

            {data && data.root && (
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={FloatingConnectionLine}
                defaultEdgeOptions={{
                style: {
                    strokeWidth: 4,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                },
                animated: true,
                }}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.2}
                maxZoom={2}
                selectNodesOnDrag={false}
                panOnScroll
                zoomOnScroll
                zoomOnPinch
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
                style={{ width: '100%', height: '100%' }}
            >
                <Background gap={16} size={1} color="#27272a" />
            </ReactFlow>
            )}

            {/* Shared Details Panel */}
            <NodeDetailPanel
                selectedNode={panelNode}
                onClose={() => setSelectedNodeData(null)}
                onExpand={handlePanelExpand}
                isExpanding={isExpanding}
                readOnly={readOnly}
                isExtended={selectedNodeData ? isNodeExtended(selectedNodeData.nodeId, visualizationKey) : false}
            />
        </div>
      </VisualizationContainer>
    );
  }
);

MindMapInner.displayName = "MindMapInner";

const MindMapVisualization = forwardRef<MindMapHandle, MindMapProps>(
  (props, ref) => {
    return (
      <ReactFlowProvider>
        <MindMapInner {...props} ref={ref} />
      </ReactFlowProvider>
    );
  }
);

MindMapVisualization.displayName = "MindMapVisualization";

export default MindMapVisualization;
