/**
 * File utilities for mobile file operations.
 * Handles URI to base64 conversion, file validation, and metadata extraction.
 */

import { File } from 'expo-file-system';

/** Default max file size: 10MB */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Chunk size for base64 conversion: 32KB */
const BASE64_CHUNK_SIZE = 32 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
}

/**
 * Read a file from URI and convert to base64 string.
 * Uses chunked processing for better memory efficiency with large files.
 */
export async function uriToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Process in chunks to avoid call stack issues with large files
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + BASE64_CHUNK_SIZE);
    let binary = '';
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
    chunks.push(binary);
  }

  return btoa(chunks.join(''));
}

/**
 * Validate a file against size and MIME type constraints.
 */
export function validateFile(
  file: { size?: number; mimeType?: string; name: string },
  options: FileValidationOptions = {},
): FileValidationResult {
  const { maxSize = DEFAULT_MAX_FILE_SIZE, allowedMimeTypes } = options;

  if (file.size !== undefined && file.size > maxSize) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`,
    };
  }

  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const mimeType = file.mimeType ?? inferMimeType(file.name);
    const isAllowed = allowedMimeTypes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -1);
        return mimeType.startsWith(prefix);
      }
      return mimeType === allowed;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type "${mimeType}" is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Extract file extension from filename or URI.
 */
export function getFileExtension(filename: string): string {
  // Handle URI paths by extracting the filename portion
  const basename = filename.split('/').pop() ?? filename;
  const parts = basename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Infer MIME type from file extension.
 */
export function inferMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeMap: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    heif: 'image/heif',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'application/typescript',
    csv: 'text/csv',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    // Video
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate a unique filename with timestamp.
 */
export function generateUniqueFilename(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}
