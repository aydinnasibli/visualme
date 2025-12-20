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
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  MindMapData,
  MindMapNode as MindMapNodeType,
} from "@/lib/types/visualization";
import { Sparkles, X } from "lucide-react";
import FloatingEdge from "./FloatingEdge";
import FloatingConnectionLine from "./FloatingConnectionLine";
import { useExtendedNodes } from "@/lib/context/ExtendedNodesContext";

interface MindMapProps {
  data: MindMapData;
  onExpand?: (nodeId: string, nodeContent: string) => Promise<void>;
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

          {data.extendable && (
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
  ({ data, onExpand }, ref) => {
    const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(
      null
    );
    const [isExpanding, setIsExpanding] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const { addExtendedNode, isNodeExtended } = useExtendedNodes();
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    const handleExpand = useCallback(
      async (nodeId: string, content: string) => {
        if (!onExpand) return;
        setIsExpanding(true);
        try {
          await onExpand(nodeId, content);
          // Mark node as extended globally (save to database)
          await addExtendedNode(nodeId);
        } finally {
          setIsExpanding(false);
        }
      },
      [onExpand, addExtendedNode]
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
        },
      }));

      return { nodes: nodesWithHandlers, edges: result.edges };
    }, [data, handleExpand, handleShowDetails]);

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

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // ?: Show help
        if (e.key === '?') {
          e.preventDefault();
          setShowHelp(prev => !prev);
        }
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
          setShowHelp(false);
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

    return (
      <div className="relative w-full h-[750px]  rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden floating-edges">
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
          >
            <Background gap={16} size={1} color="#27272a" />
            <Panel position="top-right" className="flex gap-2">
              <button
                onClick={() => fitView({ padding: 0.25, duration: 400 })}
                className="px-3 py-2 bg-zinc-800/90 hover:bg-zinc-700 text-white rounded-lg border border-zinc-600 transition text-sm font-medium"
                title="Reset View (Shift + R)"
              >
                Reset View
              </button>
              <button
                onClick={handleExportPNG}
                className="px-3 py-2 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg border border-purple-500 transition text-sm font-medium"
                title="Export as PNG (Shift + E)"
              >
                Export PNG
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="px-3 py-2 bg-zinc-800/90 hover:bg-zinc-700 text-white rounded-lg border border-zinc-600 transition text-sm font-medium"
                title="Keyboard Shortcuts (?)"
              >
                ?
              </button>
            </Panel>
          </ReactFlow>
        )}

        {/* Keyboard Shortcuts Help */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 right-4 bg-zinc-900/95 border border-zinc-700 rounded-xl p-4 shadow-2xl z-50 backdrop-blur-sm"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-zinc-400">Pan</span>
                  <span className="text-white font-mono">Click + Drag</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-zinc-400">Zoom</span>
                  <span className="text-white font-mono">Scroll / +/-</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-zinc-400">Reset View</span>
                  <span className="text-white font-mono">Shift + R</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-zinc-400">Export PNG</span>
                  <span className="text-white font-mono">Shift + E</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-zinc-400">Toggle Help</span>
                  <span className="text-white font-mono">?</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-zinc-400">Close Panels</span>
                  <span className="text-white font-mono">Esc</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details Panel */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-4 left-4 max-w-sm z-50"
            >
              <div
                className="rounded-xl p-5 shadow-2xl border backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${
                    COLORS[selectedNodeData.level % COLORS.length]
                  }15, rgba(9,9,11,0.95))`,
                  borderColor: `${
                    COLORS[selectedNodeData.level % COLORS.length]
                  }60`,
                }}
              >
                <button
                  onClick={() => setSelectedNodeData(null)}
                  className="absolute top-3 right-3 p-1 rounded hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>

                <h3 className="text-lg font-bold text-white mb-2 pr-6">
                  {selectedNodeData.label}
                </h3>

                {selectedNodeData.description && (
                  <p className="text-sm text-zinc-300 mb-3">
                    {selectedNodeData.description}
                  </p>
                )}

                {selectedNodeData.keyPoints?.length && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                      Key Points
                    </h4>
                    <ul className="space-y-1">
                      {selectedNodeData.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="text-sm text-zinc-200 flex gap-2"
                        >
                          <span
                            className="w-1 h-1 rounded-full mt-2"
                            style={{
                              backgroundColor:
                                COLORS[selectedNodeData.level % COLORS.length],
                            }}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedNodeData.relatedConcepts?.length && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                      Related
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNodeData.relatedConcepts.map((concept, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: `${
                              COLORS[selectedNodeData.level % COLORS.length]
                            }20`,
                            color:
                              COLORS[selectedNodeData.level % COLORS.length],
                            border: `1px solid ${
                              COLORS[selectedNodeData.level % COLORS.length]
                            }40`,
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNodeData.extendable && (
                  isNodeExtended(selectedNodeData.nodeId) ? (
                    <div
                      className="w-full mt-2 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${
                          COLORS[selectedNodeData.level % COLORS.length]
                        }40, ${
                          COLORS[selectedNodeData.level % COLORS.length]
                        }20)`,
                        color: COLORS[selectedNodeData.level % COLORS.length],
                        border: `1px solid ${COLORS[selectedNodeData.level % COLORS.length]}60`,
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Extended
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        await handleExpand(
                          selectedNodeData.nodeId,
                          selectedNodeData.label
                        );
                        setSelectedNodeData(null);
                      }}
                      disabled={isExpanding}
                      className="w-full mt-2 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${
                          COLORS[selectedNodeData.level % COLORS.length]
                        }80, ${
                          COLORS[selectedNodeData.level % COLORS.length]
                        }60)`,
                        color: "white",
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isExpanding ? "Extending..." : "Extend & Explore"}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
