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
 * Token-based economy system
 *
 * Economics:
 * - Pro tier: $9.99/month
 * - Target 50% profit margin = ~$5 for AI costs
 * - AI cost per generation: ~$0.05-0.15
 * - AI cost per expansion: ~$0.02-0.05
 *
 * Token allocation ensures profitability while providing value
 */

export const TOKEN_LIMITS = {
  // Monthly token allocation
  FREE_TIER_MONTHLY_TOKENS: 100,      // ~10 visualizations OR ~20 expansions
  PRO_TIER_MONTHLY_TOKENS: 2000,      // ~200 visualizations OR ~400 expansions
  ENTERPRISE_TIER_MONTHLY_TOKENS: 10000, // ~1000 visualizations OR ~2000 expansions
};

export const TOKEN_COSTS = {
  // AI operations (expensive)
  GENERATE_VISUALIZATION: 10,  // Full AI generation with GPT-4
  EDIT_VISUALIZATION: 8,       // Slightly cheaper than generation as it reuses data
  EXPAND_NODE: 5,             // AI expansion of existing nodes

  // Database operations (cheap/free)
  SAVE_VISUALIZATION: 0,      // Just database write
  DELETE_VISUALIZATION: 0,    // Just database delete
  EXPORT_VISUALIZATION: 1,    // Minor processing cost
  SHARE_VISUALIZATION: 0,     // Just database update

  // Query operations (free)
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
    return { valid: false, error: 'Must be a array' };
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
