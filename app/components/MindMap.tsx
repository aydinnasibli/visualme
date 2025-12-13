"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  MindMapData,
  MindMapNode as MindMapNodeType,
} from "@/lib/types/visualization";
import { ChevronDown, ChevronRight, Sparkles, X } from "lucide-react";

interface MindMapProps {
  data: MindMapData;
  onExpand?: (nodeId: string, nodeContent: string) => Promise<void>;
}

export interface MindMapHandle {
  exportPNG: (scale?: number) => Promise<void>;
  exportSVG: () => Promise<void>;
  getData: () => MindMapData;
}

// Color palette - matching NetworkGraph aesthetic
const LEVEL_COLORS = [
  "#a855f7", // purple - root
  "#06b6d4", // cyan - level 1
  "#10b981", // emerald - level 2
  "#f59e0b", // amber - level 3
  "#ec4899", // pink - level 4
  "#6366f1", // indigo - level 5
];

interface CustomNodeData {
  label: string;
  description?: string;
  level: number;
  extendable?: boolean;
  keyPoints?: string[];
  relatedConcepts?: string[];
  nodeId: string;
  collapsed: boolean;
  hasChildren: boolean;
  onToggleCollapse: (nodeId: string) => void;
  onExpand: (nodeId: string, nodeContent: string) => Promise<void>;
  onShowDetails: (data: CustomNodeData) => void;
}

// Custom Mind Map Node Component
const CustomMindMapNode = ({ data }: { data: CustomNodeData }) => {
  const color = LEVEL_COLORS[data.level % LEVEL_COLORS.length];
  const isRoot = data.level === 0;

  return (
    <div
      className="relative group"
      style={{
        minWidth: isRoot ? "200px" : "140px",
        maxWidth: isRoot ? "260px" : "200px",
      }}
    >
      {/* Node Container - Traditional Mind Map Style */}
      <div
        className="relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-2xl cursor-pointer"
        style={{
          background: isRoot
            ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
            : `linear-gradient(135deg, ${color}25 0%, ${color}15 100%)`,
          border: `2px solid ${color}`,
          boxShadow: isRoot
            ? `0 0 30px ${color}40, 0 4px 12px rgba(0,0,0,0.3)`
            : `0 0 15px ${color}30, 0 2px 8px rgba(0,0,0,0.2)`,
        }}
        onClick={() => data.onShowDetails(data)}
      >
        {/* Glow Effect on Hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
            filter: "blur(10px)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="font-bold leading-tight text-white break-words"
              style={{
                fontSize: isRoot ? "16px" : "13px",
                fontWeight: isRoot ? 700 : 600,
                textShadow: isRoot ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {data.label}
            </p>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Collapse/Expand Toggle */}
            {data.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleCollapse(data.nodeId);
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                title={data.collapsed ? "Expand" : "Collapse"}
              >
                {data.collapsed ? (
                  <ChevronRight className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white" />
                )}
              </button>
            )}

            {/* Extend Button for extendable nodes */}
            {data.extendable && !data.hasChildren && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await data.onExpand(data.nodeId, data.label);
                }}
                className="p-1 rounded-full hover:bg-yellow-400/20 transition-colors group/expand"
                title="Expand with AI"
              >
                <Sparkles className="w-4 h-4 text-yellow-300 group-hover/expand:text-yellow-200 transition-colors drop-shadow-lg" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  mindMapNode: CustomMindMapNode,
};

