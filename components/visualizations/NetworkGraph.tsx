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
import { useExtendedNodes } from "@/lib/context/ExtendedNodesContext";
import NodeDetailPanel from "./NodeDetailPanel";
import VisualizationContainer from "./VisualizationContainer";

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
  readOnly?: boolean;
  visualizationKey?: string;
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
  ({ data, onExpand, readOnly = false, visualizationKey = "default" }, ref) => {
    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(
      null
    );
    const [isExpanding, setIsExpanding] = useState(false);
    const { addExtendedNode, isNodeExtended } = useExtendedNodes();
    const [hoveredNode, setHoveredNode] = useState<{
      label: string;
      category: string;
      description?: string;
      x: number;
      y: number;
    } | null>(null);

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
        // Improved size: larger base + better scaling for visibility
        const size = Math.min(55, 24 + Math.sqrt(degree) * 5);

        // Seed positions to guarantee valid initial state
        const seedX = seededRandom(node.id + "x");
        const seedY = seededRandom(node.id + "y");

        const nodeColor = node.color || colorMap.get(node.category || "default") || "#6366f1";

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
            x: seedX * 1000 - 500,
            y: seedY * 800 - 400,
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

    // --- Improved Layout - Stable and well-distributed ---
    const layout = useMemo(
      () =>
        ({
          name: "fcose",
          animate: false, // First render without animation for faster initial load
          randomize: true, // Important: randomize for better distribution
          fit: true, // Fit only on initial render
        padding: 120,
          nodeRepulsion: 8500,
          idealEdgeLength: 180,
          edgeElasticity: 0.5,
          nestingFactor: 0.1,
          gravity: 0.3,
          numIter: 3500,
          tile: true,
          tilingPaddingVertical: 30,
          tilingPaddingHorizontal: 30,
          quality: "proof",
          nodeSeparation: 100,
          initialEnergyOnIncremental: 0.8, // Energy for incremental layout
        } as any),
      []
    );

    // --- Modern Stylesheet with Glow Effects ---
    const stylesheet = useMemo<StylesheetStyle[]>(
      () => [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            "background-opacity": 0.15,
            width: "data(size)",
            height: "data(size)",
            label: "data(label)",
            shape: "ellipse",

            // Smooth, rounded border with better visibility
            "border-width": 2.5,
            "border-color": "data(color)",
            "border-opacity": 0.85,

            // Improved typography for better readability
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

            // Enhanced glow for better visual appeal
            "shadow-blur": 15,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.4,

            "transition-property":
              "background-color, background-opacity, border-width, border-color, opacity, shadow-opacity, shadow-blur",
            "transition-duration": 250,
            "transition-timing-function": "ease-in-out",
          } as any,
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#3f3f46",
            "curve-style": "bezier",
            opacity: 0.4,
            // Removed arrow and label properties for cleaner look
            "transition-property": "opacity, width, line-color",
            "transition-duration": 250,
            "transition-timing-function": "ease-in-out",
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
            "background-opacity": 0.25,
            "border-width": 3,
            "border-opacity": 1,
            "text-background-color": "#000000",
            "text-background-opacity": 0.95,
            "text-background-padding": "4px",
            "text-background-shape": "roundrectangle",
            color: "#ffffff",
            "font-weight": 700,
            "font-size": 11,
            "shadow-blur": 20,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.65,
          } as any,
        },
        {
          selector: "edge.highlighted",
          style: {
            opacity: 0.8,
            width: 2.5,
            "line-color": "data(color)",
            "z-index": 9998,
            "shadow-blur": 12,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.5,
          } as any,
        },
        {
          selector: "node[extendable = true]",
          style: {
            "border-style": "dashed",
            "border-width": 2.5,
            "border-opacity": 0.7,
            "border-dash-pattern": [6, 4],
          } as any,
        },
      ],
      []
    );

    // --- Lifecycle & Handlers ---

    const hasInitialFitRef = useRef(false);
    const layoutRunCountRef = useRef(0);

    useEffect(() => {
      if (!containerRef.current) return;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            requestAnimationFrame(() => {
              if (cyRef.current) {
                cyRef.current.resize();
                // Only fit on initial load, not on every resize
                if (!hasInitialFitRef.current) {
                  cyRef.current.fit(undefined, 120);
                  // Clamp zoom level if needed
                  const currentZoom = cyRef.current.zoom();
                  if (currentZoom > 1.2) {
                    cyRef.current.zoom(1.2);
                    cyRef.current.center();
                  }
                  hasInitialFitRef.current = true;
                }
              }
            });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    // Re-run layout when data changes (e.g., after expansion)
    useEffect(() => {
      if (!cyRef.current) return;

      // Skip the first run since initial layout is handled by CytoscapeComponent
      if (layoutRunCountRef.current === 0) {
        layoutRunCountRef.current++;
        return;
      }

      // Run layout again when data changes
      const layoutConfig = {
        name: "fcose",
        animate: true,
        animationDuration: 800,
        animationEasing: "ease-out",
        randomize: true,
        fit: false, // Don't auto-fit to prevent view jumps
        padding: 80,
        nodeRepulsion: 8500,
        idealEdgeLength: 180,
        edgeElasticity: 0.5,
        nestingFactor: 0.1,
        gravity: 0.3,
        numIter: 3500,
        tile: true,
        tilingPaddingVertical: 30,
        tilingPaddingHorizontal: 30,
        quality: "proof",
        nodeSeparation: 100,
        initialEnergyOnIncremental: 0.8,
      };

      const layoutInstance = cyRef.current.layout(layoutConfig as any);
      layoutInstance.run();

      layoutRunCountRef.current++;
    }, [elements]);

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

        // Show tooltip with node info
        const renderedPosition = node.renderedPosition();
        if (containerRef.current) {
          containerRef.current.style.cursor = "pointer";
          const description = node.data("description");
          if (description) {
            setHoveredNode({
              label: node.data("label"),
              category: node.data("category"),
              description: description,
              x: renderedPosition.x,
              y: renderedPosition.y,
            });
          }
        }
      });

      cy.on("mouseout", "node", () => {
        cy.batch(() => {
          cy.elements().removeClass("dimmed highlighted");
        });
        setHoveredNode(null);
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
        // Mark node as extended for this visualization (save to database)
        await addExtendedNode(selectedNode.id, visualizationKey);
        setSelectedNode(null);
        // Don't auto-fit after expansion to prevent view jumps
        // User can manually reset view if needed
      } catch (e) {
        console.error("Extension failed", e);
      } finally {
        setIsExpanding(false);
      }
    };

    const handleReset = () => {
       cyRef.current?.animate({ fit: { padding: 80 } } as any, {
         duration: 400,
       });
    };

    return (
      <VisualizationContainer onReset={handleReset}>
        <div ref={containerRef} className="w-full h-full relative group">
           {/* The Graph */}
          <CytoscapeComponent
            elements={elements}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
            stylesheet={stylesheet}
            layout={layout}
            cy={setupListeners}
            wheelSensitivity={0.1}
            minZoom={0.1}
            maxZoom={3}
          />

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredNode && !selectedNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute pointer-events-none z-30 max-w-xs"
                style={{
                  left: `${hoveredNode.x + 20}px`,
                  top: `${hoveredNode.y - 10}px`,
                }}
              >
                <div className="bg-zinc-900/98 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm">
                  <div className="text-xs font-bold text-white mb-0.5">
                    {hoveredNode.label}
                  </div>
                  <div className="text-[10px] font-medium text-zinc-400 mb-1">
                    {hoveredNode.category}
                  </div>
                  {hoveredNode.description && (
                    <div className="text-xs text-zinc-300 leading-snug max-w-[250px]">
                      {hoveredNode.description.length > 120
                        ? hoveredNode.description.slice(0, 120) + "..."
                        : hoveredNode.description}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <NodeDetailPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onExpand={handleExpand}
            isExpanding={isExpanding}
            readOnly={readOnly}
            isExtended={selectedNode ? isNodeExtended(selectedNode.id, visualizationKey) : false}
          />
        </div>
      </VisualizationContainer>
    );
  }
);

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;
