"use client";

import {
  useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect,
} from "react";
import GridLayout, { type LayoutItem as GridLayoutItem } from "react-grid-layout";
import dynamic from "next/dynamic";
import type {
  VisualizationType, VisualizationData,
  NetworkGraphData, MindMapData, TreeDiagramData,
  TimelineData, GanttChartData, AnimatedTimelineData,
  FlowchartData, SankeyDiagramData, SwimlaneDiagramData,
  LineChartData, BarChartData, ScatterPlotData,
  HeatmapData, RadarChartData, PieChartData,
  ComparisonTableData, ParallelCoordinatesData,
  WordCloudData, SyntaxDiagramData,
} from "@/lib/types/visualization";
import type { NetworkGraphHandle } from "@/components/visualizations/NetworkGraph";
import type { MindMapHandle } from "@/components/visualizations/MindMap";
import type { FlowchartHandle } from "@/components/visualizations/Flowchart";
import WidgetWrapper, { WidgetHandle } from "@/components/canvas/WidgetWrapper";
import ConnectorLayer, { CanvasConnection } from "@/components/canvas/ConnectorLayer";
import { Link2 } from "lucide-react";

/* ── Types ── */
export interface CanvasWidget {
  id: string;
  type: VisualizationType;
  data: VisualizationData;
  title: string;
  layout: { x: number; y: number; w: number; h: number };
}

export interface GridCanvasHandle {
  addWidget: (widget: Omit<CanvasWidget, "id" | "layout">) => string;
  updateWidget: (id: string, data: VisualizationData) => void;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitAll: () => void;
  clear: () => void;
  getWidgetCount: () => number;
}

interface GridCanvasProps {
  containerWidth: number;
  containerHeight: number;
  onExpand?: (widgetId: string, nodeId: string, nodeLabel: string) => Promise<void>;
  onZoomChange?: (zoom: number) => void;
}

/* ── Lazy viz imports ── */
const Loader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
  </div>
);
const dyn = (imp: () => Promise<{ default: React.ComponentType<any> }>) =>
  dynamic(imp, { ssr: false, loading: Loader });

const DynNetworkGraph      = dyn(() => import("@/components/visualizations/NetworkGraph"));
const DynMindMap           = dyn(() => import("@/components/visualizations/MindMap"));
const DynTreeDiagram       = dyn(() => import("@/components/visualizations/TreeDiagram"));
const DynTimeline          = dyn(() => import("@/components/visualizations/Timeline"));
const DynGanttChart        = dyn(() => import("@/components/visualizations/GanttChart"));
const DynAnimatedTimeline  = dyn(() => import("@/components/visualizations/AnimatedTimeline"));
const DynFlowchart         = dyn(() => import("@/components/visualizations/Flowchart"));
const DynSankeyDiagram     = dyn(() => import("@/components/visualizations/SankeyDiagram"));
const DynSwimlaneDiagram   = dyn(() => import("@/components/visualizations/SwimlaneDiagram"));
const DynLineChart         = dyn(() => import("@/components/visualizations/LineChart"));
const DynBarChart          = dyn(() => import("@/components/visualizations/BarChart"));
const DynScatterPlot       = dyn(() => import("@/components/visualizations/ScatterPlot"));
const DynHeatmap           = dyn(() => import("@/components/visualizations/Heatmap"));
const DynRadarChart        = dyn(() => import("@/components/visualizations/RadarChart"));
const DynPieChart          = dyn(() => import("@/components/visualizations/PieChart"));
const DynComparisonTable   = dyn(() => import("@/components/visualizations/ComparisonTable"));
const DynParallelCoords    = dyn(() => import("@/components/visualizations/ParallelCoordinates"));
const DynWordCloud         = dyn(() => import("@/components/visualizations/WordCloud"));
const DynSyntaxDiagram     = dyn(() => import("@/components/visualizations/SyntaxDiagram"));

/* ── Constants ── */
const COLS = 12;
const ROW_H = 36; // px per row unit — larger = taller rows
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;

