"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape, {
  Core,
  EventObject,
  NodeSingular,
  StylesheetStyle,
} from "cytoscape";
import fcose from "cytoscape-fcose";
import { motion, AnimatePresence } from "framer-motion";
import type { NetworkGraphData, NetworkNode } from "@/lib/types/visualization";

/* -------------------------------------------------------------------------- */
/* 1. SETUP                                                                   */
/* -------------------------------------------------------------------------- */

// Register layout safely
if (
  !(cytoscape as any).prototype.hasLayout ||
  !(cytoscape as any).prototype.hasLayout("fcose")
) {
  cytoscape.use(fcose);
}

// Vibrant Modern Color Palette - Neon/Glow aesthetic
const CATEGORY_COLORS = [
  "#8b5cf6", // Vivid Purple
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f97316", // Orange
];

// Consistent random seed for stable layouts
const seededRandom = (seed: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
};

/* -------------------------------------------------------------------------- */
/* 2. TYPES                                                                   */
/* -------------------------------------------------------------------------- */

interface NetworkGraphProps {
  data: NetworkGraphData;
  onExpand?: (nodeId: string, nodeLabel: string) => Promise<void>;
}

export interface NetworkGraphHandle {
  exportPNG: (scale?: number) => Promise<void>;
  getContainer: () => HTMLDivElement | null;
  fit: () => void;
}

interface SelectedNodeInfo {
  id: string;
  label: string;
  category: string;
  description?: string;
  color: string;
  degree: number;
  extendable?: boolean;
  keyPoints?: string[];
  relatedConcepts?: string[];
}

/* -------------------------------------------------------------------------- */
/* 3. COMPONENT                                                               */
/* -------------------------------------------------------------------------- */