// Proper Radial Mind Map Layout - Clean hierarchical tree structure
const getLayoutedElements = (
  root: MindMapNodeType | undefined,
  collapsedNodes: Set<string>
) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Safety check - return empty if no root
  if (!root || !root.id) {
    return { nodes: [], edges: [] };
  }

  // Layout parameters - optimized for clarity
  const centerX = 0;
  const centerY = 0;
  const baseRadius = 280; // Base distance from root to first level
  const radiusIncrement = 200; // Additional distance per level

  // Count total descendants for angle allocation
  const countDescendants = (node: MindMapNodeType): number => {
    if (!node.children || node.children.length === 0) return 1;
    if (collapsedNodes.has(node.id)) return 1;
    return node.children.reduce(
      (sum, child) => sum + countDescendants(child),
      0
    );
  };

  // Calculate positions recursively with improved radial layout
  const traverse = (
    node: MindMapNodeType,
    parentId: string | null = null,
    startAngle: number = 0,
    endAngle: number = 360,
    depth: number = 0
  ) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0;

    // Calculate position
    let x = centerX;
    let y = centerY;

    if (depth > 0) {
      // Position nodes radially from center
      const midAngle = (startAngle + endAngle) / 2;
      const radius = baseRadius + (depth - 1) * radiusIncrement;
      const angleRad = (midAngle * Math.PI) / 180;
      x = centerX + radius * Math.cos(angleRad);
      y = centerY + radius * Math.sin(angleRad);
    }

    // Node width/height approximations for centering
    const nodeWidth = depth === 0 ? 230 : 170;
    const nodeHeight = 60;

    nodes.push({
      id: node.id,
      type: "mindMapNode",
      position: { x: x - nodeWidth / 2, y: y - nodeHeight / 2 },
      data: {
        label: node.content,
        description: node.description,
        level: node.level || 0,
        extendable: node.extendable || false,
        keyPoints: node.metadata?.keyPoints,
        relatedConcepts: node.metadata?.relatedConcepts,
        nodeId: node.id,
        collapsed: isCollapsed,
        hasChildren,
      },
    });

    // Create edge to parent with smooth bezier curve
    if (parentId) {
      const color = LEVEL_COLORS[(node.level || 0) % LEVEL_COLORS.length];
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: ConnectionLineType.Bezier,
        style: {
          stroke: color,
          strokeWidth: Math.max(4 - depth * 0.5, 2),
          strokeOpacity: 0.85,
        },
        animated: false,
      });
    }

    // Process children if not collapsed
    if (!isCollapsed && node.children && node.children.length > 0) {
      const childCount = node.children.length;

      // Calculate angle span for this subtree
      let totalAngleSpan = endAngle - startAngle;

      // For root node, use full circle
      if (depth === 0) {
        totalAngleSpan = 360;
      }

      // Count descendants for proportional angle allocation
      const childDescendants = node.children.map(countDescendants);
      const totalDescendants = childDescendants.reduce((a, b) => a + b, 0);

      // Allocate angles proportionally to subtree sizes
      let currentAngle = startAngle;
      node.children.forEach((child, index) => {
        const proportion = childDescendants[index] / totalDescendants;
        const allocatedAngle = totalAngleSpan * proportion;
        const childStart = currentAngle;
        const childEnd = currentAngle + allocatedAngle;

        traverse(child, node.id, childStart, childEnd, depth + 1);

        currentAngle = childEnd;
      });
    }
  };

  traverse(root);

  return { nodes, edges };
};