/* ── Placement helper ── */
function nextLayout(existing: GridLayoutItem[]): { x: number; y: number; w: number; h: number } {
  const w = 6;
  const h = 12;
  if (!existing.length) return { x: 0, y: 0, w, h };
  const col = existing.length % 2;
  const row = Math.floor(existing.length / 2);
  return { x: col * 6, y: row * (h + 1), w, h };
}

/* ── Main component ── */
const GridCanvas = forwardRef<GridCanvasHandle, GridCanvasProps>(
  ({ containerWidth, containerHeight, onExpand, onZoomChange }, ref) => {
    const [widgets, setWidgets]         = useState<CanvasWidget[]>([]);
    const [layouts, setLayouts]         = useState<GridLayoutItem[]>([]);
    const [connections, setConnections] = useState<CanvasConnection[]>([]);
    const [connectingFrom, setConnecting] = useState<string | null>(null);
    const [zoom, setZoomState]          = useState(1);

    const viewportRef  = useRef<HTMLDivElement>(null);
    const networkRefs  = useRef<Map<string, NetworkGraphHandle>>(new Map());
    const mindMapRefs  = useRef<Map<string, MindMapHandle>>(new Map());
    const flowchartRefs = useRef<Map<string, FlowchartHandle>>(new Map());

    /* ── Wheel zoom ── */
    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      const onWheel = (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        setZoomState((z) => {
          const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z - e.deltaY * 0.001).toFixed(3)));
          onZoomChange?.(next);
          return next;
        });
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    }, [onZoomChange]);

    /* ── Handle factory ── */
    const getHandle = useCallback((w: CanvasWidget): WidgetHandle | null => {
      if (w.type === "network_graph") {
        const h = networkRefs.current.get(w.id);
        return h ? { zoomIn: () => h.zoomIn(), zoomOut: () => h.zoomOut(), fit: () => h.fit() } : null;
      }
      if (w.type === "mind_map") {
        const h = mindMapRefs.current.get(w.id);
        return h ? { zoomIn: () => h.zoomIn(), zoomOut: () => h.zoomOut(), fit: () => h.fitView() } : null;
      }
      if (w.type === "flowchart") {
        const h = flowchartRefs.current.get(w.id);
        return h ? { zoomIn: () => h.zoomIn(), zoomOut: () => h.zoomOut(), fit: () => h.fit() } : null;
      }
      return null;
    }, []);

    /* ── Imperative handle ── */
    useImperativeHandle(ref, () => ({
      addWidget: (partial) => {
        const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const lyt = nextLayout(layouts);
        setWidgets((p) => [...p, { id, ...partial, layout: lyt }]);
        setLayouts((p) => [...p, { i: id, ...lyt, minW: 2, minH: 6 }]);
        return id;
      },
      updateWidget: (id, newData) => {
        setWidgets((p) => p.map((w) => w.id === id ? { ...w, data: newData } : w));
      },
      setZoom: (z) => { const v = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)); setZoomState(v); onZoomChange?.(v); },
      zoomIn:  () => setZoomState((z) => { const v = Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)); onZoomChange?.(v); return v; }),
      zoomOut: () => setZoomState((z) => { const v = Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)); onZoomChange?.(v); return v; }),
      fitAll:  () => { setZoomState(1); onZoomChange?.(1); },
      clear: () => {
        setWidgets([]); setLayouts([]); setConnections([]);
        networkRefs.current.clear(); mindMapRefs.current.clear(); flowchartRefs.current.clear();
      },
      getWidgetCount: () => widgets.length,
    }));

    const removeWidget = useCallback((id: string) => {
      setWidgets((p) => p.filter((w) => w.id !== id));
      setLayouts((p) => p.filter((l) => l.i !== id));
      setConnections((p) => p.filter((c) => c.fromId !== id && c.toId !== id));
      networkRefs.current.delete(id);
      mindMapRefs.current.delete(id);
      flowchartRefs.current.delete(id);
      if (connectingFrom === id) setConnecting(null);
    }, [connectingFrom]);

    const handleConnect = useCallback((id: string) => {
      if (!connectingFrom) { setConnecting(id); return; }
      if (connectingFrom === id) { setConnecting(null); return; }
      const connId = `conn-${connectingFrom}-${id}`;
      if (!connections.some((c) => c.fromId === connectingFrom && c.toId === id)) {
        setConnections((p) => [...p, { id: connId, fromId: connectingFrom, toId: id }]);
      }
      setConnecting(null);
    }, [connectingFrom, connections]);

    /* ── Viz renderer ── */
    const renderViz = useCallback((w: CanvasWidget) => {
      const { id, type, data } = w;
      const exp = onExpand ? (nId: string, nLabel: string) => onExpand(id, nId, nLabel) : undefined;
      switch (type) {
        case "network_graph":    return <DynNetworkGraph ref={(h: NetworkGraphHandle | null) => { if (h) networkRefs.current.set(id, h); else networkRefs.current.delete(id); }} data={data as NetworkGraphData} onExpand={exp} visualizationKey={id} />;
        case "mind_map":         return <DynMindMap ref={(h: MindMapHandle | null) => { if (h) mindMapRefs.current.set(id, h); else mindMapRefs.current.delete(id); }} data={data as MindMapData} onExpand={exp} />;
        case "tree_diagram":     return <DynTreeDiagram data={data as TreeDiagramData} onExpand={exp} />;
        case "timeline":         return <DynTimeline data={data as TimelineData} />;
        case "gantt_chart":      return <DynGanttChart data={data as GanttChartData} />;
        case "animated_timeline":return <DynAnimatedTimeline data={data as AnimatedTimelineData} />;
        case "flowchart":        return <DynFlowchart ref={(h: FlowchartHandle | null) => { if (h) flowchartRefs.current.set(id, h); else flowchartRefs.current.delete(id); }} data={data as FlowchartData} />;
        case "sankey_diagram":   return <DynSankeyDiagram data={data as SankeyDiagramData} />;
        case "swimlane_diagram": return <DynSwimlaneDiagram data={data as SwimlaneDiagramData} />;
        case "line_chart":       return <DynLineChart data={data as LineChartData} />;
        case "bar_chart":        return <DynBarChart data={data as BarChartData} />;
        case "scatter_plot":     return <DynScatterPlot data={data as ScatterPlotData} />;
        case "heatmap":          return <DynHeatmap data={data as HeatmapData} />;
        case "radar_chart":      return <DynRadarChart data={data as RadarChartData} />;
        case "pie_chart":        return <DynPieChart data={data as PieChartData} />;
        case "comparison_table": return <DynComparisonTable data={data as ComparisonTableData} />;
        case "parallel_coordinates": return <DynParallelCoords data={data as ParallelCoordinatesData} />;
        case "word_cloud":       return <DynWordCloud data={data as WordCloudData} />;
        case "syntax_diagram":   return <DynSyntaxDiagram data={data as SyntaxDiagramData} />;
        default:                 return <div className="flex items-center justify-center h-full text-zinc-600 text-xs">Unknown type</div>;
      }
    }, [onExpand]);

    /* ── Grid dimensions ── */
    // The logical grid width stays at the container width.
    // Zoom is applied via CSS transform so grid snapping stays intact.
    const gridWidth = containerWidth;
    // When zoomed out, center the grid in the viewport
    const scaledW = gridWidth * zoom;
    const scaledH = (ROW_H * 24 * (Math.ceil(widgets.length / 2) + 2)) * zoom; // approx canvas height
    const offsetX = zoom < 1 ? Math.max(0, (containerWidth - scaledW) / 2) : 0;
    const offsetY = zoom < 1 ? 16 : 0;

    /* ── Empty state ── */
    if (!widgets.length) {
      return (
        <div ref={viewportRef} className="w-full h-full flex items-center justify-center select-none pointer-events-none">
          <div className="flex flex-col items-center gap-5 opacity-30">
            {/* Mini canvas illustration */}
            <div className="relative w-48 h-32">
              {[
                { x: 0, y: 0, w: "56%", h: "46%", color: "#8b5cf6" },
                { x: "44%", y: 0, w: "56%", h: "46%", color: "#06b6d4" },
                { x: 0, y: "54%", w: "36%", h: "46%", color: "#10b981" },
                { x: "38%", y: "54%", w: "62%", h: "46%", color: "#f59e0b" },
              ].map((card, i) => (
                <div
                  key={i}
                  className="absolute rounded-lg border"
                  style={{
                    left: card.x, top: card.y, width: card.w, height: card.h,
                    borderColor: `${card.color}40`,
                    background: `${card.color}08`,
                  }}
                >
                  <div className="h-[6px] rounded-t-lg" style={{ background: `${card.color}30` }} />
                </div>
              ))}
              {/* Connection line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 192 128">
                <path d="M 108 30 C 130 30, 120 86, 110 86" stroke="#8b5cf640" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-zinc-400 text-sm font-semibold">Your canvas is empty</p>
              <p className="text-zinc-600 text-xs mt-1">Type a prompt below — each result appears as a widget here</p>
              <p className="text-zinc-700 text-xs mt-0.5">Ctrl + scroll to zoom · drag widgets to rearrange</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={viewportRef}
        className="w-full h-full overflow-auto relative"
        style={{ cursor: connectingFrom ? "crosshair" : "default" }}
      >
        {/* Connect-mode toast */}
        {connectingFrom && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border pointer-events-auto"
            style={{
              background: "rgba(139,92,246,0.15)",
              borderColor: "rgba(139,92,246,0.45)",
              color: "#c4b5fd",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(139,92,246,0.2)",
            }}
          >
            <Link2 className="w-3 h-3" />
            Click a widget to connect &nbsp;·&nbsp;
            <button
              onClick={() => setConnecting(null)}
              className="underline opacity-60 hover:opacity-100 transition-opacity"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Canvas: scaled container */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            // Give overflow the actual visual dimensions so scrollbars appear correctly
            width: gridWidth,
            marginLeft: offsetX,
            marginTop: offsetY,
            // Tell the browser the "occupied" area after scale so it scrolls correctly
            marginBottom: Math.max(0, scaledH - containerHeight + 40),
            marginRight: Math.max(0, scaledW - containerWidth + 40),
            position: "relative",
          }}
        >
          <ConnectorLayer
            connections={connections}
            containerRef={viewportRef}
            onRemove={(id) => setConnections((p) => p.filter((c) => c.id !== id))}
          />

          <GridLayout
            layout={layouts}
            width={gridWidth}
            gridConfig={{
              cols: COLS,
              rowHeight: ROW_H,
              margin: [10, 10] as [number, number],
              containerPadding: [10, 10] as [number, number],
            }}
            dragConfig={{ enabled: true, bounded: false, handle: ".drag-handle", threshold: 2 }}
            resizeConfig={{ enabled: true, handles: ["se", "sw", "ne", "nw"] as ("se"|"sw"|"ne"|"nw")[] }}
            onLayoutChange={(nl) => setLayouts([...nl])}
            autoSize
          >
            {widgets.map((w) => (
              <div
                key={w.id}
                data-widget-id={w.id}
                style={{ height: "100%" }}
              >
                <WidgetWrapper
                  id={w.id}
                  title={w.title}
                  type={w.type}
                  onClose={() => removeWidget(w.id)}
                  onConnect={handleConnect}
                  isConnecting={connectingFrom !== null}
                  isConnectionSource={connectingFrom === w.id}
                  widgetHandle={getHandle(w)}
                >
                  {renderViz(w)}
                </WidgetWrapper>
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    );
  }
);

GridCanvas.displayName = "GridCanvas";
export default GridCanvas;
