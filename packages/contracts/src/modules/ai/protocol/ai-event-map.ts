import type { AIConversationCreatedEvent } from '../domain/events/ai-conversation-created.event';
import type { AIConversationDeletedEvent } from '../domain/events/ai-conversation-deleted.event';
import type { AIConversationStatusChangedEvent } from '../domain/events/ai-conversation-status-changed.event';
import type { AIConversationUpdatedEvent } from '../domain/events/ai-conversation-updated.event';
import type { AIMessageAddedEvent } from '../domain/events/ai-message-added.event';
import type { AIProviderConfigCreatedEvent } from '../domain/events/ai-provider-config-created.event';
import type { AIProviderConfigModelsUpdatedEvent } from '../domain/events/ai-provider-config-models-updated.event';
import type { AIProviderConfigSetDefaultEvent } from '../domain/events/ai-provider-config-set-default.event';
import type { StreamMessageChunk, StreamMessageDonePayload } from '../api/ai-chat.dto';

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
