'use client';

import { type ColumnSchema, formatSchemaForPrompt } from '@/lib/utils/csv-schema';

export interface LiveSheetData {
  url: string;
  rawCsv: string;
  headers: string[];
  rowCount: number;
  schema: ColumnSchema[];
}

/** Keep embedded data well within VALIDATION_LIMITS.MAX_INPUT_LENGTH (10K chars). */
const MAX_EMBED_CHARS = 6000;

/** Truncate to a whole number of lines so the AI never sees a cut-off row. */
function truncate(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;
  const cut = text.slice(0, MAX_EMBED_CHARS);
  const lastNewline = cut.lastIndexOf('\n');
  const clean = lastNewline > 0 ? cut.slice(0, lastNewline) : cut;
  return `${clean}\n… (truncated — ${text.length - clean.length} more characters omitted)`;
}

/**
 * Builds the "live data" block embedded in an AI prompt: a typed column
 * schema (so the AI knows numeric vs. categorical vs. date columns and their
 * real ranges/distinct values, even for rows beyond the embedded sample)
 * followed by the CSV data itself.
 */
export function formatLiveDataBlock(data: Pick<LiveSheetData, 'rawCsv' | 'headers' | 'rowCount' | 'schema'>): string {
  const schemaBlock = formatSchemaForPrompt(data.schema);
  return (
    `${data.rowCount.toLocaleString()} rows, columns: ${data.headers.join(', ')}\n\n` +
    `Column schema:\n${schemaBlock}\n\n` +
    `Data (CSV):\n\`\`\`csv\n${truncate(data.rawCsv)}\n\`\`\``
  );
}

/** Merges the user's typed instructions with the connected live sheet's data for the AI prompt. */
export function composePromptWithLiveSheet(text: string, sheet: LiveSheetData | null): string {
  if (!sheet) return text;
  const trimmed = text.trim();
  const segment = `Live data from connected Google Sheet — ${formatLiveDataBlock(sheet)}`;
  return trimmed
    ? `${trimmed}\n\n${segment}`
    : `Visualize this live data from the connected Google Sheet.\n\n${segment}`;
}
