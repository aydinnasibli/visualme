'use client';

import { parseFile } from '@/lib/services/file-parser';

export type AttachmentExtension = 'csv' | 'json' | 'txt';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  extension: AttachmentExtension;
  rowCount?: number;
  /** Pre-formatted block embedded into the AI prompt — never shown in the UI. */
  promptSegment: string;
}

const ACCEPTED_EXTENSIONS: AttachmentExtension[] = ['csv', 'json', 'txt'];
export const ATTACHMENT_ACCEPT = '.csv,.json,.txt,text/csv,application/json,text/plain';

/** Keep embedded data well within VALIDATION_LIMITS.MAX_INPUT_LENGTH (10K chars). */
const MAX_EMBED_CHARS = 6000;

function truncate(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;
  return `${text.slice(0, MAX_EMBED_CHARS)}\n… (truncated — ${text.length - MAX_EMBED_CHARS} more characters omitted)`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reads and validates a data file client-side, producing a compact text block
 * that can be embedded directly into an AI prompt (parse-then-embed approach —
 * no backend signature changes needed for generateVisualization/editVisualizationAction).
 */
export async function readFileAttachment(file: File): Promise<{ attachment?: FileAttachment; error?: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return { error: 'PDF support is coming soon — try CSV, JSON, or TXT for now.' };
  }
  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension as AttachmentExtension)) {
    return { error: `Unsupported file type "${extension ?? file.name}". Accepted: CSV, JSON, TXT.` };
  }

  const result = await parseFile(file);
  if (!result.success) return { error: result.error || 'Failed to read file' };

  let body: string;
  let rowCount: number | undefined;
  if (Array.isArray(result.data)) {
    rowCount = result.data.length;
    body = JSON.stringify(result.data, null, 2);
  } else if (result.data !== undefined) {
    body = JSON.stringify(result.data, null, 2);
  } else {
    body = result.text ?? '';
  }

  const rowsLabel = rowCount !== undefined ? ` — ${rowCount.toLocaleString()} rows` : '';
  const promptSegment = `Attached data file "${file.name}"${rowsLabel}:\n\`\`\`\n${truncate(body)}\n\`\`\``;

  return {
    attachment: {
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      extension: extension as AttachmentExtension,
      rowCount,
      promptSegment,
    },
  };
}

/** Merges the user's typed instructions with the attached file's data for the AI prompt. */
export function composePromptWithAttachment(text: string, attachment: FileAttachment | null): string {
  if (!attachment) return text;
  const trimmed = text.trim();
  return trimmed
    ? `${trimmed}\n\n${attachment.promptSegment}`
    : `Visualize the data in the attached file.\n\n${attachment.promptSegment}`;
}
