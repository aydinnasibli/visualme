import { Types } from 'mongoose';

/**
 * Validation limits for security and resource management
 */
export const VALIDATION_LIMITS = {
  MAX_INPUT_LENGTH: 10000,          // ~10KB max input for AI generation
  MAX_TITLE_LENGTH: 200,
  MAX_DATA_SIZE: 1024 * 1024,       // 1MB max for DB storage
  MAX_EDIT_DATA_SIZE: 100 * 1024,   // 100KB max data sent to AI for edits (~25K tokens input cap)
  MAX_SAVED_VISUALIZATIONS_FREE: 50,
  MAX_SAVED_VISUALIZATIONS_PRO: 1000,
  MAX_EXISTING_NODES_ARRAY: 1000,
  MAX_NODE_LABEL_LENGTH: 500,
};

/**
 * Token economy — gpt-5.4-mini, June 2026 pricing.
 *
 * All operations use gpt-5.4-mini ($0.75/1M in · $4.50/1M out).
 *
 * Real cost per call:
 *   Generate: ~700 in  + 2000 out = $0.009525
 *   Edit:    ~4000 in  + 3000 out = $0.016500  ← most expensive
 *
 * Unit token price anchored to the most expensive op (edit):
 *   $0.016500 ÷ 18 = $0.000917 / token
 *
 * Token costs (rounded UP to protect budget):
 *   Generate: $0.009525 ÷ $0.000917 = 10.39 → 11 tokens
 *   Edit:     $0.016500 ÷ $0.000917 = 18.00 → 18 tokens
 *
 * Pro monthly limit = $5.00 ÷ $0.000917 = 5,453 → floored to 5,400.
 *
 * PROOF no combination can exceed $5:
 *   All edits:    5,400÷18 = 300  × $0.016500 = $4.95 < $5 ✓
 *   All generates: 5,400÷11 = 490 × $0.009525 = $4.67 < $5 ✓
 *   Any mix: max = 5,400 × $0.000917            = $4.95 < $5 ✓
 */

export const TOKEN_LIMITS = {
  FREE_TIER_MONTHLY_TOKENS: 110,          // ~10 generates ($0.105 AI cost)
  PRO_TIER_MONTHLY_TOKENS: 5_400,         // $5.00 AI budget — no combination exceeds $5
  ENTERPRISE_TIER_MONTHLY_TOKENS: 27_000, // ~$24.76 AI budget
};

export const TOKEN_COSTS = {
  // Derived from $0.000917/token (anchored to edit, the most expensive op)
  GENERATE_VISUALIZATION: 11,   // $0.009525 actual → 10.39 → 11
  EDIT_VISUALIZATION: 18,       // $0.016500 actual → 18.00 → 18

  // Database operations (no AI call)
  SAVE_VISUALIZATION: 0,
  DELETE_VISUALIZATION: 0,
  EXPORT_VISUALIZATION: 0,
  SHARE_VISUALIZATION: 0,

  // Query operations
  GET_VISUALIZATIONS: 0,
  GET_VISUALIZATION: 0,
};

// gpt-5.4-mini pricing constants used to convert real OpenAI token usage → internal tokens
const MODEL_PRICING = {
  INPUT_PER_TOKEN:  0.75  / 1_000_000,  // $0.00000075 per input token
  OUTPUT_PER_TOKEN: 4.50  / 1_000_000,  // $0.0000045  per output token
  UNIT_TOKEN_PRICE: 0.000917,            // internal token unit (anchored to edit cost ÷ 18)
} as const;

/**
 * Convert actual OpenAI token usage to internal tokens.
 * Used by all action functions instead of flat TOKEN_COSTS estimates.
 */
export function calcInternalTokens(promptTokens: number, completionTokens: number): number {
  const actualCost =
    promptTokens   * MODEL_PRICING.INPUT_PER_TOKEN +
    completionTokens * MODEL_PRICING.OUTPUT_PER_TOKEN;
  return Math.max(1, Math.ceil(actualCost / MODEL_PRICING.UNIT_TOKEN_PRICE));
}

/**
 * Get token cost breakdown
 */
export function getTokenCosts(): {
  generateVisualization: number;
  editVisualization: number;
  exportVisualization: number;
  saveVisualization: number;
  deleteVisualization: number;
} {
  return {
    generateVisualization: TOKEN_COSTS.GENERATE_VISUALIZATION,
    editVisualization: TOKEN_COSTS.EDIT_VISUALIZATION,
    exportVisualization: TOKEN_COSTS.EXPORT_VISUALIZATION,
    saveVisualization: TOKEN_COSTS.SAVE_VISUALIZATION,
    deleteVisualization: TOKEN_COSTS.DELETE_VISUALIZATION,
  };
}

/**
 * Escape special regex characters so user input can be safely used inside a
 * MongoDB $regex query (prevents ReDoS via crafted patterns).
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  data: unknown,
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
  } catch {
    return { valid: false, error: 'Invalid data format' };
  }
}

/**
 * Sanitize error messages to prevent information disclosure
 */
export function sanitizeError(error: unknown, fallbackMessage: string = 'An error occurred'): string {
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
