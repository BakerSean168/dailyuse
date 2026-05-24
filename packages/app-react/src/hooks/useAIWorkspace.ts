import { useEffect, useState } from 'react';

import {
  MessageRole,
  type AICapabilities,
  type AIConversationClientDTO,
  type AIProviderConfigClientDTO,
  type MessageClientDTO,
  type SendMessageReq,
} from '@dailyuse/contracts/ai';

import { useAppSession } from './useAppSession';
import { useAIService } from './useAIService';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'AI request failed';
}

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function useAIWorkspace() {
  const service = useAIService();
  const { isRemoteAuthenticated } = useAppSession();
  const [conversations, setConversations] = useState<AIConversationClientDTO[]>([]);
  const [activeConversation, setActiveConversation] = useState<AIConversationClientDTO | null>(
    null,
  );
  const [providers, setProviders] = useState<AIProviderConfigClientDTO[]>([]);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [streamMode, setStreamMode] = useState(true);
  const [isLoading, setIsLoading] = useState(isRemoteAuthenticated);
  const [isMutating, setIsMutating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resolveSelectedProvider(
    nextProviders: AIProviderConfigClientDTO[],
    preferredProviderId?: string | null,
  ) {
    const preferred =
      nextProviders.find((provider) => String(provider.id) === String(preferredProviderId)) ??
      nextProviders.find((provider) => String(provider.id) === String(selectedProviderId)) ??
      nextProviders.find((provider) => provider.isDefault) ??
      nextProviders[0] ??
      null;

    setSelectedProviderId(preferred ? String(preferred.id) : null);
    setSelectedModel(preferred?.defaultModel ?? null);
  }

  async function loadConversation(id: string) {
    try {
      const conversation = await service.getConversation(id);
      setActiveConversation(conversation);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  async function loadWorkspace(preferredConversationId?: string | null) {
    if (!isRemoteAuthenticated) {
      setConversations([]);
      setActiveConversation(null);
      setProviders([]);
      setCapabilities(null);
      setSelectedProviderId(null);
      setSelectedModel(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [list, nextProviders, nextCapabilities] = await Promise.all([
        service.listConversations({ page: 1, pageSize: 20 }),
        service.listProviders(),
        service.getCapabilities(),
      ]);

      setConversations(list.data);
      setProviders(nextProviders);
      setCapabilities(nextCapabilities);
      resolveSelectedProvider(nextProviders);

      const targetId =
        preferredConversationId ?? activeConversation?.id ?? list.data[0]?.id ?? null;
      if (targetId) {
        const conversation = await service.getConversation(String(targetId));
        setActiveConversation(conversation);
      } else {
        setActiveConversation(null);
      }
    } catch (loadError) {
      setConversations([]);
      setActiveConversation(null);
      setProviders([]);
      setCapabilities(null);
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [isRemoteAuthenticated]);

  async function refresh() {
    await loadWorkspace();
  }

  async function createConversation(name: string) {
    setIsMutating(true);
    setError(null);

    try {
      const conversation = await service.createConversation({ name });
      await loadWorkspace(String(conversation.id));
      return conversation;
    } catch (createError) {
      setError(getErrorMessage(createError));
      return null;
    } finally {
      setIsMutating(false);
    }
  }

  async function selectConversation(id: string) {
    setIsMutating(true);
    setError(null);

    try {
      await loadConversation(id);
      return true;
    } catch (selectError) {
      setError(getErrorMessage(selectError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function makeDefaultProvider(providerId: string) {
    setIsMutating(true);
    setError(null);

    try {
      await service.setDefaultProvider(providerId);
      const nextProviders = await service.listProviders();
      setProviders(nextProviders);
      resolveSelectedProvider(nextProviders, providerId);
      return true;
    } catch (providerError) {
      setError(getErrorMessage(providerError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function sendMessage(content: string) {
    setIsMutating(true);
    setError(null);

    try {
      const conversation =
        activeConversation ??
        (await service.createConversation({
          name: content.slice(0, 40) || 'New conversation',
        }));

      const request: SendMessageReq = {
        conversationId: conversation.id as SendMessageReq['conversationId'],
        content,
        providerId: selectedProviderId
          ? (selectedProviderId as SendMessageReq['providerId'])
          : undefined,
        model: selectedModel ?? undefined,
      };

      if (streamMode) {
        const timestamp = Date.now();
        const userMessage: MessageClientDTO = {
          id: `draft-user-${timestamp}` as MessageClientDTO['id'],
          conversationId: conversation.id,
          role: MessageRole.User,
          content,
          tokenCount: null,
          version: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          deletedAt: null,
          isUser: true,
          isAssistant: false,
          isSystem: false,
          formattedTime: formatMessageTime(timestamp),
        };
        const assistantMessage: MessageClientDTO = {
          id: `draft-assistant-${timestamp}` as MessageClientDTO['id'],
          conversationId: conversation.id,
          role: MessageRole.Assistant,
          content: '',
          tokenCount: null,
          version: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          deletedAt: null,
          isUser: false,
          isAssistant: true,
          isSystem: false,
          formattedTime: formatMessageTime(timestamp),
        };

        const optimisticConversation: AIConversationClientDTO = {
          ...conversation,
          lastMessageAt: timestamp,
          messageCount: conversation.messageCount + 2,
          messages: [...(conversation.messages ?? []), userMessage, assistantMessage],
        };

        setActiveConversation(optimisticConversation);
        setIsStreaming(true);

        const controller = new AbortController();
        await service.streamMessage(
          request,
          {
            onChunk: (chunk) => {
              setActiveConversation((current) => {
                if (!current?.messages || current.messages.length === 0) {
                  return current;
                }

                const nextMessages = [...current.messages];
                const lastMessage = nextMessages[nextMessages.length - 1];
                if (!lastMessage || !lastMessage.isAssistant) {
                  return current;
                }

                nextMessages[nextMessages.length - 1] = {
                  ...lastMessage,
                  content: `${lastMessage.content}${chunk.content}`,
                };

                return {
                  ...current,
                  messages: nextMessages,
                };
              });
            },
          },
          controller.signal,
        );

        setIsStreaming(false);
        await loadWorkspace(String(conversation.id));
        return true;
      }

      await service.sendMessage(request);
      await loadWorkspace(String(conversation.id));
      return true;
    } catch (sendError) {
      setIsStreaming(false);
      setError(getErrorMessage(sendError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  return {
    activeConversation,
    capabilities,
    conversations,
    createConversation,
    error,
    isLoading,
    isMutating,
    isRemoteAuthenticated,
    isStreaming,
    makeDefaultProvider,
    providers,
    refresh,
    selectConversation,
    selectedModel,
    selectedProviderId,
    sendMessage,
    setSelectedModel,
    setSelectedProviderId,
    setStreamMode,
    streamMode,
  };
}
