import type {
  IKnowledgeNoteGenerationPort,
  KnowledgeNoteGenerationInput,
  KnowledgeNoteGenerationResult,
} from '../../application/ports';
import { OpenAICompatibleGateway } from '../gateways/openai-compatible.gateway';
import {
  buildKnowledgeNotePrompt,
  buildKnowledgeNoteSystemPrompt,
} from './knowledge-note-prompt';

export class DirectProviderKnowledgeNoteGenerationAdapter
  implements IKnowledgeNoteGenerationPort
{
  constructor(private readonly gateway: OpenAICompatibleGateway = new OpenAICompatibleGateway()) {}

  async generate(input: KnowledgeNoteGenerationInput): Promise<KnowledgeNoteGenerationResult> {
    const completion = await this.gateway.complete({
      baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
      apiKey: input.providerConfig.apiKey,
      model: input.providerConfig.model,
      temperature: input.providerConfig.temperature ?? 0.4,
      maxTokens: input.providerConfig.maxTokens,
      responseFormat: 'text',
      messages: [
        {
          role: 'system',
          content: buildKnowledgeNoteSystemPrompt(),
        },
        {
          role: 'user',
          content: buildKnowledgeNotePrompt({
            topic: input.topic,
            title: input.title,
          }),
        },
      ],
    });

    return {
      content: completion.content,
      usage: completion.usage,
    };
  }
}

