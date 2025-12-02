import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeAndSelectFormat,
  generateNetworkGraph,
  generateMindMap,
} from '@/lib/services/openai';
import type { VisualizationRequest, VisualizationResponse } from '@/lib/types/visualization';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VisualizationRequest;

    if (!body.input || body.input.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Input is required',
        } as VisualizationResponse,
        { status: 400 }
      );
    }

    // Step 1: Analyze and select format
    const analysis = await analyzeAndSelectFormat(body.input);

    if (!analysis.visualizable || analysis.format === 'none') {
      return NextResponse.json(
        {
          success: false,
          error: 'This content is not suitable for visualization. ' + analysis.reason,
          type: 'none' as any,
          data: {},
          reason: analysis.reason,
        } as VisualizationResponse,
        { status: 400 }
      );
    }

    // Step 2: Generate visualization data based on selected format
    let visualizationData;

    if (analysis.format === 'network_graph') {
      visualizationData = await generateNetworkGraph(body.input);
    } else if (analysis.format === 'mind_map') {
      visualizationData = await generateMindMap(body.input);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported visualization format',
        } as VisualizationResponse,
        { status: 400 }
      );
    }

    // Step 3: Return the visualization data
    return NextResponse.json({
      success: true,
      type: analysis.format,
      data: visualizationData,
      reason: analysis.reason,
    } as VisualizationResponse);
  } catch (error) {
    console.error('Error in visualize API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      } as VisualizationResponse,
      { status: 500 }
    );
  }
}
