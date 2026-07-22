import type { ChatExecutionProviderConfig } from './chat-execution.port';

export interface KnowledgeSourceNote {
  identityId: string;
  repositoryId: string;
  resourceId: string;
  resourcePath: string;
  title?: string;
  mimeType: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeIndexedChunk {
  chunkIndex: number;
  content: string;
  contentHash: string;
  startOffset: number;
  endOffset: number;
  headingPath: string[];
  keywords: string[];
  embedding: number[];
}

export interface KnowledgeIndexedNote {
  identityId: string;
  repositoryId: string;
  resourceId: string;
  resourcePath: string;
  title?: string;
  mimeType: string;
  contentHash: string;
  summary: string;
  keywords: string[];
  embedding: number[];
  chunks: KnowledgeIndexedChunk[];
  metadata: Record<string, unknown>;
}

export interface KnowledgeIngestionInput {
  note: KnowledgeSourceNote;
  providerConfig?: ChatExecutionProviderConfig;
  maxChunkChars?: number;
  overlapChars?: number;
}

export interface IKnowledgeIngestionPort {
  indexNote(input: KnowledgeIngestionInput): Promise<KnowledgeIndexedNote>;
}
