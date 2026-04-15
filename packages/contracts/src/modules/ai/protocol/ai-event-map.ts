import type {
  AIConversationCreatedEvent,
  AIConversationDeletedEvent,
  AIConversationStatusChangedEvent,
  AIConversationUpdatedEvent,
  AIMessageAddedEvent,
  AIProviderConfigCreatedEvent,
  AIProviderConfigModelsUpdatedEvent,
  AIProviderConfigSetDefaultEvent,
} from '../domain/events';
import type { StreamMessageChunk, StreamMessageDonePayload } from '../api';

export type AIEventMap = {
  'ai.conversation.created': AIConversationCreatedEvent;
  'ai.conversation.updated': AIConversationUpdatedEvent;
  'ai.conversation.status_changed': AIConversationStatusChangedEvent;
  'ai.conversation.deleted': AIConversationDeletedEvent;
  'ai.message.added': AIMessageAddedEvent;
  'ai.provider_config.created': AIProviderConfigCreatedEvent;
  'ai.provider_config.models_updated': AIProviderConfigModelsUpdatedEvent;
  'ai.provider_config.set_default': AIProviderConfigSetDefaultEvent;
  'ai:chat:message:stream:chunk': { streamId: string; chunk: StreamMessageChunk };
  'ai:chat:message:stream:done': { streamId: string; result: StreamMessageDonePayload };
  'ai:chat:message:stream:error': {
    streamId: string;
    code: string;
    message: string;
    details?: unknown;
  };
};
