/**
 * Residual 431/433/437/439/445/461: product path for AgentType task.create.
 * Residual 433: optional linked goalId at start; session restore owned by useAIChatView.
 * Residual 437: process-local cancel/complete resume after Host lifecycle decisions.
 * Residual 439: process-local edit revise after Host proposal revise.
 * Residual 445: re-align linkedGoalId from restored/synced taskAgentRun.
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
import { applyHostTaskPatchToAgentActions, resolveLinkedGoalIdFromTaskAgentRun } from './hostProposalLifecycle';
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
      // Residual 461: require session conversation for process-local restore/history reopen.
      Boolean(options.chatConversationId.value?.trim()) &&
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

  /**
   * Residual 445: re-align ActionBar linked goal from task.create AgentRun snapshot
   * (conversation restore / process-local getRun refresh / history reopen).
   */
  function syncLinkedGoalFromTaskAgentRun(result: AgentRunResult | null | undefined) {
    linkedGoalId.value = resolveLinkedGoalIdFromTaskAgentRun(result);
  }

  function resetTaskWorkflowLocalState() {
    linkedGoalId.value = null;
    taskAgentLoading.value = false;
    taskAgentResuming.value = false;
  }

  async function startTaskAgentRun() {
    if (!canRunTaskAgent.value) return;
    // Residual 461: double-gate session binding (Host also fail-closed).
    const conversationId = options.chatConversationId.value?.trim();
    if (!conversationId) return;
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
        conversationId,
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
   * Residual 437/453/463/465: mark process-local task.create run completed after client createTemplate.
   * Domain mutation already happened; Host confirm requires these executedActions (no Host default),
   * a recoverable settlement title in data (residual 463), and a non-empty template entity id
   * (residual 465) for receipt deep-link / reopen.
   * This only records settlement for getRun/list/reopen.
   */
  async function completeTaskAgentRun(hostOptions?: {
    templateId?: string | null;
    title?: string;
    goalId?: string | null;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    // Residual 465: product confirm needs domain template id for Host settlement deep-link.
    const templateId =
      typeof hostOptions?.templateId === 'string' && hostOptions.templateId.trim()
        ? hostOptions.templateId.trim()
        : undefined;
    if (!templateId) return;
    taskAgentResuming.value = true;
    try {
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
      // Residual 465: always stamp domain template id into settlement data + entityId.
      payloadBase['templateId'] = templateId;
      payloadBase['entityId'] = templateId;

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
          entityId: templateId,
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

  /**
   * Residual 439/455: Host revise → process-local edit resume (stay waiting_approval).
   * Patches create_task_template pendingActions so getRun/selectAgentRun reopen revised draft.
   * Residual 455: blank title revise is refused client-side (Host also fail-closed).
   */
  async function reviseTaskAgentRun(hostOptions?: {
    title?: string;
    goalId?: string | null;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    if (run.run.status !== 'waiting_approval') return;
    // Residual 455: do not submit blank revise (Host rejects; avoid noisy VALIDATION_ERROR).
    if (typeof hostOptions?.title === 'string' && !hostOptions.title.trim()) return;
    taskAgentResuming.value = true;
    try {
      const baseActions =
        run.state.pendingActions.length > 0
          ? run.state.pendingActions
          : run.state.approvedActions;
      const approvedActions = applyHostTaskPatchToAgentActions(baseActions, {
        title: hostOptions?.title,
        goalId: hostOptions?.goalId,
      });
      const payload: AgentResumePayload = {
        userDecision: 'edit',
        approvedActions,
      };
      const result = unwrap(await options.service.resumeAgentRun(run.run.runId, payload));
      options.syncTaskAgentRun(result);
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
    syncLinkedGoalFromTaskAgentRun,
    resetTaskWorkflowLocalState,
    startTaskAgentRun,
    cancelTaskAgentRun,
    completeTaskAgentRun,
    reviseTaskAgentRun,
  };
}
