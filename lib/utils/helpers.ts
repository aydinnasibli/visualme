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
  const hash = createHash('sha256').update(input).digest('hex').substring(0, 32);
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
export function validateFileType(filename: string, allowedTypes: string[] = ['csv', 'json', 'txt', 'xlsx', 'pdf']): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
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

export function sanitizeForPublicShare(viz: SavedVisualization): SavedVisualization {
  return {
    ...viz,
    userId: '',
    metadata: viz.metadata ? { ...viz.metadata, originalInput: '' } : viz.metadata,
    history: [],
  };
}

export function relativeTime(dateStr: string | Date): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}
