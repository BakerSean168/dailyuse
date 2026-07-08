import type {
  IKnowledgeNoteGenerationPort,
  KnowledgeNoteGenerationInput,
  KnowledgeNoteGenerationResult,
} from '../../application/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

interface AIServiceKnowledgeNoteGenerationResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

export class AIServiceKnowledgeNoteGenerationAdapter implements IKnowledgeNoteGenerationPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async generate(input: KnowledgeNoteGenerationInput): Promise<KnowledgeNoteGenerationResult> {
    const payload = await this.client.postJson<
      AIServiceKnowledgeNoteGenerationResponse,
      {
        topic: string;
        title?: string;
        provider_config: {
          provider: string;
          model: string;
          api_key: string;
          base_url?: string;
          temperature?: number;
          max_tokens?: number;
        };
        request_id?: string;
      }
    >({
      path: '/internal/workflows/knowledge-note',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        topic: input.topic,
        title: input.title,
        provider_config: {
          provider: input.providerConfig.provider,
          model: input.providerConfig.model,
          api_key: input.providerConfig.apiKey,
          base_url: input.providerConfig.baseUrl,
          temperature: input.providerConfig.temperature,
          max_tokens: input.providerConfig.maxTokens,
        },
        request_id: input.requestId,
      },
    });

    return {
      content: payload.content,
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens:
          payload.usage?.total_tokens ??
          (payload.usage?.prompt_tokens ?? 0) + (payload.usage?.completion_tokens ?? 0),
      },
    };
  }
}
