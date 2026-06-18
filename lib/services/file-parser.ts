import Papa from 'papaparse';
import { validateFileSize, validateFileType } from '../utils/helpers';

export interface ParsedFileResult {
  success: boolean;
  data?: unknown;
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
      error: 'Invalid file type. Allowed types: CSV, JSON, TXT, XLSX, PDF',
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
      case 'xlsx':
        return await parseXLSX(file, fileInfo);
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
 * Parse XLSX file — reads the first sheet and returns rows as objects
 */
async function parseXLSX(file: File, fileInfo: ParsedFileResult['fileInfo']): Promise<ParsedFileResult> {
  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: 'No sheets found in the workbook', fileInfo };
    }
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    return { success: true, data, fileInfo };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse XLSX file',
      fileInfo,
    };
  }
}

async function parsePDF(file: File, fileInfo: ParsedFileResult['fileInfo']): Promise<ParsedFileResult> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    const result = await parser.getText();
    const text = result.text?.trim();
    await parser.destroy();

    if (!text) {
      return {
        success: false,
        error: 'Could not extract text from this PDF. It may be image-based or empty.',
        fileInfo,
      };
    }

    return {
      success: true,
      text,
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
