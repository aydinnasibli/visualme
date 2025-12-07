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
import type { NetworkGraphData } from "@/lib/types/visualization";

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

// "Obsidian Dark" Palette - Subtle, professional indicators
const CATEGORY_COLORS = [
  "#a78bfa", // Muted Purple
  "#34d399", // Muted Emerald
  "#60a5fa", // Muted Blue
  "#fbbf24", // Muted Amber
  "#f472b6", // Muted Pink
  "#94a3b8", // Slate
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
  onExpand?: (nodeLabel: string) => Promise<void>;
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

    // --- Data Processing (Memoized) ---
    const { elements } = useMemo(() => {
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
        // Size: 20px base + degree factor
        const size = Math.min(60, 20 + Math.sqrt(degree) * 8);

        // Seed positions to guarantee valid initial state
        const seedX = seededRandom(node.id + "x");
        const seedY = seededRandom(node.id + "y");

        return {
          data: {
            id: node.id,
            label: node.label,
            category: node.category || "General",
            color: colorMap.get(node.category || "default") || "#94a3b8",
            description: node.description,
            size: size,
            degree: degree,
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
          // PERFORMANCE: Disable animation during layout calculation.
          // This calculates the final positions instantly, preventing the "1fps" crawl.
          animate: false,
          randomize: false, // Use our seeded positions as starting points
          fit: true,
          padding: 60,

          // Physics for "Breathing Room"
          nodeRepulsion: 8000,
          idealEdgeLength: 120,
          edgeElasticity: 0.45,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 2500,
          tile: true,
          tilingPaddingVertical: 20,
          tilingPaddingHorizontal: 20,
        } as any),
      []
    );

    // --- Modern, Dark Stylesheet ---
    const stylesheet = useMemo<StylesheetStyle[]>(
      () => [
        {
          selector: "node",
          style: {
            // Dark Center
            "background-color": "#18181b", // zinc-950
            width: "data(size)",
            height: "data(size)",
            label: "data(label)",

            // Subtle Colored Border (The Category Indicator)
            "border-width": 2,
            "border-color": "data(color)",
            "border-opacity": 0.8,

            // Typography
            color: "#d4d4d8", // zinc-300
            "font-family": "Inter, ui-sans-serif, system-ui",
            "font-size": 11,
            "font-weight": 500,
            "text-valign": "bottom",
            "text-margin-y": 8,
            "text-wrap": "wrap",
            "text-max-width": "100px",
            "line-height": 1.3,

            // Optimization
            "min-zoomed-font-size": 6,

            // Fast Transitions (color only, not position)
            "transition-property":
              "background-color, border-width, border-color, opacity",
            "transition-duration": 150, // Snappy 150ms
          } as any,
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#3f3f46", // zinc-700
            "curve-style": "haystack", // Fastest rendering type
            opacity: 0.3, // Subtle connections
          } as any,
        },
        // --- INTERACTION STATES ---
        {
          selector: ".dimmed",
          style: {
            opacity: 0.1, // Fade out aggressively
            "text-opacity": 0,
            "border-color": "#27272a", // Dark border for dimmed nodes
          } as any,
        },
        {
          selector: ".highlighted",
          style: {
            opacity: 1,
            "z-index": 9999,
            "background-color": "data(color)", // Fill node with color on hover
            "text-background-color": "#09090b",
            "text-background-opacity": 0.8,
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
            color: "#ffffff",
            "font-weight": 600,
            // "Glow" via shadow
            "shadow-blur": 20,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.4,
          } as any,
        },
        {
          selector: "edge.highlighted",
          style: {
            opacity: 0.9,
            width: 2,
            "line-color": "#e4e4e7", // zinc-200
            "z-index": 9998,
          } as any,
        },
      ],
      []
    );

    // --- Lifecycle & Handlers ---

    // 1. Container Resize Monitor
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
    }, [selectedNode]); // Only refit if no node is selected

    // 2. Interaction Logic
    const setupListeners = (cy: Core) => {
      cyRef.current = cy;

      // Snappy Hover
      cy.on("mouseover", "node", (e: EventObject) => {
        const node = e.target as NodeSingular;
        const neighbors = node.neighborhood();

        // Instant batch update (No animation lag)
        cy.batch(() => {
          cy.elements().addClass("dimmed").removeClass("highlighted");
          node.removeClass("dimmed").addClass("highlighted");
          neighbors.removeClass("dimmed").addClass("highlighted");
          neighbors.edges().addClass("highlighted");
        });

        containerRef.current!.style.cursor = "pointer";
      });

      cy.on("mouseout", "node", () => {
        cy.batch(() => {
          cy.elements().removeClass("dimmed highlighted");
        });
        containerRef.current!.style.cursor = "default";
      });

      // Click: Open Modal + Center Camera
      cy.on("tap", "node", (e: EventObject) => {
        const node = e.target as NodeSingular;
        setSelectedNode({
          id: node.id(),
          label: node.data("label"),
          category: node.data("category"),
          description: node.data("description"),
          color: node.data("color"),
          degree: node.data("degree"),
        });

        // Smooth Camera Pan (Not Zoom In/Out Madness)
        cy.animate(
          {
            center: { els: node },
            zoom: 1.2, // Gentle zoom
          } as any,
          { duration: 400, easing: "ease-out-cubic" }
        );
      });

      cy.on("tap", (e: EventObject) => {
        if (e.target === cy) {
          setSelectedNode(null);
          // Reset highlights
          cy.elements().removeClass("dimmed highlighted");
        }
      });
    };

    // 3. Exports
    useImperativeHandle(ref, () => ({
      exportPNG: async (scale = 2) => {
        if (!cyRef.current) return;
        const pngBlob = cyRef.current.png({
          output: "blob",
          bg: "#09090b",
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

    // 4. Expand Action
    const handleExpand = async () => {
      if (!selectedNode || !onExpand) return;
      setIsExpanding(true);
      try {
        await onExpand(selectedNode.label);
        setSelectedNode(null); // Close modal to show results
        // Give graph time to update then fit
        setTimeout(
          () => cyRef.current?.animate({ fit: { padding: 50 } } as any),
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
        className="relative w-full h-[750px] bg-zinc-950 rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden group"
      >
        {/* Reset Button (Top Right) */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() =>
              cyRef.current?.animate({ fit: { padding: 50 } } as any, {
                duration: 400,
              })
            }
            className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 backdrop-blur-sm transition-all text-xs font-medium shadow-lg"
          >
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
            wheelSensitivity={0.1} // Slower scroll for control
            minZoom={0.1}
            maxZoom={3}
          />
        )}

        {/* Loading Spinner */}
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-2" />
            <span className="text-xs font-medium uppercase tracking-widest opacity-70">
              Initializing
            </span>
          </div>
        )}

        {/* Detail Modal (Center Screen) */}
        <AnimatePresence>
          {selectedNode && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              {/* Backdrop (Click to close) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                onClick={() => setSelectedNode(null)}
              />

              {/* Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-[420px] max-w-[90%] bg-zinc-900/95 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col ring-1 ring-white/10"
              >
                {/* Header Color Strip */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: selectedNode.color }}
                />

                <div className="p-6">
                  {/* Title Row */}
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white leading-tight pr-4">
                      {selectedNode.label}
                    </h2>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {selectedNode.category}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {selectedNode.degree} Connections
                    </span>
                  </div>

                  {/* Description */}
                  <div className="prose prose-invert prose-sm max-h-[200px] overflow-y-auto custom-scrollbar mb-6">
                    <p className="text-zinc-300 leading-relaxed text-sm">
                      {selectedNode.description ||
                        "No detailed description available."}
                    </p>
                  </div>

                  {/* AI Expansion Button */}
                  {onExpand && (
                    <button
                      onClick={handleExpand}
                      disabled={isExpanding}
                      className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 border border-zinc-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium group"
                    >
                      {isExpanding ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-zinc-400"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Expanding Graph...
                        </>
                      ) : (
                        <>
                          <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                            ✨
                          </span>
                          AI Expand Concept
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;
