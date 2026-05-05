/**
 * Resource Metadata Value Object
 */

// ============ Interface Definition ============

/** Resource Metadata interface. */
export interface IResourceMetadata {
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
        IResourceMetadata,
        'equals' | 'with' | 'toDTO'
      >
    >,
  ): IResourceMetadata;
}

// ============ DTO Definition ============

/**
 * Resource Metadata DTO
 */
export interface ResourceMetadataDTO {
  tags: string[];
  category: string | null;
  wordCount: number | null;
  characterCount: number | null;
  readingTime: number | null;
  encoding: string | null;
  language: string | null;
  customFields?: Record<string, any> | null;
}

