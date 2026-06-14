// ============================================================================
// VISUALIZATION TYPES — spec-based system
//
// A visualization is a single declarative ECharts `option` (structure) plus
// a `BrandTheme` (presentation) — see `@/lib/types/echarts-spec`. This
// replaces the old closed catalog of ~19 hardcoded visualization types.
// ============================================================================

import type { VisualizationSpec } from './echarts-spec';
import type { ChartSelection } from '@/lib/utils/chart-types';

export interface VisualizationResponse {
  spec?: VisualizationSpec;
  reason: string;
  success: boolean;
  error?: string;
  metadata?: VisualizationMetadata;
  title?: string;
  /** True when the result was served from cache (no AI call, no token cost). */
  fromCache?: boolean;
  /** The chart type + variant the AI auto-detected (free-text path only; undefined when user explicitly chose via modal or result came from cache). */
  detectedSelection?: ChartSelection;
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

export interface VisualizationSchedule {
  enabled: boolean;
  /** 0=Sunday..6=Saturday, UTC. */
  dayOfWeek: number;
  lastSentAt?: string;
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
  /** Weekly email digest schedule for this chart's live data (requires `liveData`). */
  schedule?: VisualizationSchedule;
  /** False = ephemeral session (auto-persisted, subject to TTL); true/missing = explicitly saved (permanent). */
  isSaved?: boolean;
  /** Server-only TTL marker for ephemeral sessions — never selected for client responses. */
  sessionExpiresAt?: Date;
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

export interface ExportOptions {
  resolution?: number; // For PNG (1x, 2x, 3x)
  includeMetadata?: boolean;
  title?: string;
}
