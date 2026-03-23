/**
 * Resource Metadata Value Object
 */

// ============ Interface Definitions ============

/** Resource Metadata - Server interface. */
export interface IResourceMetadataServer {
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
        IResourceMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IResourceMetadataServer;

  // DTO conversion methods
}

/** Resource Metadata - Client interface. */
export interface IResourceMetadataClient {
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
 * Resource Metadata Server DTO
 */
export interface ResourceMetadataServerDTO {
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
 * Resource Metadata Client DTO
 */
export interface ResourceMetadataClientDTO {
  tags: string[];
  category: string | null;
  wordCount: number | null;
  characterCount: number | null;
  readingTime: number | null;
  wordCountFormatted: string | null;
  readingTimeFormatted: string | null;
}

/**
 * Resource Metadata Persistence DTO
 */
export interface ResourceMetadataPersistenceDTO {
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

export type ResourceMetadataServer = IResourceMetadataServer;
export type ResourceMetadataClient = IResourceMetadataClient;
