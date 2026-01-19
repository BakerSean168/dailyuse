import { ref, computed } from 'vue';
import type { Conversation, ConversationGroup, DateGroup } from '../types/conversation';
import { ListConversations, DeleteConversation } from '@dailyuse/application-client/ai';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

// Conversation history management (migrated from legacy ai-chat module)
const conversations = ref<Conversation[]>([]);
const activeConversationUuid = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

function groupByDate(convs: Conversation[]): ConversationGroup[] {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const groups: Record<DateGroup, Conversation[]> = {
    today: [],
    yesterday: [],
    week: [],
    month: [],
    older: [],
  };
  convs.forEach((conv) => {
    const age = now - conv.updatedAt;
    if (age < oneDayMs) groups.today.push(conv);
    else if (age < 2 * oneDayMs) groups.yesterday.push(conv);
    else if (age < 7 * oneDayMs) groups.week.push(conv);
    else if (age < 30 * oneDayMs) groups.month.push(conv);
    else groups.older.push(conv);
  });
  const labels: Record<DateGroup, string> = {
    today: '今天',
    yesterday: '昨天',
    week: '过去 7 天',
    month: '过去 30 天',
    older: '更早',
  };
  const result: ConversationGroup[] = [];
  (Object.keys(groups) as DateGroup[]).forEach((key) => {
    if (groups[key].length) result.push({ label: labels[key], conversations: groups[key] });
  });
  return result;
}

export function useConversationHistory() {
  const { success: showSuccess, error: showError } = getGlobalMessage();
  const groupedConversations = computed(() => groupByDate(conversations.value));
  async function fetchConversations(page = 1, limit = 50) {
    isLoading.value = true;
    error.value = null;
    try {
      const list = await new ListConversations().execute({ page, limit });
      conversations.value = list.map((conv) => ({
        conversationUuid: conv.uuid,
        accountUuid: conv.accountUuid,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.lastMessageAt || conv.updatedAt,
        messageCount: conv.messageCount,
        lastMessagePreview: `${conv.messageCount} messages`,
      }));
    } catch (e: any) {
      const errorMsg = e.message || '加载对话历史失败';
      error.value = errorMsg;
      showError(errorMsg);
    } finally {
      isLoading.value = false;
    }
  }
  function selectConversation(uuid: string) {
    activeConversationUuid.value = uuid;
  }
  function createNewConversation() {
    activeConversationUuid.value = null;
  }
  async function deleteConversation(uuid: string) {
    try {
      await new DeleteConversation().execute(uuid);
      conversations.value = conversations.value.filter((c) => c.conversationUuid !== uuid);
      if (activeConversationUuid.value === uuid) activeConversationUuid.value = null;
      showSuccess('对话已删除');
    } catch (e: any) {
      const errorMsg = e.message || '删除对话失败';
      error.value = errorMsg;
      showError(errorMsg);
      throw e;
    }
  }
  function reset() {
    conversations.value = [];
    activeConversationUuid.value = null;
    isLoading.value = false;
    error.value = null;
  }
  return {
    conversations: computed(() => conversations.value),
    groupedConversations,
    activeConversationUuid: computed(() => activeConversationUuid.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    reset,
  };
}
