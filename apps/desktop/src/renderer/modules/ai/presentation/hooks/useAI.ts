/**
 * useAI Hook
 *
 * AI 对话管理 Hook
 * Story-009: AI Module UI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiApplicationService } from '@dailyuse/ai/application-client';
import type { AIConversation, AIMessage } from '@dailyuse/ai/domain-client';
import { MessageRole } from '@dailyuse/contracts/ai';

// Chat message for UI display
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface AIState {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  streaming: boolean;
  error: string | null;
}

interface UseAIReturn extends AIState {
  // Conversation management
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<AIConversation>;
  selectConversation: (uuid: string) => Promise<void>;
  closeConversation: (uuid: string) => Promise<void>;
  deleteConversation: (uuid: string) => Promise<void>;

  // Messages
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;

  // Utilities
  clearError: () => void;
}

export function useAI(): UseAIReturn {
  const [state, setState] = useState<AIState>({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    streaming: false,
    error: null,
  });

  // AbortController for streaming
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await aiApplicationService.listConversations({ pageSize: 50 });
      setState((prev) => ({
        ...prev,
        conversations: response.conversations || [],
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载对话列表失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (title?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const conversation = await aiApplicationService.createConversation({
        title: title || `对话 ${new Date().toLocaleString('zh-CN')}`,
      });
      setState((prev) => ({
        ...prev,
        conversations: [conversation, ...prev.conversations],
        currentConversation: conversation,
        messages: [],
        loading: false,
      }));
      return conversation;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建对话失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw e;
    }
  }, []);

  // Select and load a conversation
  const selectConversation = useCallback(async (uuid: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const conversation = await aiApplicationService.getConversation(uuid);
      const messagesResponse = await aiApplicationService.listMessages(uuid, { pageSize: 100 });

      // Convert to ChatMessage format
      const chatMessages: ChatMessage[] = (messagesResponse.messages || []).map(
        (msg: AIMessage) => {
          // Map MessageRole enum to lowercase string using entity methods
          let role: 'user' | 'assistant' | 'system' = 'user';
          if (msg.isUserMessage()) role = 'user';
          else if (msg.isAssistantMessage()) role = 'assistant';
          else if (msg.isSystemMessage()) role = 'system';

          return {
            id: msg.uuid,
            role,
            content: msg.content,
            timestamp: msg.createdAt,
            isStreaming: false,
          };
        },
      );

      setState((prev) => ({
        ...prev,
        currentConversation: conversation,
        messages: chatMessages,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载对话失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Close conversation
  const closeConversation = useCallback(async (uuid: string) => {
    try {
      const closedConversation = await aiApplicationService.closeConversation(uuid);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) => (c.uuid === uuid ? closedConversation : c)),
        currentConversation:
          prev.currentConversation?.uuid === uuid ? closedConversation : prev.currentConversation,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '关闭对话失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (uuid: string) => {
    try {
      await aiApplicationService.deleteConversation(uuid);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.filter((c) => c.uuid !== uuid),
        currentConversation:
          prev.currentConversation?.uuid === uuid ? null : prev.currentConversation,
        messages: prev.currentConversation?.uuid === uuid ? [] : prev.messages,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除对话失败';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        streaming: true,
        error: null,
      }));

      try {
        // Check if we have a current conversation, if not create one
        let conversationUuid = state.currentConversation?.uuid;
        if (!conversationUuid) {
          const newConversation = await aiApplicationService.createConversation({
            title: content.slice(0, 50),
          });
          conversationUuid = newConversation.uuid;
          setState((prev) => ({
            ...prev,
            currentConversation: newConversation,
            conversations: [newConversation, ...prev.conversations],
          }));
        }

        // Try streaming first, fall back to regular send
        try {
          const stream = aiApplicationService.streamChat({
            conversationUuid,
            message: content.trim(),
          });

          let fullContent = '';
          for await (const chunk of stream) {
            if (abortControllerRef.current?.signal.aborted) break;

            fullContent += chunk.delta || '';
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === assistantMessage.id ? { ...msg, content: fullContent } : msg,
              ),
            }));
          }

          // Mark streaming complete
          setState((prev) => ({
            ...prev,
            streaming: false,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg,
            ),
          }));
        } catch {
          // Fallback to non-streaming
          const response = await aiApplicationService.sendMessage({
            conversationUuid,
            content: content.trim(),
          });

          setState((prev) => ({
            ...prev,
            streaming: false,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    id: response.uuid,
                    content: response.content,
                    isStreaming: false,
                  }
                : msg,
            ),
          }));
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '发送消息失败';
        setState((prev) => ({
          ...prev,
          streaming: false,
          error: errorMessage,
          messages: prev.messages.filter((msg) => msg.id !== assistantMessage.id),
        }));
      }
    },
    [state.currentConversation?.uuid],
  );

  // Clear messages (new conversation)
  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      currentConversation: null,
      messages: [],
      streaming: false,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    messages: state.messages,
    loading: state.loading,
    streaming: state.streaming,
    error: state.error,
    loadConversations,
    createConversation,
    selectConversation,
    closeConversation,
    deleteConversation,
    sendMessage,
    clearMessages,
    clearError,
  };
}

export default useAI;
