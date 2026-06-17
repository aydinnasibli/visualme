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
export function validateFileType(filename: string, allowedTypes: string[] = ['csv', 'json', 'txt', 'pdf', 'xlsx']): boolean {
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

  const result: SavedVisualization = {
    _id: (obj._id as { toString(): string } | undefined)?.toString(),
    userId: (obj.userId as { toString(): string } | undefined)?.toString() ?? '',
    title: (obj.title as string) ?? '',
    spec: obj.spec as SavedVisualization['spec'],
    metadata: metadata ? {
      ...metadata,
      generatedAt: toIsoString(metadata.generatedAt),
    } as SavedVisualization['metadata'] : {} as SavedVisualization['metadata'],
    isPublic: (obj.isPublic as boolean) ?? false,
    shareId: obj.shareId as string | undefined,
    createdAt: toIsoString(obj.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(obj.updatedAt) ?? new Date().toISOString(),
    history: Array.isArray(history) ? history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content as string,
      timestamp: h.timestamp ? toIsoString(h.timestamp)! : new Date().toISOString(),
    })) : [],
    liveData: obj.liveData as SavedVisualization['liveData'],
    schedule: obj.schedule as SavedVisualization['schedule'],
    isSaved: obj.isSaved as boolean | undefined,
  };
  return result;
}
