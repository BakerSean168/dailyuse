import type {
  IKnowledgeNoteGenerationPort,
  KnowledgeNoteGenerationInput,
  KnowledgeNoteGenerationResult,
} from '../../application/ports';
import type { IModelGatewayPort } from '@dailyuse/contracts/ai';
import { CustomModelGateway } from '../model-gateway';
import {
  buildKnowledgeNotePrompt,
  buildKnowledgeNoteSystemPrompt,
} from './knowledge-note-prompt';

/**
 * Residual 337: knowledge note generation completions go through CustomModelGateway.
 */
export class DirectProviderKnowledgeNoteGenerationAdapter
  implements IKnowledgeNoteGenerationPort
{
  constructor(private readonly modelGateway: IModelGatewayPort = new CustomModelGateway()) {}

  async generate(input: KnowledgeNoteGenerationInput): Promise<KnowledgeNoteGenerationResult> {
    const completion = await this.modelGateway.complete({
      auth: {
        bindingId: `${input.providerConfig.provider}:${input.providerConfig.model}`,
        baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
        apiKey: input.providerConfig.apiKey,
      },
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
