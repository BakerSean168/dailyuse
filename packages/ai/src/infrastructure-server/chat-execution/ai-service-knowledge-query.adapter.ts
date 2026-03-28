import type {
  KnowledgeExpansionInput,
  KnowledgeExpansionResult,
  IKnowledgeQueryPort,
  KnowledgeQueryInput,
  KnowledgeQueryResult,
} from '../../application-server/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

interface AIServiceKnowledgeQueryResponse {
  answer: string;
  citations?: Array<{
    resource_id: string;
    resource_path: string;
    title?: string;
    chunk_index: number;
    excerpt: string;
    score: number;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

interface AIServiceKnowledgeExpansionResponse {
  expanded_content: string;
  citations?: AIServiceKnowledgeQueryResponse['citations'];
  usage?: AIServiceKnowledgeQueryResponse['usage'];
}

export class AIServiceKnowledgeQueryAdapter implements IKnowledgeQueryPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async expand(input: KnowledgeExpansionInput): Promise<KnowledgeExpansionResult> {
    const payload = await this.client.postJson<
      AIServiceKnowledgeExpansionResponse,
      {
        instruction: string;
        current_content?: string;
        related_resources: Array<{
          identity_id: string;
          repository_id: string;
          resource_id: string;
          resource_path: string;
          title?: string;
          mime_type: string;
          content: string;
          metadata: Record<string, unknown>;
        }>;
        provider_config: {
          provider: string;
          model: string;
          api_key: string;
          base_url?: string;
          temperature?: number;
          max_tokens?: number;
        };
        max_citations?: number;
        request_id?: string;
      }
    >({
      path: '/internal/knowledge/expand',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        instruction: input.instruction,
        current_content: input.currentContent,
        related_resources: input.indexedResources.map((resource) => ({
          identity_id: resource.identityId,
          repository_id: resource.repositoryId,
          resource_id: resource.resourceId,
          resource_path: resource.resourcePath,
          title: resource.title,
          mime_type: resource.mimeType,
          content: resource.chunks.map((chunk) => chunk.content).join('\n\n'),
          metadata: resource.metadata,
        })),
        provider_config: {
          provider: input.providerConfig.provider,
          model: input.providerConfig.model,
          api_key: input.providerConfig.apiKey,
          base_url: input.providerConfig.baseUrl,
          temperature: input.providerConfig.temperature,
          max_tokens: input.providerConfig.maxTokens,
        },
        max_citations: input.maxCitations,
        request_id: input.requestId,
      },
    });

    return {
      expandedContent: payload.expanded_content,
      citations: (payload.citations ?? []).map((citation) => ({
        resourceId: citation.resource_id,
        resourcePath: citation.resource_path,
        title: citation.title,
        chunkIndex: citation.chunk_index,
        excerpt: citation.excerpt,
        score: citation.score,
      })),
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens:
          payload.usage?.total_tokens ??
          (payload.usage?.prompt_tokens ?? 0) +
            (payload.usage?.completion_tokens ?? 0),
      },
    };
  }

  async query(input: KnowledgeQueryInput): Promise<KnowledgeQueryResult> {
    const payload = await this.client.postJson<
      AIServiceKnowledgeQueryResponse,
      {
        question: string;
        indexed_resources: Array<{
          identity_id: string;
          repository_id: string;
          resource_id: string;
          resource_path: string;
          title?: string;
          mime_type: string;
          content_hash: string;
          summary: string;
          keywords: string[];
          embedding: number[];
          chunks: Array<{
            chunk_index: number;
            content: string;
            content_hash: string;
            start_offset: number;
            end_offset: number;
            heading_path: string[];
            keywords: string[];
            embedding: number[];
          }>;
          metadata: Record<string, unknown>;
        }>;
        provider_config: {
          provider: string;
          model: string;
          api_key: string;
          base_url?: string;
          temperature?: number;
          max_tokens?: number;
        };
        max_citations?: number;
        request_id?: string;
      }
    >({
      path: '/internal/knowledge/query',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        question: input.question,
        indexed_resources: input.indexedResources.map((resource) => ({
          identity_id: resource.identityId,
          repository_id: resource.repositoryId,
          resource_id: resource.resourceId,
          resource_path: resource.resourcePath,
          title: resource.title,
          mime_type: resource.mimeType,
          content_hash: resource.contentHash,
          summary: resource.summary,
          keywords: resource.keywords,
          embedding: resource.embedding,
          chunks: resource.chunks.map((chunk) => ({
            chunk_index: chunk.chunkIndex,
            content: chunk.content,
            content_hash: chunk.contentHash,
            start_offset: chunk.startOffset,
            end_offset: chunk.endOffset,
            heading_path: chunk.headingPath,
            keywords: chunk.keywords,
            embedding: chunk.embedding,
          })),
          metadata: resource.metadata,
        })),
        provider_config: {
          provider: input.providerConfig.provider,
          model: input.providerConfig.model,
          api_key: input.providerConfig.apiKey,
          base_url: input.providerConfig.baseUrl,
          temperature: input.providerConfig.temperature,
          max_tokens: input.providerConfig.maxTokens,
        },
        max_citations: input.maxCitations,
        request_id: input.requestId,
      },
    });

    return {
      answer: payload.answer,
      citations: (payload.citations ?? []).map((citation) => ({
        resourceId: citation.resource_id,
        resourcePath: citation.resource_path,
        title: citation.title,
        chunkIndex: citation.chunk_index,
        excerpt: citation.excerpt,
        score: citation.score,
      })),
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens:
          payload.usage?.total_tokens ??
          (payload.usage?.prompt_tokens ?? 0) +
            (payload.usage?.completion_tokens ?? 0),
      },
    };
  }
}
