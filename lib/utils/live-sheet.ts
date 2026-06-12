'use client';

export interface LiveSheetData {
  url: string;
  rawCsv: string;
  headers: string[];
  rowCount: number;
}

/** Keep embedded data well within VALIDATION_LIMITS.MAX_INPUT_LENGTH (10K chars). */
const MAX_EMBED_CHARS = 6000;

function truncate(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;
  return `${text.slice(0, MAX_EMBED_CHARS)}\n… (truncated — ${text.length - MAX_EMBED_CHARS} more characters omitted)`;
}

/** Merges the user's typed instructions with the connected live sheet's data for the AI prompt. */
export function composePromptWithLiveSheet(text: string, sheet: LiveSheetData | null): string {
  if (!sheet) return text;
  const trimmed = text.trim();
  const segment = `Live data from connected Google Sheet (${sheet.rowCount.toLocaleString()} rows, columns: ${sheet.headers.join(', ')}):\n\`\`\`csv\n${truncate(sheet.rawCsv)}\n\`\`\``;
  return trimmed
    ? `${trimmed}\n\n${segment}`
    : `Visualize this live data from the connected Google Sheet.\n\n${segment}`;
}
