"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
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

const COLORS = [
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#6366f1", // indigo
];

interface NodeData {
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
  onExpand: (nodeId: string, content: string) => Promise<void>;
  onShowDetails: (data: NodeData) => void;
}

// Custom node component
const MindMapNode = ({ data }: { data: NodeData }) => {
  const color = COLORS[data.level % COLORS.length];
  const isRoot = data.level === 0;

  return (
    <div
      onClick={() => data.onShowDetails(data)}
      className="cursor-pointer group"
      style={{ minWidth: isRoot ? "180px" : "140px" }}
    >
      <div
        className="px-4 py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl"
        style={{
          background: isRoot
            ? `linear-gradient(135deg, ${color}, ${color}dd)`
            : `linear-gradient(135deg, ${color}25, ${color}15)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}50`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-white leading-tight break-words text-center"
              style={{
                fontSize: isRoot ? "16px" : "13px",
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {data.label}
            </p>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            {data.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleCollapse(data.nodeId);
                }}
                className="p-1 rounded hover:bg-white/25 transition"
              >
                {data.collapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            )}
            {data.extendable && !data.hasChildren && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await data.onExpand(data.nodeId, data.label);
                }}
                className="p-1 rounded hover:bg-yellow-400/25 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
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

// Proper radial mind map layout - root centered, children in circles
const createMindMapLayout = (
  root: MindMapNodeType | undefined,
  collapsedNodes: Set<string>
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!root || !root.id) return { nodes, edges };

  const centerX = 400;
  const centerY = 375;
  const radiusPerLevel = 250; // Distance from center per level

  const buildTree = (
    node: MindMapNodeType,
    parentId: string | null,
    parentAngle: number,
    level: number,
    siblingIndex: number,
    totalSiblings: number
  ) => {
    if (!node?.id) return;

    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0;

    let x = centerX;
    let y = centerY;

    // Position nodes
    if (level === 0) {
      // Root at center
      x = centerX;
      y = centerY;
    } else if (level === 1) {
      // First level: arrange in circle around center
      const angle = (siblingIndex / totalSiblings) * 2 * Math.PI;
      x = centerX + radiusPerLevel * Math.cos(angle);
      y = centerY + radiusPerLevel * Math.sin(angle);
    } else {
      // Deeper levels: arrange in arc around parent
      const baseAngle = parentAngle;
      const spreadAngle = Math.PI / 3; // 60 degrees spread
      const startAngle = baseAngle - spreadAngle / 2;
      const angle = startAngle + (siblingIndex / Math.max(totalSiblings - 1, 1)) * spreadAngle;
      const radius = level * radiusPerLevel;
      x = centerX + radius * Math.cos(angle);
      y = centerY + radius * Math.sin(angle);
    }

    // Add node
    nodes.push({
      id: node.id,
      type: "mindMapNode",
      position: { x: x - 90, y: y - 25 },
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
      draggable: true,
    });

    // Add edge
    if (parentId) {
      const color = COLORS[(node.level || 0) % COLORS.length];
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "smoothstep",
        style: {
          stroke: color,
          strokeWidth: 3,
        },
        animated: false,
      });
    }

    // Process children
    if (!isCollapsed && node.children?.length) {
      const childAngle = level === 0
        ? 0
        : Math.atan2(y - centerY, x - centerX);

      node.children.forEach((child, i) => {
        buildTree(
          child,
          node.id,
          childAngle,
          level + 1,
          i,
          node.children!.length
        );
      });
    }
  };

  buildTree(root, null, 0, 0, 0, 1);
  return { nodes, edges };
};

const MindMapInner = forwardRef<MindMapHandle, MindMapProps>(
  ({ data, onExpand }, ref) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);

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

    const handleExpand = useCallback(
      async (nodeId: string, content: string) => {
        if (!onExpand) return;
        setIsExpanding(true);
        try {
          await onExpand(nodeId, content);
        } finally {
          setIsExpanding(false);
        }
      },
      [onExpand]
    );

    const handleShowDetails = useCallback((nodeData: NodeData) => {
      setSelectedNodeData(nodeData);
    }, []);

    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      if (!data?.root) return { nodes: [], edges: [] };

      const result = createMindMapLayout(data.root, collapsedNodes);

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

    useEffect(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    useImperativeHandle(
      ref,
      () => ({
        exportPNG: async () => console.log("Export PNG not implemented"),
        exportSVG: async () => console.log("Export SVG not implemented"),
        getData: () => data,
      }),
      [data]
    );

    return (
      <div className="relative w-full h-[750px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
        {(!data || !data.root) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-zinc-400 text-center">
              <p className="text-lg font-semibold">No mind map data</p>
              <p className="text-sm">Waiting for data...</p>
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
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#444" gap={16} />
            <Controls className="bg-zinc-800 border-zinc-700" />
            <MiniMap
              className="bg-zinc-900 border-zinc-700"
              nodeColor={(node) => {
                const level = (node.data as any).level || 0;
                return COLORS[level % COLORS.length];
              }}
            />

            {isExpanding && (
              <Panel position="top-center">
                <div className="px-4 py-2 bg-purple-600/90 backdrop-blur rounded-lg border border-purple-400/50 shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    Expanding with AI...
                  </span>
                </div>
              </Panel>
            )}
          </ReactFlow>
        )}

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
                  borderColor: `${COLORS[selectedNodeData.level % COLORS.length]}60`,
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
                        <li key={i} className="text-sm text-zinc-200 flex gap-2">
                          <span
                            className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                            style={{
                              backgroundColor: COLORS[selectedNodeData.level % COLORS.length],
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
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${COLORS[selectedNodeData.level % COLORS.length]}20`,
                            color: COLORS[selectedNodeData.level % COLORS.length],
                            border: `1px solid ${COLORS[selectedNodeData.level % COLORS.length]}40`,
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNodeData.extendable && !selectedNodeData.hasChildren && (
                  <button
                    onClick={async () => {
                      await handleExpand(selectedNodeData.nodeId, selectedNodeData.label);
                      setSelectedNodeData(null);
                    }}
                    disabled={isExpanding}
                    className="w-full mt-2 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${
                        COLORS[selectedNodeData.level % COLORS.length]
                      }80, ${COLORS[selectedNodeData.level % COLORS.length]}60)`,
                      color: "white",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isExpanding ? "Expanding..." : "Expand & Explore"}
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
