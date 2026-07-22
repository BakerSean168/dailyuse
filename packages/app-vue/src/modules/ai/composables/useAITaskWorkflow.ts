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
   * Residual 437/477: cancel Host task.create run (process-local resume → cancelled).
   * Host ProposalKernel reject should run first when coming from workbench.
   * Residual 477: only cancel from waiting_approval (Host also fail-closed).
   */
  async function cancelTaskAgentRun(hostOptions?: {
    skipHostLifecycle?: boolean;
    revision?: number;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    // Residual 477: product cancel only from waiting_approval.
    if (run.run.status !== 'waiting_approval') return;
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
   * Residual 437/453/463/465/467/469/471/475/489: mark process-local task.create run completed after client createTemplate.
   * Domain mutation already happened; Host confirm requires these executedActions (no Host default),
   * a recoverable settlement title in data (residual 463), a non-empty template entity id
   * (residual 465) for receipt deep-link / reopen, and must not rebind approved goalId/title
   * (residual 467/469). Residual 471: do not send approvedActions on confirm — process-local
   * draft is Host source of truth (edit is the only revise path).
   * Residual 489: only complete from waiting_approval (Host residual 475 also fail-closed).
   * This only records settlement for getRun/list/reopen.
   */
  async function completeTaskAgentRun(hostOptions?: {
    templateId?: string | null;
    title?: string;
    goalId?: string | null;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    // Residual 489: product confirm only from waiting_approval (symmetric cancel/edit).
    if (run.run.status !== 'waiting_approval') return;
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
      // Residual 471: settlement data may carry title/goalId for display, but Host draft
      // comes from process-local pending/approved only (ignore client approvedActions).
      const payloadBase: Record<string, unknown> = {
        ...(pending?.payload ?? {}),
      };
      // Residual 469: title stamp must match approved draft (Host fail-closes on rebind).
      if (title) payloadBase['title'] = title;
      // Residual 467: optional goalId stamp; Host fail-closes on approved-draft rebind.
      if (goalId) payloadBase['goalId'] = goalId;
      // Residual 465: always stamp domain template id into settlement data + entityId.
      payloadBase['templateId'] = templateId;
      payloadBase['entityId'] = templateId;

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

      // Residual 471: confirm payload is executedActions settlement only (no draft revise).
      const payload: AgentResumePayload = {
        userDecision: 'confirm',
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
   * Residual 439/455/473/475/481: Host revise → process-local edit resume (stay waiting_approval).
   * Residual 481: only revise from waiting_approval (Host also fail-closed).
   * Patches create_task_template pendingActions so getRun/selectAgentRun reopen revised draft.
   * Residual 455: blank title revise is refused client-side (Host also fail-closed).
   * Residual 473/475: send exactly one create_task_template approvedAction (Host single-draft).
   */
  async function reviseTaskAgentRun(hostOptions?: {
    title?: string;
    goalId?: string | null;
  }) {
    const run = options.taskAgentRun.value;
    if (!run || run.run.agentType !== 'task.create' || taskAgentResuming.value) return;
    // Residual 481: product revise only from waiting_approval.
    if (run.run.status !== 'waiting_approval') return;
    // Residual 455: do not submit blank revise (Host rejects; avoid noisy VALIDATION_ERROR).
    if (typeof hostOptions?.title === 'string' && !hostOptions.title.trim()) return;
    taskAgentResuming.value = true;
    try {
      const source =
        run.state.pendingActions.length > 0
          ? run.state.pendingActions
          : run.state.approvedActions;
      // Residual 475: product draft is a single create_task_template action only.
      const primary =
        source.find((action) => action.tool === 'create_task_template') ?? source[0];
      if (!primary || primary.tool !== 'create_task_template') return;
      const approvedActions = applyHostTaskPatchToAgentActions([primary], {
        title: hostOptions?.title,
        goalId: hostOptions?.goalId,
      });
      if (approvedActions.length !== 1) return;
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
