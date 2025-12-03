'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { VisualizationModel } from '@/lib/database/models';
import {
  generateShareLink,
  exportAsJSON,
  exportAsCSV,
  exportAsHTML,
} from '@/lib/services/export-service';
import type { ExportFormat, SavedVisualization } from '@/lib/types/visualization';

/**
 * Export a visualization in the specified format
 */
export async function exportVisualization(
  visualizationId: string,
  format: ExportFormat,
  options?: {
    includeMetadata?: boolean;
    title?: string;
  }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    await connectToDatabase();

    const vizDoc = await VisualizationModel.findOne({
      _id: visualizationId,
      userId,
    }).lean();

    if (!vizDoc) {
      return { success: false, error: 'Visualization not found' };
    }

    // Convert MongoDB document to SavedVisualization type
    const visualization: SavedVisualization = {
      ...vizDoc,
      _id: vizDoc._id.toString(),
      createdAt: vizDoc.createdAt,
      updatedAt: vizDoc.updatedAt,
    };

    let content: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = exportAsJSON(visualization, options);
        mimeType = 'application/json';
        break;

      case 'csv':
        content = exportAsCSV(visualization);
        mimeType = 'text/csv';
        break;

      case 'html':
        content = exportAsHTML(visualization);
        mimeType = 'text/html';
        break;

      default:
        return { success: false, error: `Export format ${format} not supported via server action` };
    }

    return {
      success: true,
      data: {
        content,
        mimeType,
        filename: `visualization-${visualizationId}.${format}`,
      },
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export visualization',
    };
  }
}

/**
 * Create a shareable link for a visualization
 */
export async function createShareLink(
  visualizationId: string,
  options: {
    expiresIn?: number;
    password?: string;
    isPublic: boolean;
  }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    await connectToDatabase();

    const visualization = await VisualizationModel.findOne({
      _id: visualizationId,
      userId,
    });

    if (!visualization) {
      return { success: false, error: 'Visualization not found' };
    }

    // Generate share link
    const { shareId, shareUrl } = await generateShareLink(visualizationId, userId, options);

    // Update visualization with share ID
    visualization.shareId = shareId;
    visualization.isPublic = options.isPublic;
    await visualization.save();

    return {
      success: true,
      data: {
        shareId,
        shareUrl,
      },
    };
  } catch (error) {
    console.error('Share link error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create share link',
    };
  }
}

/**
 * Get a shared visualization (public access)
 */
export async function getSharedVisualization(shareId: string) {
  try {
    await connectToDatabase();

    const visualization = await VisualizationModel.findOne({
      shareId,
      isPublic: true,
    }).lean();

    if (!visualization) {
      return { success: false, error: 'Shared visualization not found or is private' };
    }

    return {
      success: true,
      data: {
        ...visualization,
        _id: visualization._id.toString(),
      },
    };
  } catch (error) {
    console.error('Get shared visualization error:', error);
    return {
      success: false,
      error: 'Failed to fetch shared visualization',
    };
  }
}
