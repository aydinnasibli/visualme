/**
 * File Parser Service
 * Handles parsing of uploaded files (CSV, JSON, TXT, PDF)
 */

import Papa from 'papaparse';
import type { FileData } from '../types/visualization';
import { validateFileSize, validateFileType } from '../utils/helpers';

export interface ParsedFileResult {
  success: boolean;
  data?: any;
  text?: string;
  error?: string;
  fileInfo: {
    name: string;
    type: string;
    size: number;
  };
}

/**
 * Parse uploaded file based on type
 */
export async function parseFile(file: File): Promise<ParsedFileResult> {
  const fileInfo = {
    name: file.name,
    type: file.type,
    size: file.size,
  };

  // Validate file size (default max: 10MB)
  if (!validateFileSize(file.size)) {
    return {
      success: false,
      error: 'File size exceeds maximum allowed size (10MB)',
      fileInfo,
    };
  }

  // Validate file type
  if (!validateFileType(file.name)) {
    return {
      success: false,
      error: 'Invalid file type. Allowed types: CSV, JSON, TXT, PDF',
      fileInfo,
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'csv':
        return await parseCSV(file, fileInfo);
      case 'json':
        return await parseJSON(file, fileInfo);
      case 'txt':
        return await parseTXT(file, fileInfo);
      case 'pdf':
        return await parsePDF(file, fileInfo);
      default:
        return {
          success: false,
          error: `Unsupported file type: ${extension}`,
          fileInfo,
        };
    }
  } catch (error) {
    console.error('File parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file',
      fileInfo,
    };
  }
}

/**
 * Parse CSV file
 */
async function parseCSV(file: File, fileInfo: ParsedFileResult['fileInfo']): Promise<ParsedFileResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            error: `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
            fileInfo,
          });
        } else {
          resolve({
            success: true,
            data: results.data,
            fileInfo,
          });
        }
      },
      error: (error: Error) => {
        resolve({
          success: false,
          error: `Failed to parse CSV: ${error.message}`,
          fileInfo,
        });
      },
    });
  });
}

/**
 * Parse JSON file
 */
async function parseJSON(file: File, fileInfo: ParsedFileResult['fileInfo']): Promise<ParsedFileResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    return {
      success: true,
      data,
      text,
      fileInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
      fileInfo,
    };
  }
}

/**
 * Parse TXT file
 */
async function parseTXT(file: File, fileInfo: ParsedFileResult['fileInfo']): Promise<ParsedFileResult> {
  try {
    const text = await file.text();

    return {
      success: true,
      text,
      fileInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read text file',
      fileInfo,
    };
  }
}

/**
 * Parse PDF file
 * Note: For actual PDF parsing, we'd use pdf-parse or similar library
 * For now, returning a placeholder that can be enhanced
 */
async function parsePDF(file: File, fileInfo: ParsedFileResult['fileInfo']): Promise<ParsedFileResult> {
  try {
    // For basic implementation, we'll read the PDF as text
    // In production, you'd use pdf-parse library
    const arrayBuffer = await file.arrayBuffer();

    // Placeholder: In a real implementation, you would use pdf-parse
    // const pdf = await pdfParse(Buffer.from(arrayBuffer));
    // const text = pdf.text;

    return {
      success: true,
      text: 'PDF parsing requires server-side processing. Please use the API endpoint for PDF uploads.',
      fileInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
      fileInfo,
    };
  }
}

/**
 * Convert file to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/png;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Detect data structure and suggest visualization type
 */
export function detectDataStructure(data: any): {
  hasTimeSeries: boolean;
  hasNumerical: boolean;
  hasCategories: boolean;
  hasHierarchy: boolean;
  hasRelationships: boolean;
  suggestedTypes: string[];
} {
  if (!data) {
    return {
      hasTimeSeries: false,
      hasNumerical: false,
      hasCategories: false,
      hasHierarchy: false,
      hasRelationships: false,
      suggestedTypes: [],
    };
  }

  const suggestedTypes: string[] = [];

  // Check if data is an array
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    const keys = Object.keys(firstItem);

    // Detect time series data
    const hasTimeSeries = keys.some(
      (key) => /date|time|year|month|day|timestamp/i.test(key)
    );
    if (hasTimeSeries) {
      suggestedTypes.push('timeline', 'line_chart', 'gantt_chart');
    }

    // Detect numerical data
    const hasNumerical = keys.some(
      (key) => typeof firstItem[key] === 'number'
    );
    if (hasNumerical) {
      suggestedTypes.push('line_chart', 'bar_chart', 'scatter_plot');
    }

    // Detect categorical data
    const hasCategories = keys.some(
      (key) => typeof firstItem[key] === 'string'
    );
    if (hasCategories && hasNumerical) {
      suggestedTypes.push('bar_chart', 'pie_chart', 'comparison_table');
    }

    // Detect hierarchical data
    const hasHierarchy = keys.some((key) => /parent|child|level/i.test(key));
    if (hasHierarchy) {
      suggestedTypes.push('tree_diagram', 'mind_map');
    }

    // Detect relationship data
    const hasRelationships = keys.some((key) =>
      /source|target|from|to|edge|link|connection/i.test(key)
    );
    if (hasRelationships) {
      suggestedTypes.push('network_graph', 'force_directed_graph', 'sankey_diagram');
    }

    return {
      hasTimeSeries,
      hasNumerical,
      hasCategories,
      hasHierarchy,
      hasRelationships,
      suggestedTypes: [...new Set(suggestedTypes)],
    };
  }

  // Check if data is an object (might be hierarchical or network data)
  if (typeof data === 'object') {
    const hasChildren = 'children' in data || 'nodes' in data;
    const hasEdges = 'edges' in data || 'links' in data;

    if (hasChildren) {
      suggestedTypes.push('tree_diagram', 'mind_map');
    }

    if (hasEdges) {
      suggestedTypes.push('network_graph', 'force_directed_graph');
    }

    return {
      hasTimeSeries: false,
      hasNumerical: false,
      hasCategories: false,
      hasHierarchy: hasChildren,
      hasRelationships: hasEdges,
      suggestedTypes,
    };
  }

  return {
    hasTimeSeries: false,
    hasNumerical: false,
    hasCategories: false,
    hasHierarchy: false,
    hasRelationships: false,
    suggestedTypes: [],
  };
}

/**
 * Prepare file data for API submission
 */
export function prepareFileData(
  filename: string,
  content: string,
  type: 'csv' | 'json' | 'txt' | 'pdf'
): FileData {
  return {
    filename,
    content,
    type,
  };
}
