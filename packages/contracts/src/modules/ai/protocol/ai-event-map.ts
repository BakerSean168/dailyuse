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

export type AIEventMap = {
  'ai.conversation.created': AIConversationCreatedEvent;
  'ai.conversation.updated': AIConversationUpdatedEvent;
  'ai.conversation.status_changed': AIConversationStatusChangedEvent;
  'ai.conversation.deleted': AIConversationDeletedEvent;
  'ai.message.added': AIMessageAddedEvent;
  'ai.provider_config.created': AIProviderConfigCreatedEvent;
  'ai.provider_config.models_updated': AIProviderConfigModelsUpdatedEvent;
  'ai.provider_config.set_default': AIProviderConfigSetDefaultEvent;
};
