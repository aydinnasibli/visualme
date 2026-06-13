// ============================================================================
// CSV SCHEMA INFERENCE — classifies each column of a parsed dataset
// (numeric / date / boolean / categorical) and summarizes its range,
// distinct count, and representative examples. Used to give the AI a typed
// understanding of a connected live sheet instead of raw, untyped CSV text.
// ============================================================================

export type SchemaColumnType = 'numeric' | 'date' | 'boolean' | 'categorical';

export interface ColumnSchema {
  name: string;
  type: SchemaColumnType;
  /** Up to 3 representative values, in row order (for numeric/date/boolean). */
  examples: string[];
  /** numeric: [min, max] formatted as numbers; date: [earliest, latest] as ISO (YYYY-MM-DD). */
  range?: [string, string];
  /** categorical: total number of distinct non-empty values. */
  uniqueCount?: number;
  /** categorical: most frequent values, most common first (up to 5). */
  topValues?: string[];
}

const DATE_PATTERNS: RegExp[] = [
  /^\d{4}-\d{1,2}-\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/, // ISO date / datetime
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YYYY or D/M/YYYY
  /^\d{1,2}-\d{1,2}-\d{2,4}$/, // M-D-YYYY
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}$/i, // "January 5, 2024"
  /^\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+\d{4}$/i, // "5 January 2024"
];

function looksLikeDate(value: string): boolean {
  const v = value.trim();
  if (!v || !DATE_PATTERNS.some(re => re.test(v))) return false;
  return !Number.isNaN(Date.parse(v));
}

function looksLikeBoolean(value: string): boolean {
  return /^(true|false)$/i.test(value.trim());
}

/**
 * Classify each column of a parsed dataset (array of row objects, as produced
 * by Papa Parse with `header: true, dynamicTyping: true`) into a typed schema
 * with range/distinct-value summaries — enough for an AI to pick sensible
 * axis types and chart structure without seeing every row.
 */
export function inferSchema(rows: Record<string, unknown>[]): ColumnSchema[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const names = Object.keys(rows[0] ?? {});

  return names.map((name): ColumnSchema => {
    const raw = rows
      .map(r => r[name])
      .filter((v): v is number | string => v !== null && v !== undefined && v !== '');

    if (raw.length === 0) {
      return { name, type: 'categorical', examples: [], uniqueCount: 0, topValues: [] };
    }

    // Numeric: dynamicTyping already converted clean numeric strings to numbers.
    if (raw.every(v => typeof v === 'number' && !Number.isNaN(v))) {
      const nums = raw as number[];
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      return {
        name,
        type: 'numeric',
        examples: nums.slice(0, 3).map(String),
        range: [String(min), String(max)],
      };
    }

    const strs = raw.map(v => String(v));

    if (strs.every(looksLikeDate)) {
      const times = strs.map(s => Date.parse(s.trim()));
      const min = new Date(Math.min(...times)).toISOString().slice(0, 10);
      const max = new Date(Math.max(...times)).toISOString().slice(0, 10);
      return {
        name,
        type: 'date',
        examples: strs.slice(0, 3),
        range: [min, max],
      };
    }

    if (strs.every(looksLikeBoolean)) {
      return { name, type: 'boolean', examples: [...new Set(strs)].slice(0, 2) };
    }

    // Categorical: count distinct values and surface the most frequent ones.
    const counts = new Map<string, number>();
    for (const s of strs) counts.set(s, (counts.get(s) ?? 0) + 1);
    const topValues = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value]) => value);

    return { name, type: 'categorical', examples: [], uniqueCount: counts.size, topValues };
  });
}

/** Renders an inferred schema as a compact, human-readable block for an AI prompt. */
export function formatSchemaForPrompt(schema: ColumnSchema[]): string {
  return schema
    .map(col => {
      switch (col.type) {
        case 'numeric':
          return `- "${col.name}" — numeric, range ${col.range?.[0]} to ${col.range?.[1]} (e.g. ${col.examples.join(', ')})`;
        case 'date':
          return `- "${col.name}" — date, range ${col.range?.[0]} to ${col.range?.[1]} (e.g. ${col.examples.join(', ')})`;
        case 'boolean':
          return `- "${col.name}" — boolean (e.g. ${col.examples.join(', ')})`;
        case 'categorical':
          return col.uniqueCount
            ? `- "${col.name}" — categorical, ${col.uniqueCount} distinct (top: ${col.topValues?.join(', ')})`
            : `- "${col.name}" — categorical (no values)`;
      }
    })
    .join('\n');
}
