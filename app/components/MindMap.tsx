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
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { motion, AnimatePresence } from "framer-motion";
import { MindMapData, MindMapNode as MindMapNodeType } from "@/lib/types/visualization";
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
        minWidth: isRoot ? "200px" : "160px",
      }}
    >
      {/* Node Container */}
      <div
        className="relative px-4 py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-2xl cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          border: `2px solid ${color}80`,
          boxShadow: `0 0 20px ${color}40, 0 4px 6px rgba(0,0,0,0.3)`,
        }}
        onClick={() => data.onShowDetails(data)}
      >
        {/* Glow Effect */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-sm leading-tight text-white truncate"
              style={{
                fontSize: isRoot ? "16px" : "14px",
                fontWeight: isRoot ? 700 : 600,
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
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title={data.collapsed ? "Expand" : "Collapse"}
              >
                {data.collapsed ? (
                  <ChevronRight className="w-4 h-4 text-white/70" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/70" />
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
                className="p-1 rounded hover:bg-white/10 transition-colors group/expand"
                title="Expand with AI"
              >
                <Sparkles className="w-4 h-4 text-yellow-400 group-hover/expand:text-yellow-300 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Extendable indicator */}
        {data.extendable && !data.hasChildren && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: `2px dashed ${color}60`,
              borderRadius: "12px",
              transform: "scale(1.05)",
            }}
          />
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  mindMapNode: CustomMindMapNode,
};

// Convert tree structure to nodes and edges with dagre layout
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

  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB", // Top to bottom
    nodesep: 100,
    ranksep: 120,
    marginx: 50,
    marginy: 50,
  });

  // Traverse tree and collect nodes/edges
  const traverse = (node: MindMapNodeType | undefined, parentId: string | null = null) => {
    // Safety check
    if (!node || !node.id) return;

    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0;

    nodes.push({
      id: node.id,
      type: "mindMapNode",
      position: { x: 0, y: 0 }, // Will be set by dagre
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

    // Add node to dagre graph
    const width = node.level === 0 ? 200 : 160;
    const height = 50;
    dagreGraph.setNode(node.id, { width, height });

    if (parentId) {
      const color = LEVEL_COLORS[(node.level || 0) % LEVEL_COLORS.length];
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: ConnectionLineType.Bezier,
        style: {
          stroke: `${color}80`,
          strokeWidth: 2,
        },
        animated: false,
      });
      dagreGraph.setEdge(parentId, node.id);
    }

    // Recursively process children if not collapsed
    if (!isCollapsed && node.children) {
      node.children.forEach((child) => traverse(child, node.id));
    }
  };

  traverse(root);

  // Apply dagre layout
  dagre.layout(dagreGraph);

  // Update node positions from dagre
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };
  });

  return { nodes, edges };
};

// Helper to collect all node IDs from tree
const collectAllNodeIds = (node: MindMapNodeType): string[] => {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach((child) => {
      ids.push(...collectAllNodeIds(child));
    });
  }
  return ids;
};

const MindMapVisualization = forwardRef<MindMapHandle, MindMapProps>(
  ({ data, onExpand }, ref) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
      new Set()
    );
    const [selectedNodeData, setSelectedNodeData] =
      useState<CustomNodeData | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);

    // Compute nodes and edges with layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!data || !data.root) {
        return { nodes: [], edges: [] };
      }
      return getLayoutedElements(data.root, collapsedNodes);
    }, [data, collapsedNodes]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Update nodes when layout changes
    React.useEffect(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

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

    // Inject handlers into node data
    React.useEffect(() => {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onToggleCollapse: handleToggleCollapse,
            onExpand: handleExpand,
            onShowDetails: handleShowDetails,
          },
        }))
      );
    }, [handleToggleCollapse, handleExpand, handleShowDetails, setNodes]);

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
      <div className="relative w-full h-[750px] bg-zinc-950 rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.Bezier}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#27272a" gap={16} />
          <Controls className="bg-zinc-900/80 border border-zinc-700 rounded-lg" />
          <MiniMap
            className="bg-zinc-900/80 border border-zinc-700 rounded-lg"
            nodeColor={(node) => {
              const level = (node.data as any)?.level || 0;
              return LEVEL_COLORS[level % LEVEL_COLORS.length];
            }}
          />

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
                    LEVEL_COLORS[
                      selectedNodeData.level % LEVEL_COLORS.length
                    ]
                  }15 0%, rgba(9, 9, 11, 0.95) 50%)`,
                  borderColor: `${
                    LEVEL_COLORS[
                      selectedNodeData.level % LEVEL_COLORS.length
                    ]
                  }60`,
                  boxShadow: `0 0 30px ${
                    LEVEL_COLORS[
                      selectedNodeData.level % LEVEL_COLORS.length
                    ]
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
                {selectedNodeData.extendable && !selectedNodeData.hasChildren && (
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
      </div>
    );
  }
);

MindMapVisualization.displayName = "MindMapVisualization";

export default MindMapVisualization;
