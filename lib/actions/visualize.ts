'use server';

import {
  analyzeAndSelectFormat,
  generateNetworkGraph,
  generateMindMap,
} from '@/lib/services/openai';
import type { VisualizationResponse } from '@/lib/types/visualization';

/**
 * Server Action to generate a visualization from user input
 */
export async function generateVisualization(
  input: string
): Promise<VisualizationResponse> {
  try {
    // Validate input
    if (!input || input.trim().length === 0) {
      return {
        success: false,
        error: 'Input is required',
        type: 'none' as any,
        data: '' as any,
        reason: '',
      };
    }

    const trimmedInput = input.trim();

    // Step 1: Analyze and select format
    const analysis = await analyzeAndSelectFormat(trimmedInput);

    if (!analysis.visualizable || analysis.format === 'none') {
      return {
        success: false,
        error:
          'This content is not suitable for visualization. ' +
          analysis.reason +
          ' Try describing concepts with relationships, hierarchies, or processes.',
        type: 'none' as any,
        data: '' as any,
        reason: analysis.reason,
      };
    }

    // Step 2: Generate visualization data based on selected format
    let visualizationData;

    if (analysis.format === 'network_graph') {
      visualizationData = await generateNetworkGraph(trimmedInput);
    } else if (analysis.format === 'mind_map') {
      visualizationData = await generateMindMap(trimmedInput);
    } else {
      return {
        success: false,
        error: 'Unsupported visualization format',
        type: 'none' as any,
        data: '' as any,
        reason: '',
      };
    }

    // Step 3: Return the visualization data
    return {
      success: true,
      type: analysis.format,
      data: visualizationData,
      reason: analysis.reason,
    };
  } catch (error) {
    console.error('Error in generateVisualization:', error);

    // Check if it's an OpenAI API key error
    if (error instanceof Error && error.message.includes('OpenAI API key')) {
      return {
        success: false,
        error: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.',
        type: 'none' as any,
        data: '' as any,
        reason: '',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      type: 'none' as any,
      data: '' as any,
      reason: '',
    };
  }
}

/**
 * Server Action to regenerate visualization in a different format
 */
export async function regenerateVisualization(
  input: string,
  desiredFormat: 'network_graph' | 'mind_map'
): Promise<VisualizationResponse> {
  try {
    if (!input || input.trim().length === 0) {
      return {
        success: false,
        error: 'Input is required',
        type: 'none' as any,
        data: '' as any,
        reason: '',
      };
    }

    const trimmedInput = input.trim();
    let visualizationData;

    // Generate in the requested format
    if (desiredFormat === 'network_graph') {
      visualizationData = await generateNetworkGraph(trimmedInput);
      return {
        success: true,
        type: 'network_graph',
        data: visualizationData,
        reason: 'User requested network graph format',
      };
    } else {
      visualizationData = await generateMindMap(trimmedInput);
      return {
        success: true,
        type: 'mind_map',
        data: visualizationData,
        reason: 'User requested mind map format',
      };
    }
  } catch (error) {
    console.error('Error in regenerateVisualization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      type: 'none' as any,
      data: '' as any,
      reason: '',
    };
  }
}
