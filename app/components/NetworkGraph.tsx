"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape, { Core, NodeSingular } from "cytoscape";
import fcose from "cytoscape-fcose";
import { motion, AnimatePresence } from "framer-motion";
import type { NetworkGraphData } from "@/lib/types/visualization";

// Correct registration for production environments
// Since this component is imported via next/dynamic with ssr: false,
// this execution is guaranteed to be client-side.
cytoscape.use(fcose);

interface NetworkGraphProps {
  data: NetworkGraphData;
}

export interface NetworkGraphHandle {
  exportPNG: (scale?: number) => Promise<void>;
  getContainer: () => HTMLDivElement | null;
}

const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(
  ({ data }, ref) => {
    const cyRef = useRef<Core | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // Obsidian Constellation Palette
    const getCategoryColor = (category?: string) => {
      const colors: Record<string, string> = {
        default: "#9ca3af",
        primary: "#c084fc",
        secondary: "#2dd4bf",
        tertiary: "#fbbf24",
        quaternary: "#f472b6",
        highlight: "#ffffff",
      };
      return colors[category || "default"] || colors.default;
    };

    const elements = useMemo(() => {
      const nodes = data.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          category: node.category,
          color: getCategoryColor(node.category),
          description: node.description,
          size: (node.size || 1) * 6 + 10,
        },
      }));

      const edges = data.edges.map((edge, i) => ({
        data: {
          id: edge.id || `e-${i}`,
          source: edge.source,
          target: edge.target,
        },
      }));

      return CytoscapeComponent.normalizeElements({ nodes, edges });
    }, [data]);

    useImperativeHandle(ref, () => ({
      exportPNG: async (scale = 2) => {
        if (!cyRef.current) return;
        const pngBlob = cyRef.current.png({
          output: "blob",
          bg: "#09090b",
          scale: scale,
          full: true,
        });
        const url = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.download = `viz-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      },
      getContainer: () => containerRef.current,
    }));

    const stylesheet = useMemo(
      () => [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            width: "data(size)",
            height: "data(size)",
            label: "data(label)",
            color: "#d4d4d8",
            "font-size": 13,
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-outline-color": "#09090b",
            "text-outline-width": 2,
            "transition-property": "background-color, width, height, opacity",
            "transition-duration": 300,
          } as any,
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#3f3f46",
            "curve-style": "haystack",
            opacity: 0.3,
          } as any,
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.1,
            label: "",
          } as any,
        },
        {
          selector: ".highlighted",
          style: {
            opacity: 1,
            "background-color": "#ffffff",
            "z-index": 9999,
          } as any,
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#a78bfa",
            width: 2,
            opacity: 0.8,
          } as any,
        },
      ],
      []
    );

    const layout = {
      name: "fcose",
      animate: true,
      animationDuration: 800,
      fit: true,
      nodeRepulsion: 12000,
      idealEdgeLength: 120,
      gravity: 0.15,
    };

    const setupListeners = (cy: Core) => {
      cyRef.current = cy;

      cy.on("mouseover", "node", (e) => {
        const node = e.target;
        const neighbors = node.neighborhood().add(node);
        setHoveredNodeId(node.id());
        cy.batch(() => {
          cy.elements().addClass("dimmed");
          neighbors.removeClass("dimmed").addClass("highlighted");
        });
      });

      cy.on("mouseout", "node", () => {
        setHoveredNodeId(null);
        cy.batch(() => {
          cy.elements().removeClass("dimmed highlighted");
        });
      });

      cy.on("tap", "node", (e) => {
        const node = e.target;
        setSelectedNode({
          id: node.id(),
          label: node.data("label"),
          category: node.data("category"),
          description: node.data("description"),
          color: node.data("color"),
          connections: node.degree(false),
        });
        cy.animate({ center: { els: node }, zoom: 2, duration: 500 });
      });

      cy.on("tap", (e) => {
        if (e.target === cy) setSelectedNode(null);
      });
    };

    return (
      <div
        ref={containerRef}
        className="w-full h-[800px] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 relative"
      >
        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "100%" }}
          stylesheet={stylesheet}
          layout={layout}
          cy={setupListeners}
          wheelSensitivity={0.3}
        />

        <AnimatePresence>
          {selectedNode && (
            <div className="absolute top-6 right-6 z-20 w-80">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-5 rounded-xl shadow-2xl"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-zinc-100">
                    {selectedNode.label}
                  </h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-zinc-300 mb-3">
                  {selectedNode.description || "No description available."}
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">
                  ID: {selectedNode.id} | Links: {selectedNode.connections}
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
