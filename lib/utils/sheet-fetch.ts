// ============================================================================
// SHEET FETCH — shared Google Sheets/CSV fetching, SSRF guarding, and parsing.
// Used by the `/api/live-data` route (per-request, rate-limited) and the
// scheduled dashboard digest cron job (server-initiated, no HTTP round trip).
// ============================================================================

import Papa from 'papaparse';
import { type ColumnSchema, inferSchema } from '@/lib/utils/csv-schema';

const MAX_RESPONSE_BYTES = 512 * 1024; // 512 KB
const FETCH_TIMEOUT_MS = 12_000;

export interface FetchedSheet {
  ok: true;
  rawCsv: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  schema: ColumnSchema[];
  truncated: boolean;
}

export interface FetchedSheetError {
  ok: false;
  error: string;
  status: number;
}

/* ── Google Sheets URL → CSV export URL ── */
export function normalizeSheetUrl(raw: string): string {
  const sheetsMatch = raw.match(
    /https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/
  );
  if (sheetsMatch) {
    const id = sheetsMatch[1];
    const gidMatch = raw.match(/[?&#]gid=(\d+)/);
    // Omit gid when absent so Google falls back to the spreadsheet's default
    // sheet — defaulting to gid=0 breaks when that gid no longer exists.
    return gidMatch
      ? `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gidMatch[1]}`
      : `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  }
  return raw;
}

/* ── SSRF protection ── */
export function isBlockedSheetUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return true;
  }
  if (parsed.protocol !== 'https:') return true;
  const h = parsed.hostname.toLowerCase();
  // IPv4 private/reserved
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^0\./.test(h)) return true;
  if (h === 'metadata.google.internal') return true;
  // IPv6 private/reserved. Node.js URL always includes brackets in .hostname
  // e.g. new URL('https://[::1]/').hostname === '[::1]'
  if (h === '[::1]') return true;
  if (h.startsWith('[fe80:')) return true;
  if (h.startsWith('[fc') || h.startsWith('[fd')) return true;
  if (h.startsWith('[::ffff:')) return true;
  if (h.startsWith('[ff')) return true;
  return false;
}

/* ── CSV parsing (Papa Parse handles quoting, escapes, CRLF, and type coercion) ── */
function parseCsv(text: string, truncated: boolean): {
  rawCsv: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
} {
  // A response truncated at MAX_RESPONSE_BYTES may end mid-row — drop that
  // incomplete trailing line so it doesn't corrupt the last parsed row.
  let cleaned = text.trim();
  if (truncated) {
    const lastNewline = cleaned.lastIndexOf('\n');
    if (lastNewline !== -1) cleaned = cleaned.slice(0, lastNewline).trimEnd();
  }

  // Google Sheets exports commonly start with blank spacer/title rows above
  // the real header — drop fully-empty leading lines (all commas/whitespace)
  // so `header: true` picks up the actual column names.
  const lines = cleaned.split(/\r?\n/);
  let firstContentLine = 0;
  while (firstContentLine < lines.length - 1 && /^[,\s]*$/.test(lines[firstContentLine])) {
    firstContentLine++;
  }
  if (firstContentLine > 0) cleaned = lines.slice(firstContentLine).join('\n');

  const result = Papa.parse<Record<string, unknown>>(cleaned, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });

  return {
    rawCsv: cleaned,
    headers: result.meta.fields ?? [],
    rows: result.data,
    rowCount: result.data.length,
  };
}

/**
 * Fetches a Google Sheets/CSV URL, enforces SSRF/protocol/size limits, and
 * parses + schema-infers the result. `rawUrl` is expected to already be
 * percent-decoded (callers from query params should not double-decode).
 */
export async function fetchAndParseSheet(rawUrl: string): Promise<FetchedSheet | FetchedSheetError> {
  let url: string;
  try {
    url = normalizeSheetUrl(rawUrl);
    new URL(url); // validate parseable
  } catch {
    return { ok: false, error: 'Invalid URL', status: 400 };
  }

  if (isBlockedSheetUrl(url)) {
    return { ok: false, error: 'URL not allowed', status: 400 };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/csv, text/plain, */*' },
      // Never cache — always get fresh data
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, error: `Source returned ${res.status} ${res.statusText}`, status: 502 };
    }

    const contentType = res.headers.get('content-type') ?? '';
    // Explicit block: HTML is never valid CSV (handles "You need access" pages from Google Sheets)
    if (contentType.includes('text/html')) {
      return {
        ok: false,
        error: 'URL returned an HTML page — check the sheet is publicly shared and the URL is correct',
        status: 400,
      };
    }
    const isCSV =
      contentType.includes('csv') ||
      contentType.includes('text/plain') ||
      contentType.includes('octet-stream') ||
      url.endsWith('.csv') ||
      url.includes('export?format=csv');

    if (!isCSV) {
      return { ok: false, error: 'URL does not appear to return CSV data', status: 400 };
    }

    // Read up to MAX_RESPONSE_BYTES
    const reader = res.body?.getReader();
    if (!reader) {
      return { ok: false, error: 'Empty response from source', status: 502 };
    }

    const chunks: Uint8Array[] = [];
    let bytesRead = 0;
    let truncated = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (bytesRead + value.byteLength > MAX_RESPONSE_BYTES) {
        chunks.push(value.slice(0, MAX_RESPONSE_BYTES - bytesRead));
        truncated = true;
        break;
      }
      chunks.push(value);
      bytesRead += value.byteLength;
    }
    reader.cancel();

    const rawCsv = new TextDecoder().decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.byteLength + c.byteLength);
        merged.set(acc); merged.set(c, acc.byteLength);
        return merged;
      }, new Uint8Array())
    );

    const parsed = parseCsv(rawCsv, truncated);
    const schema = inferSchema(parsed.rows);

    return {
      ok: true,
      rawCsv: parsed.rawCsv,
      headers: parsed.headers,
      rows: parsed.rows,
      rowCount: parsed.rowCount,
      schema,
      truncated,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Request timed out', status: 504 };
    }
    console.error('[sheet-fetch] fetch error:', err);
    return { ok: false, error: 'Failed to fetch data source', status: 502 };
  } finally {
    clearTimeout(timeoutId);
  }
}
