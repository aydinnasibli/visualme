import { Types } from 'mongoose';

/**
 * Validation limits for security and resource management
 */
export const VALIDATION_LIMITS = {
  MAX_INPUT_LENGTH: 10000, // ~10KB max input for AI generation
  MAX_TITLE_LENGTH: 200,
  MAX_DATA_SIZE: 1024 * 1024, // 1MB max visualization data
  MAX_EXTENDED_NODES: 100,
  MAX_SAVED_VISUALIZATIONS_FREE: 50,
  MAX_SAVED_VISUALIZATIONS_PRO: 1000,
  MAX_EXISTING_NODES_ARRAY: 1000,
  MAX_NODE_LABEL_LENGTH: 500,
};

/**
 * Token economy — gpt-4.1 family, April 2025 pricing.
 *
 * Models:
 *   Complex vizs + editing → gpt-4.1-mini  ($0.40/1M in · $1.60/1M out)
 *   Simple vizs + expand   → gpt-4.1-nano  ($0.10/1M in · $0.40/1M out)
 *
 * Real cost per call:
 *   Generate (mini):  ~700 in + 2000 out  = $0.003480
 *   Edit     (mini): ~4000 in + 3000 out  = $0.006400  ← most expensive
 *   Expand   (nano):  ~500 in + 1000 out  = $0.000450
 *
 * Unit token price anchored to the most expensive op (edit):
 *   $0.006400 ÷ 18 = $0.000356 / token
 *
 * Token costs derived strictly from that rate:
 *   Generate: $0.003480 ÷ $0.000356 = 9.78  → 10 tokens
 *   Edit:     $0.006400 ÷ $0.000356 = 17.98 → 18 tokens
 *   Expand:   $0.000450 ÷ $0.000356 = 1.26  →  2 tokens
 *
 * Pro monthly limit = $5.00 ÷ $0.000356 = 14,045 → floored to 14,000.
 *
 * PROOF no combination can exceed $5 (no gap):
 *   Worst case (all edits):    14,000÷18 = 777  × $0.00640 = $4.973 < $5 ✓
 *   All complex generates:     14,000÷10 = 1400 × $0.00348 = $4.872 < $5 ✓
 *   All expansions:            14,000÷2  = 7000 × $0.00045 = $3.150 < $5 ✓
 *   Any mix:  max = 14,000 × $0.000356  =                    $4.984 < $5 ✓
 */

export const TOKEN_LIMITS = {
  FREE_TIER_MONTHLY_TOKENS: 100,           // ~10 generates ($0.035 AI cost)
  PRO_TIER_MONTHLY_TOKENS: 14_000,         // $5.00 AI budget — no combination exceeds $5
  ENTERPRISE_TIER_MONTHLY_TOKENS: 70_000,  // $24.92 AI budget
};

export const TOKEN_COSTS = {
  // Derived from $0.000356/token (anchored to edit, the most expensive op)
  GENERATE_VISUALIZATION: 10,   // $0.003480 actual → 9.78 → 10
  EDIT_VISUALIZATION: 18,       // $0.006400 actual → 17.98 → 18
  EXPAND_NODE: 2,               // $0.000450 actual → 1.26 → 2

  // Database operations (no AI call)
  SAVE_VISUALIZATION: 0,
  DELETE_VISUALIZATION: 0,
  EXPORT_VISUALIZATION: 0,
  SHARE_VISUALIZATION: 0,

  // Query operations
  GET_VISUALIZATIONS: 0,
  GET_VISUALIZATION: 0,
};

/**
 * Token refresh schedule
 */
export const TOKEN_REFRESH = {
  INTERVAL: 'monthly' as const,
  DAY_OF_MONTH: 1, // Refresh on 1st of each month
};

/**
 * Get token cost breakdown
 */
export function getTokenCosts(): {
  generateVisualization: number;
  editVisualization: number;
  expandNode: number;
  exportVisualization: number;
  saveVisualization: number;
  deleteVisualization: number;
} {
  return {
    generateVisualization: TOKEN_COSTS.GENERATE_VISUALIZATION,
    editVisualization: TOKEN_COSTS.EDIT_VISUALIZATION,
    expandNode: TOKEN_COSTS.EXPAND_NODE,
    exportVisualization: TOKEN_COSTS.EXPORT_VISUALIZATION,
    saveVisualization: TOKEN_COSTS.SAVE_VISUALIZATION,
    deleteVisualization: TOKEN_COSTS.DELETE_VISUALIZATION,
  };
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID must be a non-empty string' };
  }
  if (!Types.ObjectId.isValid(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  return { valid: true };
}

/**
 * Validate input string length
 */
export function validateInputLength(
  input: string,
  maxLength: number = VALIDATION_LIMITS.MAX_INPUT_LENGTH
): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input must be a non-empty string' };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Input too long. Maximum ${maxLength} characters allowed.`
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate data size (for saved visualizations)
 */
export function validateDataSize(
  data: any,
  maxSize: number = VALIDATION_LIMITS.MAX_DATA_SIZE
): { valid: boolean; error?: string; size?: number } {
  if (!data) {
    return { valid: false, error: 'Data cannot be empty' };
  }

  try {
    const size = JSON.stringify(data).length;
    if (size > maxSize) {
      return {
        valid: false,
        error: `Data too large. Maximum ${Math.round(maxSize / 1024)}KB allowed.`,
        size
      };
    }
    return { valid: true, size };
  } catch (error) {
    return { valid: false, error: 'Invalid data format' };
  }
}

/**
 * Validate array size
 */
export function validateArraySize(
  arr: any[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!Array.isArray(arr)) {
    return { valid: false, error: 'Must be an array' };
  }

  if (arr.length > maxSize) {
    return {
      valid: false,
      error: `Array too large. Maximum ${maxSize} items allowed.`
    };
  }

  return { valid: true };
}

/**
 * Sanitize error messages to prevent information disclosure
 */
export function sanitizeError(error: unknown, fallbackMessage: string = 'An error occurred'): string {
  // Log full error details server-side for debugging
  console.error('Internal error:', error);

  // Never expose internal error details to client
  // Check for safe error types we can expose
  if (error instanceof Error) {
    // Only expose certain safe error messages
    const safeMessages = [
      'Authentication required',
      'Rate limit exceeded',
      'Visualization not found',
      'Invalid input',
      'Permission denied',
    ];

    if (safeMessages.some(msg => error.message.includes(msg))) {
      return error.message;
    }
  }

  return fallbackMessage;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Escape CSV values to prevent formula injection
 */
export function escapeCSV(value: string): string {
  // Prevent formula injection
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }

  // Escape quotes and wrap in quotes if contains comma
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Validate title/name fields
 */
export function validateTitle(
  title: string,
  maxLength: number = VALIDATION_LIMITS.MAX_TITLE_LENGTH
): { valid: boolean; error?: string; sanitized?: string } {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title must be a non-empty string' };
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Title too long. Maximum ${maxLength} characters allowed.`
    };
  }

  return { valid: true, sanitized: trimmed };
}
