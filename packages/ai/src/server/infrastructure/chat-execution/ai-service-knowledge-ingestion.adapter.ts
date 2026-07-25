import type {
  IKnowledgeIngestionPort,
  KnowledgeIndexedNote,
  KnowledgeIngestionInput,
} from '../../application/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

interface AIServiceIndexedKnowledgeChunkResponse {
  chunk_index: number;
  content: string;
  content_hash: string;
  start_offset: number;
  end_offset: number;
  heading_path?: string[];
  keywords?: string[];
  embedding?: number[];
}

interface AIServiceIndexedKnowledgeNoteResponse {
  identity_id: string;
  repository_id: string;
  resource_id: string;
  resource_path: string;
  title?: string;
  mime_type: string;
  content_hash: string;
  summary: string;
  keywords?: string[];
  embedding?: number[];
  chunks: AIServiceIndexedKnowledgeChunkResponse[];
  metadata?: Record<string, unknown>;
}

interface AIServiceKnowledgeIngestionResponse {
  indexed_resource: AIServiceIndexedKnowledgeNoteResponse;
}

export class AIServiceKnowledgeIngestionAdapter implements IKnowledgeIngestionPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async indexNote(input: KnowledgeIngestionInput): Promise<KnowledgeIndexedNote> {
    const payload = await this.client.postJson<
      AIServiceKnowledgeIngestionResponse,
      {
        resource: {
          identity_id: string;
          repository_id: string;
          resource_id: string;
          resource_path: string;
          title?: string;
          mime_type: string;
          content: string;
          metadata?: Record<string, unknown>;
        };
        provider_config?: {
          provider: string;
          model: string;
          embedding_model?: string;
          api_key: string;
          base_url?: string;
          temperature?: number;
          max_tokens?: number;
        };
        max_chunk_chars?: number;
        overlap_chars?: number;
      }
    >({
      path: '/internal/workflows/knowledge-index',
      identityId: input.note.identityId,
      body: {
        resource: {
          identity_id: input.note.identityId,
          repository_id: input.note.repositoryId,
          resource_id: input.note.resourceId,
          resource_path: input.note.resourcePath,
          title: input.note.title,
          mime_type: input.note.mimeType,
          content: input.note.content,
          metadata: input.note.metadata,
        },
        provider_config: input.providerConfig
          ? {
              provider: input.providerConfig.provider,
              model: input.providerConfig.model,
              embedding_model: input.providerConfig.embeddingModel,
              api_key: input.providerConfig.apiKey,
              base_url: input.providerConfig.baseUrl,
              temperature: input.providerConfig.temperature,
              max_tokens: input.providerConfig.maxTokens,
            }
          : undefined,
        max_chunk_chars: input.maxChunkChars,
        overlap_chars: input.overlapChars,
      },
    });

    return {
      identityId: payload.indexed_resource.identity_id,
      repositoryId: payload.indexed_resource.repository_id,
      resourceId: payload.indexed_resource.resource_id,
      resourcePath: payload.indexed_resource.resource_path,
      title: payload.indexed_resource.title,
      mimeType: payload.indexed_resource.mime_type,
      contentHash: payload.indexed_resource.content_hash,
      summary: payload.indexed_resource.summary,
      keywords: payload.indexed_resource.keywords ?? [],
      embedding: payload.indexed_resource.embedding ?? [],
      chunks: payload.indexed_resource.chunks.map((chunk) => ({
        chunkIndex: chunk.chunk_index,
        content: chunk.content,
        contentHash: chunk.content_hash,
        startOffset: chunk.start_offset,
        endOffset: chunk.end_offset,
        headingPath: chunk.heading_path ?? [],
        keywords: chunk.keywords ?? [],
        embedding: chunk.embedding ?? [],
      })),
      metadata: payload.indexed_resource.metadata ?? {},
    };
  }
}
