import { createHash, randomBytes } from 'crypto';
import type { SavedVisualization } from '@/lib/types/visualization';

/**
 * Generate a unique share ID for visualizations
 */
export function generateShareId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Generate a cache key from input string
 */
export function generateCacheKey(input: string, type?: string): string {
  const hash = createHash('md5').update(input).digest('hex').substring(0, 16);
  return type ? `viz:${type}:${hash}` : `viz:${hash}`;
}

/**
 * Validate file size
 */
export function validateFileSize(sizeInBytes: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function validateFileType(filename: string, allowedTypes: string[] = ['csv', 'json', 'txt', 'pdf']): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Calculate processing cost estimate.
 * Every generation now runs the same single AI composition call, so the
 * base cost is flat — only the variable cost scales with input length.
 */
export function calculateCost(inputLength: number): number {
  const baseCost = 0.12;
  const variableCost = Math.min(inputLength / 1000, 0.05); // Max 5 cents for very long inputs
  return Number((baseCost + variableCost).toFixed(3));
}

interface RawVisualizationDoc {
  toObject?: () => Record<string, unknown>;
  [key: string]: unknown;
}

const toIsoString = (value: unknown): string | undefined =>
  value ? new Date(value as string | number | Date).toISOString() : undefined;

/**
 * Sanitize visualization object for client-side use
 * Converts ObjectIds to strings and Dates to ISO strings to prevent serialization errors
 */
export function sanitizeVisualization(viz: unknown): SavedVisualization | null {
  if (!viz) return null;

  const raw = viz as RawVisualizationDoc;
  // If it's a Mongoose document, convert to object first
  const obj = typeof raw.toObject === 'function' ? raw.toObject() : raw;

  const metadata = obj.metadata as Record<string, unknown> | undefined;
  const history = obj.history as Array<Record<string, unknown>> | undefined;

  return {
    ...obj,
    _id: (obj._id as { toString(): string } | undefined)?.toString(),
    userId: (obj.userId as { toString(): string } | undefined)?.toString(),
    createdAt: toIsoString(obj.createdAt),
    updatedAt: toIsoString(obj.updatedAt),
    metadata: metadata ? {
      ...metadata,
      generatedAt: toIsoString(metadata.generatedAt),
    } : undefined,
    history: Array.isArray(history) ? history.map((h) => ({
      role: h.role,
      content: h.content,
      timestamp: h.timestamp ? toIsoString(h.timestamp) : new Date().toISOString(),
    })) : [],
  } as unknown as SavedVisualization;
}
