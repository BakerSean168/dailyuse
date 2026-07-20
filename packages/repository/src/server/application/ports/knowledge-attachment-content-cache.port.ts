export interface KnowledgeAttachmentContentCacheEntry {
  connectionId: string;
  blobSha: string;
  byteSize: number;
  bytes: Uint8Array;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Shared, best-effort cache for immutable GitHub attachment blobs.
 * Authorization is deliberately kept in the projection service and must run
 * before every cache lookup.
 */
export interface IKnowledgeAttachmentContentCache {
  find(
    connectionId: string,
    blobSha: string,
    now: number,
  ): Promise<KnowledgeAttachmentContentCacheEntry | null>;
  save(entry: KnowledgeAttachmentContentCacheEntry): Promise<void>;
  remove(connectionId: string, blobSha: string): Promise<void>;
}
