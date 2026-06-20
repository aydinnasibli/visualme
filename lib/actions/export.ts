'use server';

import * as Sentry from '@sentry/nextjs';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { VisualizationModel } from '@/lib/database/models';
import {
  generateShareLink,
  exportAsJSON,
  exportAsCSV,
  exportAsHTML,
} from '@/lib/services/export-service';
import { validateObjectId, sanitizeError } from '@/lib/utils/validation';
import { sanitizeVisualization, sanitizeForPublicShare } from '@/lib/utils/helpers';
import { checkRateLimit } from '@/lib/utils/rate-limit';
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

    const rl = await checkRateLimit(userId, 'export');
    if (!rl.allowed) {
      return { success: false, error: `Too many requests. Try again in ${rl.retryAfter ?? 60}s.` };
    }

    // SECURITY: Validate ObjectId format
    const idValidation = validateObjectId(visualizationId);
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error };
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
    console.error(error);
    Sentry.captureException(error);
    return {
      success: false,
      error: sanitizeError(error, 'Failed to export visualization'),
    };
  }
}

/**
 * Create a shareable link for a visualization
 */
export async function createShareLink(
  visualizationId: string,
  options: {
    isPublic: boolean;
  }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const rl = await checkRateLimit(userId, 'share');
    if (!rl.allowed) {
      return { success: false, error: `Too many requests. Try again in ${rl.retryAfter ?? 60}s.` };
    }

    // SECURITY: Validate ObjectId format
    const idValidation = validateObjectId(visualizationId);
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error };
    }

    await connectToDatabase();

    const visualization = await VisualizationModel.findOne({
      _id: visualizationId,
      userId,
    });

    if (!visualization) {
      return { success: false, error: 'Visualization not found' };
    }

    // Generate share link — retry on the rare duplicate-key collision.
    visualization.isPublic = options.isPublic;
    let shareId = '';
    let shareUrl = '';
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      ({ shareId, shareUrl } = await generateShareLink());
      visualization.shareId = shareId;
      try {
        await visualization.save();
        lastErr = undefined;
        break;
      } catch (err: unknown) {
        const e = err as { name?: string; code?: number };
        if (e?.name !== 'MongoServerError' || e?.code !== 11000) throw err;
        lastErr = err;
      }
    }
    if (lastErr) throw lastErr;

    return {
      success: true,
      data: {
        shareId,
        shareUrl,
      },
    };
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return {
      success: false,
      error: sanitizeError(error, 'Failed to create share link'),
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

    const sanitized = sanitizeVisualization(visualization);
    const data = sanitized ? sanitizeForPublicShare(sanitized) : null;

    return { success: true, data: data as SavedVisualization };
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return {
      success: false,
      error: sanitizeError(error, 'Failed to fetch shared visualization'),
    };
  }
}
