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
  Background,
  Controls,
  Panel,
  MiniMap,
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

// Vibrant color palette for mind map levels
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

// Custom Mind Map Node Component - Fully clickable and interactive
const MindMapNode = ({ data }: { data: CustomNodeData }) => {
  const color = LEVEL_COLORS[data.level % LEVEL_COLORS.length];
  const isRoot = data.level === 0;

  return (
    <div
      className="relative group cursor-pointer"
      style={{
        minWidth: isRoot ? "220px" : "160px",
        maxWidth: isRoot ? "280px" : "220px",
      }}
      onClick={() => data.onShowDetails(data)}
    >
      <div
        className="relative px-5 py-3.5 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
        style={{
          background: isRoot
            ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
            : `linear-gradient(135deg, ${color}30 0%, ${color}20 100%)`,
          border: `2.5px solid ${color}`,
          boxShadow: `0 0 20px ${color}40, 0 4px 12px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Hover glow effect */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="font-bold leading-tight text-white break-words"
              style={{
                fontSize: isRoot ? "17px" : "14px",
                fontWeight: isRoot ? 700 : 600,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {data.label}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {data.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleCollapse(data.nodeId);
                }}
                className="p-1.5 rounded-full hover:bg-white/30 transition-all"
                title={data.collapsed ? "Expand" : "Collapse"}
              >
                {data.collapsed ? (
                  <ChevronRight className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white" />
                )}
              </button>
            )}

            {data.extendable && !data.hasChildren && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await data.onExpand(data.nodeId, data.label);
                }}
                className="p-1.5 rounded-full hover:bg-yellow-400/30 transition-all"
                title="Expand with AI"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  mindMapNode: MindMapNode,
};

// Radial mind map layout algorithm
const createMindMapLayout = (
  root: MindMapNodeType | undefined,
  collapsedNodes: Set<string>
) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!root || !root.id) {
    return { nodes: [], edges: [] };
  }

  const centerX = 0;
  const centerY = 0;
  const levelDistance = 300; // Distance between levels

  // Count descendants for space allocation
  const countDescendants = (node: MindMapNodeType): number => {
    if (
      !node.children ||
      node.children.length === 0 ||
      collapsedNodes.has(node.id)
    ) {
      return 1;
    }
    return node.children.reduce(
      (sum, child) => sum + countDescendants(child),
      0
    );
  };

  const buildTree = (
    node: MindMapNodeType,
    parentId: string | null,
    startAngle: number,
    endAngle: number,
    depth: number
  ) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0;

    // Calculate position
    let x = centerX;
    let y = centerY;

    if (depth > 0) {
      const midAngle = (startAngle + endAngle) / 2;
      const radius = depth * levelDistance;
      const angleRad = (midAngle * Math.PI) / 180;
      x = centerX + radius * Math.cos(angleRad);
      y = centerY + radius * Math.sin(angleRad);
    }

    // Create node
    const nodeWidth = depth === 0 ? 250 : 190;
    const nodeHeight = 70;

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

    // Create edge
    if (parentId) {
      const color = LEVEL_COLORS[(node.level || 0) % LEVEL_COLORS.length];
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "smoothstep",
        style: {
          stroke: color,
          strokeWidth: Math.max(5 - depth * 0.5, 2.5),
        },
        animated: false,
      });
    }

    // Process children if not collapsed
    if (!isCollapsed && node.children && node.children.length > 0) {
      const angleSpan = depth === 0 ? 360 : endAngle - startAngle;
      const childDescendants = node.children.map(countDescendants);
      const totalDescendants = childDescendants.reduce((a, b) => a + b, 0);

      let currentAngle = startAngle;

      node.children.forEach((child, index) => {
        const proportion = childDescendants[index] / totalDescendants;
        const allocatedAngle = angleSpan * proportion;

        buildTree(
          child,
          node.id,
          currentAngle,
          currentAngle + allocatedAngle,
          depth + 1
        );

        currentAngle += allocatedAngle;
      });
    }
  };

  buildTree(root, null, 0, 360, 0);

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

    // Collapse/expand handler
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

    // Expand with AI handler
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

    // Show details handler
    const handleShowDetails = useCallback((nodeData: CustomNodeData) => {
      setSelectedNodeData(nodeData);
    }, []);

    // Generate layout with handlers injected
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!data || !data.root) {
        return { nodes: [], edges: [] };
      }

      const result = createMindMapLayout(data.root, collapsedNodes);

      // Inject event handlers into node data
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
    }, [data, collapsedNodes, handleToggleCollapse, handleExpand, handleShowDetails]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Update when layout changes
    useEffect(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    // Export functionality
    useImperativeHandle(
      ref,
      () => ({
        exportPNG: async (scale = 2) => {
          console.log("Export PNG not yet implemented");
        },
        exportSVG: async () => {
          console.log("Export SVG not yet implemented");
        },
        getData: () => data,
      }),
      [data]
    );

    return (
      <div className="relative w-full h-[750px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Loading/Empty states */}
        {(!data || !data.root) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-zinc-400 text-center">
              <p className="text-lg font-semibold mb-2">No mind map data</p>
              <p className="text-sm">Waiting for data to load...</p>
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
            fitView
            fitViewOptions={{ padding: 0.3, maxZoom: 1, minZoom: 0.4 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#444" gap={20} size={1} />
            <Controls className="bg-zinc-800/90 border-zinc-700" />
            <MiniMap
              className="bg-zinc-900/90 border-zinc-700"
              nodeColor={(node) => {
                const level = (node.data as any).level || 0;
                return LEVEL_COLORS[level % LEVEL_COLORS.length];
              }}
            />

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
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="absolute top-4 left-4 max-w-sm z-50 pointer-events-auto"
            >
              <div
                className="rounded-2xl p-6 shadow-2xl border backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${
                    LEVEL_COLORS[selectedNodeData.level % LEVEL_COLORS.length]
                  }20 0%, rgba(9, 9, 11, 0.95) 50%)`,
                  borderColor: `${
                    LEVEL_COLORS[selectedNodeData.level % LEVEL_COLORS.length]
                  }60`,
                  boxShadow: `0 0 30px ${
                    LEVEL_COLORS[selectedNodeData.level % LEVEL_COLORS.length]
                  }30, 0 10px 40px rgba(0,0,0,0.6)`,
                }}
              >
                <button
                  onClick={() => setSelectedNodeData(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                </button>

                <h3 className="text-xl font-bold text-white mb-3 pr-8">
                  {selectedNodeData.label}
                </h3>

                {selectedNodeData.description && (
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                    {selectedNodeData.description}
                  </p>
                )}

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
                              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
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

                {selectedNodeData.relatedConcepts &&
                  selectedNodeData.relatedConcepts.length > 0 && (
                    <div className="mb-4">
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
                    className="mt-4 w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* Custom styles for better edge rendering */}
        <style jsx global>{`
          .react-flow__edge-path {
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
          }
          .react-flow__edge {
            pointer-events: none !important;
          }
        `}</style>
      </div>
    );
  }
);

MindMapVisualization.displayName = "MindMapVisualization";

export default MindMapVisualization;
