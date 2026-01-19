/**
 * AI Store - Pinia 状态管理
 * 管理 AI 模块的所有状态
 */

import { defineStore } from 'pinia';
import type { ConversationDTO, MessageDTO } from '@dailyuse/contracts/ai';

export interface AIState {
  conversations: ConversationDTO[];
  currentConversation: ConversationDTO | null;
  messages: MessageDTO[];
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
}

export const useAIStore = defineStore('ai', {
  state: (): AIState => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    error: null,
    isGenerating: false,
  }),

  getters: {
    getConversationById: (state) => (id: string) => state.conversations.find((c) => c.id === id),

    getTotalConversations: (state) => state.conversations.length,

    getCurrentMessages: (state) => state.messages,
  },

  actions: {
    setConversations(conversations: ConversationDTO[]) {
      this.conversations = conversations;
    },

    addConversation(conversation: ConversationDTO) {
      this.conversations.push(conversation);
    },

    updateConversation(conversation: ConversationDTO) {
      const idx = this.conversations.findIndex((c) => c.id === conversation.id);
      if (idx !== -1) this.conversations[idx] = conversation;
    },

    deleteConversation(id: string) {
      this.conversations = this.conversations.filter((c) => c.id !== id);
    },

    setCurrentConversation(conversation: ConversationDTO | null) {
      this.currentConversation = conversation;
    },

    setMessages(messages: MessageDTO[]) {
      this.messages = messages;
    },

    addMessage(message: MessageDTO) {
      this.messages.push(message);
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setGenerating(generating: boolean) {
      this.isGenerating = generating;
    },

    setError(error: string | null) {
      this.error = error;
    },

    reset() {
      this.conversations = [];
      this.currentConversation = null;
      this.messages = [];
      this.isLoading = false;
      this.error = null;
      this.isGenerating = false;
    },
  },

  persist: {
    paths: [],
  },
});
