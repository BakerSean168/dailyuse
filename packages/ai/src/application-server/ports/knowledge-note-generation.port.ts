import type {
  ChatExecutionProviderConfig,
  ChatExecutionUsage,
} from './chat-execution.port';

export interface KnowledgeNoteGenerationInput {
  identityId: string;
  providerConfig: ChatExecutionProviderConfig;
  topic: string;
  title?: string;
  requestId?: string;
}

export interface KnowledgeNoteGenerationResult {
  content: string;
  usage: ChatExecutionUsage;
}

export interface IKnowledgeNoteGenerationPort {
  generate(input: KnowledgeNoteGenerationInput): Promise<KnowledgeNoteGenerationResult>;
}
