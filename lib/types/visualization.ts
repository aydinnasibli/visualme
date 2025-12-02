export type VisualizationType = 'network_graph' | 'mind_map';

export interface NetworkNode {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface MindMapNode {
  content: string;
  children?: MindMapNode[];
}

export interface VisualizationRequest {
  input: string;
}

export interface VisualizationResponse {
  type: VisualizationType;
  data: NetworkGraphData | string; // string for markdown (mind map)
  reason: string;
  success: boolean;
  error?: string;
}
