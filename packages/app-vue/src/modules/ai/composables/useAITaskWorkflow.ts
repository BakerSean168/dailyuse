/**
 * Residual 431: product start path for AgentType task.create.
 * Host proposal + client createTemplate settle own mutation (residual 423–425).
 * Full Task LangGraph workflow is not claimed here.
 */

import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@dailyuse/contracts/result';
import type { AgentRunResult, AgentStartRunClientRequest } from '@dailyuse/contracts/ai';
import type { AIChatService, ChatModelOption, ChatItem } from './types';
import { getAIErrorMessage } from './error';
import { toast } from 'vue-sonner';

export type UseAITaskWorkflowOptions = {
  service: Pick<AIChatService, 'startAgentRun'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatConversationId: Ref<string>;
  chatLoading: Ref<boolean>;
  chatTimeline: Ref<ChatItem[]>;
  conversationTitle: Ref<string>;
  hasWorkflowUserMessages: Ref<boolean>;
  buildConversationTranscript: () => string;
  scrollMessagesToBottom: () => void;
  /** Dedicated session field setter from useAIChatView. */
  syncTaskAgentRun: (result: AgentRunResult) => void;
  taskAgentRun: Ref<AgentRunResult | null>;
};

function createAgentId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAITaskWorkflow(options: UseAITaskWorkflowOptions) {
  const { t, locale } = useI18n();
  const taskAgentLoading = ref(false);

  const canRunTaskAgent = computed(
    () =>
      options.selectedModel.value !== null &&
      !options.chatLoading.value &&
      !taskAgentLoading.value &&
      (options.hasWorkflowUserMessages.value ||
        options.buildConversationTranscript().trim().length > 0 ||
        options.conversationTitle.value.trim().length > 0),
  );

  async function startTaskAgentRun() {
    if (!canRunTaskAgent.value) return;
    taskAgentLoading.value = true;
    try {
      const selectedModel = options.selectedModel.value;
      const transcript = options.buildConversationTranscript().trim();
      const idea =
        transcript ||
        options.conversationTitle.value.trim() ||
        t('aiAssistant.chatPage.shortcuts.taskCreate.prefill');
      const request: AgentStartRunClientRequest = {
        runId: createAgentId('run'),
        threadId: createAgentId('thread'),
        conversationId: options.chatConversationId.value || null,
        agentType: 'task.create',
        locale: locale.value === 'en-US' ? 'en-US' : 'zh-CN',
        input: {
          idea,
          title: idea,
          conversationTitle: options.conversationTitle.value,
          ...(selectedModel
            ? {
                provider_id: selectedModel.providerId,
                model: selectedModel.modelId,
              }
            : {}),
        },
      };

      const result = unwrap(await options.service.startAgentRun(request));
      options.syncTaskAgentRun(result);
      toast.success(t('aiAssistant.dialogs.agent.started'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.startFailed'));
    } finally {
      taskAgentLoading.value = false;
    }
  }

  return {
    taskAgentLoading,
    canRunTaskAgent,
    startTaskAgentRun,
  };
}
