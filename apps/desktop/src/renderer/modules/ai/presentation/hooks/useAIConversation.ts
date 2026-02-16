/**
 * useAIConversation Hook
 *
 * AI 对话管理 Hook
 */

import { useState, useCallback } from 'react';
import { aiApplicationService } from '@dailyuse/ai/application-client';
import type { CreateConversationRequest, SendMessageRequest } from '@dailyuse/contracts/ai';

// Local type aliases for consistency with hook interface
type CreateConversationInput = CreateConversationRequest;
type ListConversationsInput = { page?: number; pageSize?: number; status?: string };
type SendMessageInput = SendMessageRequest;

// 使用推断类型，避免与 contracts 类型不匹配
type AIConversation = Awaited<ReturnType<typeof aiApplicationService.createConversation>>;
type AIMessage = Awaited<ReturnType<typeof aiApplicationService.sendMessage>>;

export interface AIConversationState {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  messages: AIMessage[];
  loading: boolean;
  loadingMessages: boolean;
  error: string | null;
}

export interface UseAIConversationReturn extends AIConversationState {
  // Conversation operations
  loadConversations: (input?: ListConversationsInput) => Promise<void>;
  createConversation: (input: CreateConversationInput) => Promise<AIConversation>;
  selectConversation: (conversationId: string) => Promise<void>;
  updateConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  closeConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  // Message operations
  sendMessage: (input: Omit<SendMessageInput, 'conversationId'>) => Promise<AIMessage>;
  deleteMessage: (messageId: string) => Promise<void>;
  clearCurrentConversation: () => void;
}

/**
 * AI 对话管理 Hook
 */
export function useAIConversation(): UseAIConversationReturn {
  const [state, setState] = useState<AIConversationState>({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    loadingMessages: false,
    error: null,
  });

  /**
   * 加载对话列表
   */
  const loadConversations = useCallback(async (input?: ListConversationsInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await aiApplicationService.listConversations(input);
      setState((prev) => ({
        ...prev,
        conversations: result.conversations,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载对话失败',
      }));
    }
  }, []);

  /**
   * 创建对话
   */
  const createConversation = useCallback(
    async (input: CreateConversationInput): Promise<AIConversation> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const conversation = await aiApplicationService.createConversation(input);
        setState((prev) => ({
          ...prev,
          conversations: [conversation, ...prev.conversations],
          currentConversation: conversation,
          messages: [],
          loading: false,
        }));
        return conversation;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : '创建对话失败',
        }));
        throw error;
      }
    },
    [],
  );

  /**
   * 选择对话
   */
  const selectConversation = useCallback(async (conversationId: string) => {
    setState((prev) => ({ ...prev, loadingMessages: true, error: null }));
    try {
      const [conversation, messagesResult] = await Promise.all([
        aiApplicationService.getConversation(conversationId),
        aiApplicationService.listMessages(conversationId),
      ]);
      setState((prev) => ({
        ...prev,
        currentConversation: conversation,
        messages: messagesResult.messages || [],
        loadingMessages: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingMessages: false,
        error: error instanceof Error ? error.message : '加载对话失败',
      }));
    }
  }, []);

  /**
   * 更新对话
   */
  const updateConversation = useCallback(async (id: string, title: string) => {
    try {
      const updated = await aiApplicationService.updateConversation(id, { title });
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) => (c.id === id ? updated : c)),
        currentConversation:
          prev.currentConversation?.id === id ? updated : prev.currentConversation,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '更新对话失败',
      }));
    }
  }, []);

  /**
   * 删除对话
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await aiApplicationService.deleteConversation(conversationId);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.filter((c) => c.id !== conversationId),
        currentConversation:
          prev.currentConversation?.id === conversationId ? null : prev.currentConversation,
        messages: prev.currentConversation?.id === conversationId ? [] : prev.messages,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '删除对话失败',
      }));
    }
  }, []);

  /**
   * 关闭对话
   */
  const closeConversation = useCallback(async (conversationId: string) => {
    try {
      const updated = await aiApplicationService.closeConversation(conversationId);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) => (c.id === conversationId ? updated : c)),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '关闭对话失败',
      }));
    }
  }, []);

  /**
   * 归档对话
   */
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      const updated = await aiApplicationService.archiveConversation(conversationId);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) => (c.id === conversationId ? updated : c)),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '归档对话失败',
      }));
    }
  }, []);

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (input: Omit<SendMessageInput, 'conversationId'>): Promise<AIMessage> => {
      if (!state.currentConversation) {
        throw new Error('没有选中的对话');
      }
      try {
        const message = await aiApplicationService.sendMessage({
          ...input,
          conversationId: state.currentConversation.id,
        });
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
        return message;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : '发送消息失败',
        }));
        throw error;
      }
    },
    [state.currentConversation],
  );

  /**
   * 删除消息
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await aiApplicationService.deleteMessage(messageId);
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== messageId),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : '删除消息失败',
      }));
    }
  }, []);

  /**
   * 清空当前对话
   */
  const clearCurrentConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversation: null,
      messages: [],
    }));
  }, []);

  return {
    ...state,
    loadConversations,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    closeConversation,
    archiveConversation,
    sendMessage,
    deleteMessage,
    clearCurrentConversation,
  };
}