const MindMapVisualization = forwardRef<MindMapHandle, MindMapProps>(
  ({ data, onExpand }, ref) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
      new Set()
    );
    const [selectedNodeData, setSelectedNodeData] =
      useState<CustomNodeData | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);

    // Toggle collapse/expand
    const handleToggleCollapse = useCallback((nodeId: string) => {
      setCollapsedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    }, []);

    // Handle expand with AI
    const handleExpand = useCallback(
      async (nodeId: string, nodeContent: string) => {
        if (!onExpand) return;
        setIsExpanding(true);
        try {
          await onExpand(nodeId, nodeContent);
        } finally {
          setIsExpanding(false);
        }
      },
      [onExpand]
    );

    // Show node details
    const handleShowDetails = useCallback((data: CustomNodeData) => {
      setSelectedNodeData(data);
    }, []);

    // Compute nodes and edges with layout - WITH handlers already included
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!data || !data.root) {
        return { nodes: [], edges: [] };
      }
      const result = getLayoutedElements(data.root, collapsedNodes);

      // Inject handlers into nodes immediately
      const nodesWithHandlers = result.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onToggleCollapse: handleToggleCollapse,
          onExpand: handleExpand,
          onShowDetails: handleShowDetails,
        },
      }));

      return { nodes: nodesWithHandlers, edges: result.edges };
    }, [
      data,
      collapsedNodes,
      handleToggleCollapse,
      handleExpand,
      handleShowDetails,
    ]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Update nodes when layout changes
    React.useEffect(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    // Export functionality
    useImperativeHandle(
      ref,
      () => ({
        exportPNG: async (scale = 2) => {
          // TODO: Implement export functionality
          console.log("Export PNG not yet implemented for xy-flow");
        },
        exportSVG: async () => {
          console.log("Export SVG not yet implemented for xy-flow");
        },
        getData: () => data,
      }),
      [data]
    );

    return (
      <div className="relative w-full h-[750px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
        {/* Subtle background pattern for depth */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Debug info */}
        {(!data || !data.root) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-zinc-400 text-center">
              <p className="text-lg font-semibold mb-2">
                No mind map data available
              </p>
              <p className="text-sm">Waiting for data to load...</p>
            </div>
          </div>
        )}

        {data && data.root && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-zinc-400 text-center">
              <p className="text-lg font-semibold mb-2">
                Processing mind map...
              </p>
              <p className="text-sm">Generating layout...</p>
            </div>
          </div>
        )}

        {data && data.root && nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.Bezier}
            fitView
            fitViewOptions={{ padding: 0.25, maxZoom: 1.2, minZoom: 0.5 }}
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            defaultEdgeOptions={{
              type: ConnectionLineType.Bezier,
              style: { strokeLinecap: "round", strokeLinejoin: "round" },
            }}
            panOnScroll
            zoomOnScroll
            preventScrolling={false}
          >
            {/* Expanding Indicator */}
            {isExpanding && (
              <Panel position="top-center">
                <div className="px-4 py-2 bg-purple-600/90 backdrop-blur-sm rounded-lg border border-purple-400/50 shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    Expanding with AI...
                  </span>
                </div>
              </Panel>
            )}
          </ReactFlow>
        )}

        {/* Node Details Panel */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-4 left-4 max-w-sm z-50"
            >
              <div
                className="rounded-2xl p-6 shadow-2xl border backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${
                    LEVEL_COLORS[selectedNodeData.level % LEVEL_COLORS.length]
                  }15 0%, rgba(9, 9, 11, 0.95) 50%)`,
                  borderColor: `${
                    LEVEL_COLORS[selectedNodeData.level % LEVEL_COLORS.length]
                  }60`,
                  boxShadow: `0 0 30px ${
                    LEVEL_COLORS[selectedNodeData.level % LEVEL_COLORS.length]
                  }30, 0 10px 40px rgba(0,0,0,0.6)`,
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedNodeData(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                </button>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 pr-8">
                  {selectedNodeData.label}
                </h3>

                {/* Description */}
                {selectedNodeData.description && (
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                    {selectedNodeData.description}
                  </p>
                )}

                {/* Key Points */}
                {selectedNodeData.keyPoints &&
                  selectedNodeData.keyPoints.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                        Key Insights
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedNodeData.keyPoints.map((point, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-zinc-200 flex items-start gap-2"
                          >
                            <span
                              className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  LEVEL_COLORS[
                                    selectedNodeData.level % LEVEL_COLORS.length
                                  ],
                              }}
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Related Concepts */}
                {selectedNodeData.relatedConcepts &&
                  selectedNodeData.relatedConcepts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                        Related Concepts
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedNodeData.relatedConcepts.map(
                          (concept, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md text-xs font-medium"
                              style={{
                                backgroundColor: `${
                                  LEVEL_COLORS[
                                    selectedNodeData.level % LEVEL_COLORS.length
                                  ]
                                }30`,
                                color:
                                  LEVEL_COLORS[
                                    selectedNodeData.level % LEVEL_COLORS.length
                                  ],
                                border: `1px solid ${
                                  LEVEL_COLORS[
                                    selectedNodeData.level % LEVEL_COLORS.length
                                  ]
                                }60`,
                              }}
                            >
                              {concept}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Expand Button */}
                {selectedNodeData.extendable &&
                  !selectedNodeData.hasChildren && (
                    <button
                      onClick={async () => {
                        await handleExpand(
                          selectedNodeData.nodeId,
                          selectedNodeData.label
                        );
                        setSelectedNodeData(null);
                      }}
                      disabled={isExpanding}
                      className="mt-4 w-full px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${
                          LEVEL_COLORS[
                            selectedNodeData.level % LEVEL_COLORS.length
                          ]
                        }80 0%, ${
                          LEVEL_COLORS[
                            selectedNodeData.level % LEVEL_COLORS.length
                          ]
                        }60 100%)`,
                        color: "white",
                        boxShadow: `0 4px 12px ${
                          LEVEL_COLORS[
                            selectedNodeData.level % LEVEL_COLORS.length
                          ]
                        }40`,
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isExpanding ? "Expanding..." : "Expand & Explore Deeper"}
                    </button>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Mind Map Styles */}
        <style jsx>{`
          :global(.react-flow__edge-path) {
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
          }
          :global(.react-flow__edge) {
            pointer-events: none;
          }
          :global(.react-flow__pane) {
            cursor: grab !important;
          }
          :global(.react-flow__pane:active) {
            cursor: grabbing !important;
          }
          :global(.react-flow__node) {
            pointer-events: all;
          }
        `}</style>
      </div>
    );
  }
);

MindMapVisualization.displayName = "MindMapVisualization";

export default MindMapVisualization;
