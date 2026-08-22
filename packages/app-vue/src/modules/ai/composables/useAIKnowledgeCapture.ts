import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import type { AIWorkflowRunView } from '@memoflow/contracts/ai';
import type { KnowledgeCaptureWorkflowStage, UseAIKnowledgeCaptureOptions } from './types';
import { getAIErrorMessage, getAIWorkflowFailureMessage } from './error';

/**
 * ADR-052 knowledge.capture UI projection.
 *
 * The durable Mastra Workflow is authoritative. This composable owns only
 * editable presentation state and maps existing UI action names onto typed
 * Workflow commands.
 */
export function useAIKnowledgeCapture(options: UseAIKnowledgeCaptureOptions) {
  const { t, locale } = useI18n();

  const knowledgeCaptureRun = ref<Extract<AIWorkflowRunView, { kind: 'knowledge.capture' }> | null>(null);
  const knowledgeCaptureStage = ref<KnowledgeCaptureWorkflowStage>('collect');
  const clarificationAnswers = ref<string[]>([]);
  const showKnowledgeDraftEditor = ref(false);
  const knowledgeCaptureLoading = ref(false);
  const knowledgeCaptureResuming = ref(false);

  const reviewDraft = computed(() =>
    knowledgeCaptureRun.value?.suspension?.type === 'knowledge_draft_review'
      ? knowledgeCaptureRun.value.suspension.draft
      : null,
  );

  function projectRun(run: AIWorkflowRunView | null): void {
    if (!run || run.kind !== 'knowledge.capture') {
      knowledgeCaptureRun.value = null;
      knowledgeCaptureStage.value = 'collect';
      clarificationAnswers.value = [];
      return;
    }
    knowledgeCaptureRun.value = run;
    const suspension = run.suspension;
    if (run.status === 'suspended' && suspension?.type === 'clarification_required') {
      knowledgeCaptureStage.value = 'clarification';
      clarificationAnswers.value = suspension.questions.map(() => '');
    } else if (run.status === 'suspended' && suspension?.type === 'knowledge_draft_review') {
      knowledgeCaptureStage.value = 'confirm';
      clarificationAnswers.value = [];
    } else if (run.status === 'suspended' && suspension?.type === 'recovery_required') {
      knowledgeCaptureStage.value = 'execute';
      clarificationAnswers.value = [];
    } else if (['completed', 'failed', 'cancelled'].includes(run.status)) {
      knowledgeCaptureStage.value = 'result';
      clarificationAnswers.value = [];
    } else {
      knowledgeCaptureStage.value = 'plan';
      clarificationAnswers.value = [];
    }
    options.scrollMessagesToBottom();
  }

  async function syncKnowledgeCaptureRun(runId: string): Promise<void> {
    if (!runId) return;
    try {
      projectRun(await options.workflowRuntime.get({ runId }));
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.errors.workflowExecutionFailed'));
    }
  }

  const knowledgeCaptureWaitingForClarification = computed(
    () =>
      knowledgeCaptureRun.value?.status === 'suspended' &&
      knowledgeCaptureRun.value.suspension?.type === 'clarification_required',
  );
  const knowledgeCaptureWaitingForApproval = computed(
    () =>
      knowledgeCaptureRun.value?.status === 'suspended' &&
      knowledgeCaptureRun.value.suspension?.type === 'knowledge_draft_review',
  );
  const canSubmitKnowledgeClarification = computed(() => {
    const suspension = knowledgeCaptureRun.value?.suspension;
    if (suspension?.type !== 'clarification_required') return false;
    return suspension.questions.every((_, i) => Boolean(clarificationAnswers.value[i]?.trim()));
  });
  const canRetryKnowledgeCaptureExecution = computed(() => {
    const suspension = knowledgeCaptureRun.value?.suspension;
    return (
      knowledgeCaptureRun.value?.status === 'suspended' &&
      suspension?.type === 'recovery_required' &&
      suspension.retryable &&
      !knowledgeCaptureResuming.value
    );
  });
  const canRunKnowledgeCapture = computed(
    () =>
      Boolean(options.selectedModel.value) &&
      Boolean(options.chatConversationId.value) &&
      !options.chatLoading.value &&
      !knowledgeCaptureLoading.value &&
      !knowledgeCaptureResuming.value &&
      options.hasWorkflowUserMessages.value &&
      (!knowledgeCaptureRun.value ||
        ['completed', 'failed', 'cancelled'].includes(knowledgeCaptureRun.value.status)),
  );

  const knowledgeCaptureExecutionSummary = computed(() => {
    const receipt = knowledgeCaptureRun.value?.result;
    return receipt ? { status: receipt.status, noteId: receipt.noteId, notePath: receipt.notePath } : null;
  });

  const knowledgeCaptureExecutionRecovery = computed(() => {
    const suspension = knowledgeCaptureRun.value?.suspension;
    if (suspension?.type !== 'recovery_required') return null;
    return {
      canRetry: suspension.retryable,
      suggestions: suspension.failures.map((failure) => getAIWorkflowFailureMessage(failure, t)),
    };
  });

  async function startKnowledgeCaptureRun(): Promise<void> {
    if (!canRunKnowledgeCapture.value || !options.selectedModel.value) return;
    const topic = options.buildConversationTranscript().trim();
    if (!topic) return;
    knowledgeCaptureLoading.value = true;
    try {
      const run = await options.workflowRuntime.start({
        kind: 'knowledge.capture',
        conversationId: options.chatConversationId.value,
        input: { topic },
        providerId: options.selectedModel.value.providerId,
        modelId: options.selectedModel.value.modelId,
        locale: locale.value.startsWith('en') ? 'en-US' : 'zh-CN',
      });
      projectRun(run);
      if (run.kind === 'knowledge.capture' && run.suspension?.type === 'knowledge_draft_review') {
        await options.maybeRenameCurrentConversation(run.suspension.draft.title);
      }
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.errors.workflowExecutionFailed'));
    } finally {
      knowledgeCaptureLoading.value = false;
    }
  }

  async function resume(
    command: Parameters<typeof options.workflowRuntime.resume>[0]['command'],
  ): Promise<void> {
    const run = knowledgeCaptureRun.value;
    if (!run || knowledgeCaptureResuming.value) return;
    knowledgeCaptureResuming.value = true;
    try {
      const next = await options.workflowRuntime.resume({ runId: run.runId, command });
      projectRun(next);
      if (
        next.kind === 'knowledge.capture' &&
        next.status === 'completed' &&
        next.result?.noteId
      ) {
        await options.openCreatedNote?.(next.result.noteId);
      }
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.errors.workflowExecutionFailed'));
    } finally {
      knowledgeCaptureResuming.value = false;
    }
  }

  const confirmKnowledgeCaptureRun = () => resume({ type: 'approve' });
  const submitKnowledgeClarification = () =>
    resume({ type: 'answer', answers: clarificationAnswers.value.map((a) => a.trim()) });
  const retryKnowledgeCaptureExecution = () => resume({ type: 'retry' });
  const reviseKnowledgeCaptureRun = (patch: Record<string, unknown>) =>
    resume({ type: 'edit_structured', patch });

  async function cancelKnowledgeCaptureRun(): Promise<void> {
    const run = knowledgeCaptureRun.value;
    if (!run || knowledgeCaptureResuming.value) return;
    if (run.status === 'suspended') return resume({ type: 'cancel' });
    knowledgeCaptureResuming.value = true;
    try {
      projectRun(await options.workflowRuntime.cancel({ runId: run.runId }));
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.errors.workflowExecutionFailed'));
    } finally {
      knowledgeCaptureResuming.value = false;
    }
  }

  const completeKnowledgeCaptureRun = confirmKnowledgeCaptureRun;

  function resetKnowledgeCaptureLocalState() {
    knowledgeCaptureRun.value = null;
    knowledgeCaptureStage.value = 'collect';
    clarificationAnswers.value = [];
    showKnowledgeDraftEditor.value = false;
    knowledgeCaptureLoading.value = false;
    knowledgeCaptureResuming.value = false;
  }

  return {
    knowledgeCaptureRun,
    knowledgeCaptureStage,
    clarificationAnswers,
    showKnowledgeDraftEditor,
    knowledgeCaptureLoading,
    knowledgeCaptureResuming,
    canRunKnowledgeCapture,
    canSubmitKnowledgeClarification,
    knowledgeCaptureWaitingForApproval,
    knowledgeCaptureWaitingForClarification,
    canRetryKnowledgeCaptureExecution,
    knowledgeCaptureExecutionSummary,
    knowledgeCaptureExecutionRecovery,
    reviewDraft,
    startKnowledgeCaptureRun,
    cancelKnowledgeCaptureRun,
    completeKnowledgeCaptureRun,
    reviseKnowledgeCaptureRun,
    retryKnowledgeCaptureExecution,
    confirmKnowledgeCaptureRun,
    submitKnowledgeClarification,
    syncKnowledgeCaptureRun,
    resetKnowledgeCaptureLocalState,
    projectRun,
  };
}