const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(
  ({ data, onExpand }, ref) => {
    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(
      null
    );
    const [isReady, setIsReady] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);

    // Store original nodes for metadata lookup
    const nodeDataMap = useMemo(() => {
      const map = new Map<string, NetworkNode>();
      if (data?.nodes) {
        data.nodes.forEach((node) => {
          map.set(node.id, node);
        });
      }
      return map;
    }, [data]);

    // --- Data Processing (Memoized) ---
    const { elements } = useMemo(() => {
      // Guard clause to prevent crash if data is missing or malformed
      if (!data || !data.nodes || !data.edges) {
        return { elements: [] };
      }

      // 1. Calculate Degree
      const degrees: Record<string, number> = {};
      data.edges.forEach((edge) => {
        degrees[edge.source] = (degrees[edge.source] || 0) + 1;
        degrees[edge.target] = (degrees[edge.target] || 0) + 1;
      });

      // 2. Map Colors
      const uniqueCategories = Array.from(
        new Set(data.nodes.map((n) => n.category || "default"))
      );
      const colorMap = new Map<string, string>();
      uniqueCategories.forEach((cat, i) => {
        colorMap.set(cat, CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
      });

      // 3. Create Nodes with Initial Positions
      const nodes = data.nodes.map((node) => {
        const degree = degrees[node.id] || 0;
        // Size: 20px base + degree factor (balanced sizing)
        const size = Math.min(50, 20 + Math.sqrt(degree) * 6);

        // Seed positions to guarantee valid initial state
        const seedX = seededRandom(node.id + "x");
        const seedY = seededRandom(node.id + "y");

        const nodeColor = colorMap.get(node.category || "default") || "#6366f1";

        return {
          data: {
            id: node.id,
            label: node.label,
            category: node.category || "General",
            color: nodeColor,
            description: node.description,
            size: size,
            degree: degree,
            extendable: node.extendable || false,
          },
          position: {
            x: seedX * 800 - 400,
            y: seedY * 600 - 300,
          },
        };
      });

      const edges = data.edges.map((edge, i) => ({
        data: {
          id: edge.id || `e-${i}`,
          source: edge.source,
          target: edge.target,
          label: edge.label || "",
        },
      }));

      return {
        elements: CytoscapeComponent.normalizeElements({ nodes, edges }),
      };
    }, [data]);

    // --- High-Performance Layout ---
    const layout = useMemo(
      () =>
        ({
          name: "fcose",
          animate: false,
          randomize: false,
          fit: true,
          padding: 80,
          nodeRepulsion: 9000,
          idealEdgeLength: 140,
          edgeElasticity: 0.45,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 2500,
          tile: true,
          tilingPaddingVertical: 25,
          tilingPaddingHorizontal: 25,
        } as any),
      []
    );

    // --- Modern Stylesheet with Glow Effects ---
    const stylesheet = useMemo<StylesheetStyle[]>(
      () => [
        {
          selector: "node",
          style: {
            "background-color": "#0a0a0f",
            width: "data(size)",
            height: "data(size)",
            label: "data(label)",

            // Glowing border
            "border-width": 3,
            "border-color": "data(color)",
            "border-opacity": 1,

            // Typography
            color: "#e4e4e7",
            "font-family": "Inter, ui-sans-serif, system-ui",
            "font-size": 10,
            "font-weight": 600,
            "text-valign": "bottom",
            "text-margin-y": 8,
            "text-wrap": "wrap",
            "text-max-width": "90px",
            "line-height": 1.3,
            "min-zoomed-font-size": 6,

            // Subtle glow
            "shadow-blur": 15,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.5,

            "transition-property":
              "background-color, border-width, border-color, opacity, shadow-opacity",
            "transition-duration": 200,
          } as any,
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#27272a",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#3f3f46",
            "arrow-scale": 0.8,
            opacity: 0.4,
            label: "data(label)",
            "font-size": 9,
            color: "#71717a",
            "text-background-color": "#09090b",
            "text-background-opacity": 0.8,
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
          } as any,
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.15,
            "text-opacity": 0,
            "border-color": "#18181b",
            "shadow-opacity": 0,
          } as any,
        },
        {
          selector: ".highlighted",
          style: {
            opacity: 1,
            "z-index": 9999,
            "background-color": "data(color)",
            "background-opacity": 0.15,
            "border-width": 4,
            "text-background-color": "#000000",
            "text-background-opacity": 0.9,
            "text-background-padding": "4px",
            "text-background-shape": "roundrectangle",
            color: "#ffffff",
            "font-weight": 700,
            "shadow-blur": 25,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.8,
          } as any,
        },
        {
          selector: "edge.highlighted",
          style: {
            opacity: 1,
            width: 3,
            "line-color": "data(color)",
            "target-arrow-color": "data(color)",
            "z-index": 9998,
            "shadow-blur": 10,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.6,
          } as any,
        },
        {
          selector: "node[extendable = true]",
          style: {
            "border-style": "double",
            "border-width": 4,
          } as any,
        },
      ],
      []
    );

    // --- Lifecycle & Handlers ---

    useEffect(() => {
      if (!containerRef.current) return;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            setIsReady(true);
            requestAnimationFrame(() => {
              if (cyRef.current) {
                cyRef.current.resize();
                if (!selectedNode) cyRef.current.fit();
              }
            });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, [selectedNode]);

    const setupListeners = (cy: Core) => {
      cyRef.current = cy;

      cy.on("mouseover", "node", (e: EventObject) => {
        const node = e.target as NodeSingular;
        const neighbors = node.neighborhood();

        cy.batch(() => {
          cy.elements().addClass("dimmed").removeClass("highlighted");
          node.removeClass("dimmed").addClass("highlighted");
          neighbors.removeClass("dimmed").addClass("highlighted");
          neighbors.edges().addClass("highlighted");
        });

        if (containerRef.current) containerRef.current.style.cursor = "pointer";
      });

      cy.on("mouseout", "node", () => {
        cy.batch(() => {
          cy.elements().removeClass("dimmed highlighted");
        });
        if (containerRef.current) containerRef.current.style.cursor = "default";
      });

      cy.on("tap", "node", (e: EventObject) => {
        const node = e.target as NodeSingular;
        const nodeId = node.id();
        const originalNode = nodeDataMap.get(nodeId);

        setSelectedNode({
          id: nodeId,
          label: node.data("label"),
          category: node.data("category"),
          description: node.data("description"),
          color: node.data("color"),
          degree: node.data("degree"),
          extendable: node.data("extendable"),
          keyPoints: originalNode?.metadata?.keyPoints,
          relatedConcepts: originalNode?.metadata?.relatedConcepts,
        });
      });

      cy.on("tap", (e: EventObject) => {
        if (e.target === cy) {
          setSelectedNode(null);
          cy.elements().removeClass("dimmed highlighted");
        }
      });
    };

    useImperativeHandle(ref, () => ({
      exportPNG: async (scale = 2) => {
        if (!cyRef.current) return;
        const pngBlob = cyRef.current.png({
          output: "blob",
          bg: "#0a0a0f",
          scale,
          full: true,
        });
        const url = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.download = `graph-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      },
      getContainer: () => containerRef.current,
      fit: () => cyRef.current?.fit(),
    }));

    const handleExpand = async () => {
      if (!selectedNode || !onExpand || !selectedNode.extendable) return;
      setIsExpanding(true);
      try {
        await onExpand(selectedNode.id, selectedNode.label);
        setSelectedNode(null);
        setTimeout(
          () => cyRef.current?.animate({ fit: { padding: 80 } } as any),
          800
        );
      } catch (e) {
        console.error("Expansion failed", e);
      } finally {
        setIsExpanding(false);
      }
    };

    return (
      <div
        ref={containerRef}
        className="relative w-full h-[800px] bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 rounded-3xl border border-zinc-800/50 shadow-2xl overflow-hidden group"
      >
        {/* Ambient glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() =>
              cyRef.current?.animate({ fit: { padding: 80 } } as any, {
                duration: 400,
              })
            }
            className="px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/50 backdrop-blur-md transition-all text-sm font-semibold shadow-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Reset View
          </button>
        </div>

        {/* The Graph */}
        {isReady && (
          <CytoscapeComponent
            elements={elements}
            style={{ width: "100%", height: "100%" }}
            stylesheet={stylesheet}
            layout={layout}
            cy={setupListeners}
            wheelSensitivity={0.1}
            minZoom={0.1}
            maxZoom={3}
          />
        )}

        {/* Loading State */}
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin animation-delay-150" style={{ animationDirection: "reverse" }} />
            </div>
            <span className="mt-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Initializing Graph...
            </span>
          </div>
        )}

        {/* Top-Left Node Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto z-40"
                onClick={() => setSelectedNode(null)}
              />

              {/* Panel */}
              <motion.div
                initial={{ opacity: 0, x: -50, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -50, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-6 left-6 w-[360px] max-w-[calc(100%-3rem)] max-h-[calc(100%-3rem)] bg-zinc-900/95 border border-zinc-700/50 rounded-2xl shadow-2xl pointer-events-auto z-50 overflow-hidden backdrop-blur-xl"
              >
                {/* Header with gradient accent */}
                <div
                  className="h-2 w-full relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${selectedNode.color}, ${selectedNode.color}88)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
                  {/* Title & Close */}
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-white leading-tight pr-4 flex items-center gap-2">
                      {selectedNode.label}
                      {selectedNode.extendable && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                          style={{
                            borderColor: selectedNode.color,
                            color: selectedNode.color,
                            backgroundColor: `${selectedNode.color}15`,
                          }}
                        >
                          Extendable
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                      style={{
                        borderColor: `${selectedNode.color}60`,
                        backgroundColor: `${selectedNode.color}20`,
                        color: selectedNode.color,
                      }}
                    >
                      {selectedNode.category}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {selectedNode.degree} {selectedNode.degree === 1 ? "Connection" : "Connections"}
                    </span>
                  </div>

                  {/* Description */}
                  {selectedNode.description && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Overview
                      </h3>
                      <p className="text-zinc-300 leading-relaxed text-sm">
                        {selectedNode.description}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {selectedNode.keyPoints && selectedNode.keyPoints.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Key Insights
                      </h3>
                      <ul className="space-y-2">
                        {selectedNode.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: selectedNode.color }}
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Concepts */}
                  {selectedNode.relatedConcepts && selectedNode.relatedConcepts.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Related Concepts
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.relatedConcepts.map((concept, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800 transition-all cursor-default"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extend Button */}
                  {selectedNode.extendable && onExpand && (
                    <button
                      onClick={handleExpand}
                      disabled={isExpanding}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg relative overflow-hidden group"
                      style={{
                        backgroundColor: `${selectedNode.color}20`,
                        borderWidth: "2px",
                        borderColor: selectedNode.color,
                        color: selectedNode.color,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${selectedNode.color}30, transparent)`,
                          animation: "shimmer 2s infinite",
                        }}
                      />
                      {isExpanding ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Expanding...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          <span>Expand & Explore Deeper</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Custom Styles for shimmer animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(39, 39, 42, 0.5);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(113, 113, 122, 0.8);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(161, 161, 170, 0.9);
          }
        `}</style>
      </div>
    );
  }
);

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;
