/**
 * AI Store - Zustand 状态管理
 *
 * 使用 domain-client 中的 Entity 类型存储数据
 * 持久化时转换为 DTO，加载时恢复为 Entity
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AIConversation, AIMessage } from '@dailyuse/domain-client/ai';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
import { aiApplicationService } from '@dailyuse/application-client/ai';

// ============ Types ============
export interface AIState {
  conversations: AIConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  streamingMessage: string | null;
}

export interface AIActions {
  setConversations: (conversations: AIConversation[]) => void;
  addConversation: (conversation: AIConversation) => void;
  updateConversation: (id: string, conversation: AIConversation) => void;
  removeConversation: (id: string) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingMessage: (message: string | null) => void;

  // Chat actions
  sendMessage: (content: string) => Promise<void>;
  createNewConversation: () => Promise<string>;
  clearConversation: (id: string) => void;
}

export interface AISelectors {
  getActiveConversation: () => AIConversation | undefined;
  getConversationById: (id: string) => AIConversation | undefined;
}

type AIStore = AIState & AIActions & AISelectors;

const initialState: AIState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
  streamingMessage: null,
};

// ============ Store ============
export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConversations: (conversations) => set({ conversations }),

      addConversation: (conversation) =>
        set((state) => ({
          conversations: [...state.conversations, conversation],
        })),

      updateConversation: (id, conversation) =>
        set((state) => ({
          conversations: state.conversations.map((c) => (c.uuid === id ? conversation : c)),
        })),

      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.uuid !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        })),

      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setStreamingMessage: (streamingMessage) => set({ streamingMessage }),

      sendMessage: async (content) => {
        const state = get();
        let conversationId = state.activeConversationId;

        // Create new conversation if none active
        if (!conversationId) {
          conversationId = await state.createNewConversation();
        }

        set({ isLoading: true, error: null });

        try {
          // Send message via aiApplicationService
          const response = await aiApplicationService.sendMessage({
            conversationUuid: conversationId,
            content,
          });

          // Refresh conversation to get updated messages
          const updatedConversation = await aiApplicationService.getConversation(conversationId);
          if (updatedConversation) {
            // Store Entity directly
            state.updateConversation(conversationId, updatedConversation);
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'AI request failed' });
        } finally {
          set({ isLoading: false });
        }
      },

      createNewConversation: async () => {
        try {
          const conversation = await aiApplicationService.createConversation({
            title: '新对话',
          });

          // Store Entity directly
          get().addConversation(conversation);
          set({ activeConversationId: conversation.uuid });
          return conversation.uuid;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create conversation' });
          throw error;
        }
      },

      clearConversation: (id) => {
        const conversation = get().getConversationById(id);
        if (conversation) {
          // Create a new conversation entity with empty messages
          const clearedConversation = AIConversation.fromClientDTO({
            ...conversation.toClientDTO(),
            messages: [],
          });
          get().updateConversation(id, clearedConversation);
        }
      },

      // Selectors
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.uuid === activeConversationId);
      },

      getConversationById: (id) => {
        return get().conversations.find((c) => c.uuid === id);
      },
    }),
    {
      name: 'ai-store',
      storage: createJSONStorage(() => localStorage, {
        reviver: (_key, value) => value,
        replacer: (_key, value) => value,
      }),
      partialize: (state) => ({
        // Convert Entities to DTOs for persistence
        conversations: state.conversations.map((c) => c.toClientDTO()),
        activeConversationId: state.activeConversationId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert DTOs back to Entities after loading from storage
          const rawConversations = state.conversations as unknown as AIConversationClientDTO[];
          state.conversations = rawConversations.map((dto) => AIConversation.fromClientDTO(dto));
        }
      },
    },
  ),
);

export const useConversations = () => useAIStore((state) => state.conversations);
export const useActiveConversation = () => useAIStore((state) => state.getActiveConversation());
