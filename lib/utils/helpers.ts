import { createHash } from 'crypto';

/**
 * Generate a unique share ID for visualizations
 */
export function generateShareId(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .substring(0, 12);
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
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate processing cost estimate
 */
export function calculateCost(inputLength: number, formatCost: number): number {
  // Base cost + variable cost based on input length
  const baseCost = formatCost;
  const variableCost = Math.min(inputLength / 1000, 0.05); // Max 5 cents for very long inputs
  return Number((baseCost + variableCost).toFixed(3));
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Check if string is valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSVToJSON(csv: string): Array<Record<string, any>> {
  const lines = csv.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const result: Array<Record<string, any>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj: Record<string, any> = {};

    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    result.push(obj);
  }

  return result;
}
