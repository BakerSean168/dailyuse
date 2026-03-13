/**
 * Document Metadata Value Object
 */

// ============ Interface Definitions ============

/** Document Metadata - Server interface. */
export interface IDocumentMetadataServer {
  tags: string[];
  category: string | null;
  wordCount: number | null;
  characterCount: number | null;
  readingTime: number | null; // In seconds
  encoding: string | null;
  language: string | null;
  customFields?: Record<string, any> | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IDocumentMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IDocumentMetadataServer;

  // DTO conversion methods
}

/** Document Metadata - Client interface. */
export interface IDocumentMetadataClient {
  tags: string[];
  category: string | null;
  wordCount: number | null;
  characterCount: number | null;
  readingTime: number | null;

  // UI helper properties
  wordCountFormatted: string | null; // "1,234 words"
  readingTimeFormatted: string | null; // "5 min read"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Document Metadata Server DTO
 */
export interface DocumentMetadataServerDTO {
  tags: string[];
  category: string | null;
  wordCount: number | null;
  characterCount: number | null;
  readingTime: number | null;
  encoding: string | null;
  language: string | null;
  customFields?: Record<string, any> | null;
}

/**
 * Document Metadata Client DTO
 */
export interface DocumentMetadataClientDTO {
  tags: string[];
  category: string | null;
  wordCount: number | null;
  characterCount: number | null;
  readingTime: number | null;
  wordCountFormatted: string | null;
  readingTimeFormatted: string | null;
}

/**
 * Document Metadata Persistence DTO
 */
export interface DocumentMetadataPersistenceDTO {
  tags: string; // JSON.stringify(string[])
  category: string | null;
  word_count: number | null;
  character_count: number | null;
  reading_time: number | null;
  encoding: string | null;
  language: string | null;
  custom_fields: string | null; // JSON string
}

// ============ Type Exports ============

export type DocumentMetadataServer = IDocumentMetadataServer;
export type DocumentMetadataClient = IDocumentMetadataClient;
