/**
 * Residual 431/433/437: product path for AgentType task.create.
 * Residual 433: optional linked goalId at start; session restore owned by useAIChatView.
 * Residual 437: process-local cancel/complete resume after Host lifecycle decisions.
 * Host proposal + client createTemplate settle own mutation (residual 423–425).
 * Full Task LangGraph workflow is not claimed here.
 */

import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { unwrap } from '@dailyuse/contracts/result';
import type {
  AgentExecutedAction,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import type { AIChatService, ChatModelOption, ChatItem } from './types';
import { getAIErrorMessage } from './error';
import { toast } from 'vue-sonner';

export type UseAITaskWorkflowOptions = {
  service: Pick<AIChatService, 'startAgentRun' | 'resumeAgentRun'>;
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
  const taskAgentResuming = ref(false);
  /** Residual 433: optional goal link applied to create_task_template payload on start. */
  const linkedGoalId = ref<string | null>(null);

  const canRunTaskAgent = computed(
    () =>
      options.selectedModel.value !== null &&
      !options.chatLoading.value &&
      !taskAgentLoading.value &&
      !taskAgentResuming.value &&
      (options.hasWorkflowUserMessages.value ||
        options.buildConversationTranscript().trim().length > 0 ||
        options.conversationTitle.value.trim().length > 0),
  );

  function setLinkedGoalId(goalId: string | null | undefined) {
    const next =
      typeof goalId === 'string' && goalId.trim().length > 0 ? goalId.trim() : null;
    linkedGoalId.value = next;
  }

  function resetTaskWorkflowLocalState() {
    linkedGoalId.value = null;
    taskAgentLoading.value = false;
    taskAgentResuming.value = false;
  }

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
      const goalId = linkedGoalId.value;
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
          ...(goalId ? { goalId } : {}),
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

  /**
   * Residual 437: cancel Host task.create run (process-local resume → cancelled).
   * Host ProposalKernel reject should run first when coming from workbench.
   */
  async function cancelTaskAgentRun(hostOptions?: {
    skipHostLifecycle?: boolean;
    revision?: number;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    taskAgentResuming.value = true;
    try {
      const payload: AgentResumePayload = { userDecision: 'cancel' };
      const result = unwrap(await options.service.resumeAgentRun(run.run.runId, payload));
      options.syncTaskAgentRun(result);
      toast.success(t('aiAssistant.dialogs.agent.cancelled'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      taskAgentResuming.value = false;
    }
  }

  /**
   * Residual 437: mark process-local task.create run completed after client createTemplate.
   * Domain mutation already happened; this only records settlement for getRun/list/reopen.
   */
  async function completeTaskAgentRun(hostOptions?: {
    templateId?: string | null;
    title?: string;
    goalId?: string | null;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    taskAgentResuming.value = true;
    try {
      const templateId =
        typeof hostOptions?.templateId === 'string' && hostOptions.templateId.trim()
          ? hostOptions.templateId.trim()
          : undefined;
      const title =
        typeof hostOptions?.title === 'string' && hostOptions.title.trim()
          ? hostOptions.title.trim()
          : undefined;
      const goalId =
        typeof hostOptions?.goalId === 'string' && hostOptions.goalId.trim()
          ? hostOptions.goalId.trim()
          : undefined;

      const pending = run.state.pendingActions[0] ?? run.state.approvedActions[0];
      const payloadBase: Record<string, unknown> = {
        ...(pending?.payload ?? {}),
      };
      if (title) payloadBase['title'] = title;
      if (goalId) payloadBase['goalId'] = goalId;

      const approvedActions = pending
        ? [
            {
              ...pending,
              payload: payloadBase,
            },
          ]
        : undefined;

      const executedActions: AgentExecutedAction[] = [
        {
          tool: 'create_task_template',
          status: 'executed',
          message: goalId
            ? `Created task template · linked goal ${goalId}`
            : 'Created task template',
          ...(templateId ? { entityId: templateId } : {}),
          data: payloadBase,
        },
      ];

      const payload: AgentResumePayload = {
        userDecision: 'confirm',
        ...(approvedActions ? { approvedActions } : {}),
        executedActions,
      };
      const result = unwrap(await options.service.resumeAgentRun(run.run.runId, payload));
      options.syncTaskAgentRun(result);
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      taskAgentResuming.value = false;
    }
  }

  return {
    taskAgentLoading,
    taskAgentResuming,
    linkedGoalId,
    canRunTaskAgent,
    setLinkedGoalId,
    resetTaskWorkflowLocalState,
    startTaskAgentRun,
    cancelTaskAgentRun,
    completeTaskAgentRun,
  };
}
