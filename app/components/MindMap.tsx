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
  Controls,
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
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await data.onExpand(data.nodeId, data.label);
              }}
              className="p-1 rounded-full hover:bg-yellow-400/30"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </button>
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

// Simple radial layout - root centered, children in circle
const createMindMapLayout = (
  root: MindMapNodeType | undefined
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!root?.id) return { nodes, edges };

  const centerX = 0;
  const centerY = 0;
  const levelRadius = 280;

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
      x = centerX;
      y = centerY;
    } else if (level === 1) {
      currentAngle = (siblingIndex / totalSiblings) * 2 * Math.PI;
      x = centerX + levelRadius * Math.cos(currentAngle);
      y = centerY + levelRadius * Math.sin(currentAngle);
    } else {
      const baseAngle = parentAngle;
      const arcSpan = Math.PI / 2;
      const angleStep = totalSiblings > 1 ? arcSpan / (totalSiblings - 1) : 0;
      currentAngle = baseAngle - arcSpan / 2 + siblingIndex * angleStep;
      const radius = level * levelRadius;
      x = centerX + radius * Math.cos(currentAngle);
      y = centerY + radius * Math.sin(currentAngle);
    }

    nodes.push({
      id: node.id,
      type: "mindMapNode",
      position: { x: x - 100, y: y - 30 },
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
        type: "straight",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: color,
        },
        style: {
          stroke: color,
          strokeWidth: 8,
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
      <div className="relative w-full h-[750px]  rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden floating-edges">
        <style>{`
          .floating-edges .react-flow__handle {
            opacity: 0;
          }
          .react-flow__edge-path {
            stroke-width: 8px !important;
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
              style: { strokeWidth: 8 },
            }}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background />
            <Controls />
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
