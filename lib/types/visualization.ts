// ============================================================================
// VISUALIZATION TYPES — spec-based system
//
// A visualization is a single declarative ECharts `option` (structure) plus
// a `BrandTheme` (presentation) — see `@/lib/types/echarts-spec`. This
// replaces the old closed catalog of ~19 hardcoded visualization types.
// ============================================================================

import type { VisualizationSpec } from './echarts-spec';

export interface FileData {
  filename: string;
  content: string;
  type: 'csv' | 'json' | 'txt' | 'pdf';
}

export interface VisualizationRequest {
  input: string;
  fileData?: FileData;
}

export interface VisualizationResponse {
  spec?: VisualizationSpec;
  reason: string;
  success: boolean;
  error?: string;
  metadata?: VisualizationMetadata;
  title?: string;
  /** True when the result was served from cache (no AI call, no token cost). */
  fromCache?: boolean;
}

export interface VisualizationMetadata {
  generatedAt: Date | string;
  processingTime?: number;
  aiModel?: string;
  cost?: number;
  originalInput: string;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface LiveDataConfig {
  url: string;
  /** Refresh interval in minutes. 0 = manual only. */
  interval: number;
  lastRefreshed?: string;
}

export interface SavedVisualization {
  _id?: string;
  userId: string;
  title: string;
  spec: VisualizationSpec;
  metadata: VisualizationMetadata;
  isPublic: boolean;
  shareId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date | string;
  }>;
  liveData?: LiveDataConfig;
}

export interface UserUsage {
  userId: string;
  visualizationsCreated: number;
  lastResetDate: Date;
  tier: 'free' | 'pro' | 'enterprise';

  // Token-based usage tracking
  tokensUsed: number;        // Tokens used this billing period
  tokensLimit: number;       // Monthly token limit based on tier
  tokenResetDate: Date;      // When tokens will refresh
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'csv' | 'html';

export interface ExportRequest {
  visualizationId: string;
  format: ExportFormat;
  options?: ExportOptions;
}

export interface ExportOptions {
  resolution?: number; // For PNG (1x, 2x, 3x)
  includeMetadata?: boolean;
  title?: string;
}

export interface ShareLinkOptions {
  expiresIn?: number; // Days until expiration
  password?: string;
  isPublic: boolean;
}
