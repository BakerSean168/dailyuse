import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type {
  AgentArtifact,
  AgentExecutedAction,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import type { Ref } from 'vue';
import type {
  AIChatService,
  ChatItem,
  ChatModelOption,
  KnowledgeAnswer,
  NoteSummary,
} from './types';
import { getAIErrorMessage } from './error';
import { unwrap } from '@dailyuse/contracts/result';
import {
  applyHostKnowledgePatchToAgentActions,
  dispatchHostProposalDecision,
} from './hostProposalLifecycle';

export interface UseAIKnowledgeNoteWorkflowOptions {
  service: Pick<AIChatService, 'createKnowledgeNote' | 'startAgentRun' | 'resumeAgentRun' | 'dispatchAssistant'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatConversationId: Ref<string>;
  chatLoading: Ref<boolean>;
  chatTimeline: Ref<ChatItem[]>;
  conversationTitle: Ref<string>;
  hasWorkflowMessages: Ref<boolean>;
  scrollMessagesToBottom: () => void;
  maybeRenameCurrentConversation: (name: string) => Promise<void>;
  refreshRecentNotes: () => Promise<void>;
  recentNotes: Ref<Array<{ id: string; title: string; path: string }>>;
  openKnowledgeNote: (id: string) => Promise<unknown>;
}

export function useAIKnowledgeNoteWorkflow(options: UseAIKnowledgeNoteWorkflowOptions) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const noteCreating = ref(false);
  const noteSummary = ref<NoteSummary | null>(null);
  const noteAgentRun = ref<import('@dailyuse/contracts/ai').AgentRunResult | null>(null);
  const noteAgentLoading = ref(false);

  const noteAgentDraftArtifact = computed(
    () =>
      noteAgentRun.value?.state.artifacts.find(
        (artifact) => artifact.kind === 'knowledge_note_draft',
      ) ?? null,
  );
  const noteAgentDraftTitle = computed(() =>
    getArtifactString(noteAgentDraftArtifact.value, 'title'),
  );
  const noteAgentDraftTopic = computed(() =>
    getArtifactString(noteAgentDraftArtifact.value, 'topic'),
  );
  const noteAgentDraftMarkdown = computed(() =>
    getArtifactString(noteAgentDraftArtifact.value, 'markdown'),
  );
  const noteAgentDraftTargetSubpath = computed(() =>
    getArtifactString(noteAgentDraftArtifact.value, 'targetSubpath'),
  );
  const noteAgentExecutionRecovery = computed(() => {
    const recovery = noteAgentRun.value?.state.artifacts.find(
      (artifact) => artifact.kind === 'execution_timeline',
    )?.data['recovery'];
    return isRecord(recovery) ? recovery : null;
  });
  const canRetryKnowledgeNoteAgentExecution = computed(
    () =>
      noteAgentRun.value?.run.status === 'completed' &&
      noteAgentExecutionRecovery.value?.['canRetry'] === true &&
      !noteAgentLoading.value &&
      !noteCreating.value,
  );

  const canRunKnowledgeNoteAgent = computed(
    () =>
      Boolean(options.selectedModel.value) &&
      !options.chatLoading.value &&
      !noteAgentLoading.value &&
      options.hasWorkflowMessages.value,
  );

  function createAgentId(prefix: string): string {
    const randomId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${randomId}`;
  }

  function getArtifactString(artifact: AgentArtifact | null, key: string): string {
    if (!artifact) return '';
    const value = artifact.data[key];
    return typeof value === 'string' ? value.trim() : '';
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function getRecordString(data: Record<string, unknown>, key: string): string {
    const value = data[key];
    return typeof value === 'string' ? value.trim() : '';
  }

  function normalizeIndexStatus(value: string): NoteSummary['indexStatus'] | undefined {
    return value === 'pending' || value === 'indexed' || value === 'failed' ? value : undefined;
  }

  function noteSummaryFromExecutedAction(action: AgentExecutedAction): NoteSummary | null {
    if (action.tool !== 'create_knowledge_note' || action.status !== 'executed') return null;
    const data = isRecord(action.data) ? action.data : {};
    const resolvedPath = getRecordString(data, 'resolvedPath');
    if (!resolvedPath) return null;

    const noteData = isRecord(data.note) ? data.note : null;
    const content = noteData
      ? noteData.content === null || typeof noteData.content === 'string'
        ? noteData.content
        : undefined
      : undefined;

    return {
      resolvedPath,
      indexStatus: normalizeIndexStatus(getRecordString(data, 'indexStatus')),
      note: noteData
        ? {
            id: getRecordString(noteData, 'id') || undefined,
            name: getRecordString(noteData, 'name') || undefined,
            content,
          }
        : action.entityId
          ? { id: action.entityId }
          : undefined,
    };
  }

  function noteSummaryFromAgentRun(run: AgentRunResult): NoteSummary | null {
    for (const action of run.state.executedActions) {
      const summary = noteSummaryFromExecutedAction(action);
      if (summary) return summary;
    }
    return null;
  }

  function syncKnowledgeNoteAgentRun(run: AgentRunResult) {
    noteAgentRun.value = run;
    noteSummary.value = noteSummaryFromAgentRun(run);
  }

  function getKnowledgeNoteSaveFailure(run: AgentRunResult): string {
    return (
      run.state.executedActions.find(
        (action) => action.tool === 'create_knowledge_note' && action.status === 'failed',
      )?.message || 'Knowledge note Agent did not return a saved note.'
    );
  }

  function buildConversationSource() {
    return options.chatTimeline.value
      .filter((item) => item.content.trim().length > 0)
      .map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content.trim()}`)
      .join('\n')
      .slice(0, 4000);
  }

  function buildKnowledgeNoteTitle() {
    if (noteAgentDraftTitle.value) return noteAgentDraftTitle.value.slice(0, 80);

    const defaultName = t('aiAssistant.dialogs.chat.defaultConversationName');
    const trimmed = options.conversationTitle.value.trim();
    if (trimmed && trimmed !== defaultName) return trimmed;

    const latestUserMessage = [...options.chatTimeline.value]
      .reverse()
      .find((item) => item.role === 'user' && item.content.trim().length > 0);
    if (!latestUserMessage) return '';
    return latestUserMessage.content.trim().slice(0, 80);
  }

  function buildKnowledgeNoteTopic() {
    if (noteAgentDraftTopic.value) return noteAgentDraftTopic.value.slice(0, 200);

    const recentMessages = options.chatTimeline.value
      .filter((item) => item.content.trim().length > 0)
      .slice(-4)
      .map((item) => item.content.trim());
    const combined = recentMessages.join('; ').replace(/\s+/g, ' ').trim();
    if (!combined) return t('aiAssistant.chatPage.workflow.noteTopicFallback');
    return combined.slice(0, 200);
  }

  function resetNoteArtifacts() {
    noteSummary.value = null;
    noteAgentRun.value = null;
  }

  function buildKnowledgeAnswerNoteTitle(answer: KnowledgeAnswer): string {
    return answer.question.trim().slice(0, 80);
  }

  function buildKnowledgeAnswerNoteTopic(answer: KnowledgeAnswer): string {
    const sourceList = answer.citations
      .slice(0, 3)
      .map((citation) => citation.title || citation.resourcePath)
      .join('; ');
    const combined = [
      `Question: ${answer.question.trim()}`,
      `Answer: ${answer.answer.trim()}`,
      sourceList ? `Sources: ${sourceList}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return combined.replace(/\s+/g, ' ').trim().slice(0, 200);
  }

  function buildKnowledgeAnswerNoteSource(answer: KnowledgeAnswer): string {
    const citations = answer.citations
      .slice(0, 3)
      .map((citation) =>
        [
          `Source: ${citation.title || citation.resourcePath}`,
          citation.resourcePath ? `Path: ${citation.resourcePath}` : '',
          citation.excerpt ? `Excerpt: ${citation.excerpt}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n\n');

    return [
      `Question: ${answer.question.trim()}`,
      `Answer: ${answer.answer.trim()}`,
      citations ? `Sources:\n${citations}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 4000);
  }

  async function createKnowledgeNoteFromConversation(hostOptions?: {
    skipHostLifecycle?: boolean;
    revision?: number;
    /** Residual 363: Host-revised vault path applied to executor actions. */
    targetPath?: string;
    /** Residual 363: Host-revised markdown applied to executor actions. */
    contentMarkdown?: string;
  }) {
    if (!options.hasWorkflowMessages.value && !noteAgentDraftMarkdown.value) return;

    if (noteAgentRun.value) {
      const baseActions = noteAgentRun.value.state.pendingActions.length
        ? noteAgentRun.value.state.pendingActions
        : noteAgentRun.value.state.approvedActions;
      if (!baseActions.length) return;

      // Residual 363: Host lifecycle may revise path/body; executor consumes patched actions.
      const approvedActions = applyHostKnowledgePatchToAgentActions(baseActions, {
        targetPath: hostOptions?.targetPath,
        contentMarkdown: hostOptions?.contentMarkdown,
      });

      noteCreating.value = true;
      try {
        // Residual 355/359: Host proposal lifecycle first; resume remains mutation executor.
        if (!hostOptions?.skipHostLifecycle) {
          await dispatchHostProposalDecision(options.service, {
            decision: 'approve',
            runId: noteAgentRun.value.run.runId,
            kind: 'knowledge.write',
            revision: hostOptions?.revision,
          });
        }
        const result = unwrap(await options.service.resumeAgentRun(noteAgentRun.value.run.runId, {
          userDecision: 'confirm',
          approvedActions,
        }));
        noteAgentRun.value = result;
        const summary = noteSummaryFromAgentRun(result);
        if (!summary) {
          toast.error(getKnowledgeNoteSaveFailure(result));
          options.scrollMessagesToBottom();
          return;
        }

        noteSummary.value = summary;
        await options.refreshRecentNotes();
        await options.maybeRenameCurrentConversation(
          summary.note?.name?.replace(/\.md$/i, '') ||
            noteAgentDraftTitle.value ||
            buildKnowledgeNoteTitle(),
        );
        toast.success(t('aiAssistant.dialogs.note.created'));
        options.scrollMessagesToBottom();
      } catch (error) {
        toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.note.createFailed'));
      } finally {
        noteCreating.value = false;
      }
      return;
    }

    // A note is never written directly from the conversation. Start the
    // proposal run first so the complete path/body is visible and approved.
    await startKnowledgeNoteAgentRunWithInput({
      topic: buildKnowledgeNoteTopic(),
      title: buildKnowledgeNoteTitle(),
      source: options.chatTimeline.value.map((item) => `${item.role}: ${item.content}`).join('\n'),
    });
  }

  async function retryKnowledgeNoteAgentExecution() {
    if (!canRetryKnowledgeNoteAgentExecution.value || !noteAgentRun.value) return;

    noteCreating.value = true;
    try {
      const result = unwrap(await options.service.resumeAgentRun(noteAgentRun.value.run.runId, {
        userDecision: 'confirm',
      }));
      noteAgentRun.value = result;

      const summary = noteSummaryFromAgentRun(result);
      if (!summary) {
        toast.error(getKnowledgeNoteSaveFailure(result));
        options.scrollMessagesToBottom();
        return;
      }

      noteSummary.value = summary;
      await options.refreshRecentNotes();
      await options.maybeRenameCurrentConversation(
        summary.note?.name?.replace(/\.md$/i, '') ||
          noteAgentDraftTitle.value ||
          buildKnowledgeNoteTitle(),
      );
      toast.success(t('aiAssistant.dialogs.note.created'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.note.createFailed'));
    } finally {
      noteCreating.value = false;
    }
  }

  async function startKnowledgeNoteAgentRunWithInput(input: {
    topic: string;
    title?: string;
    source?: string;
  }) {
    if (
      !options.selectedModel.value ||
      options.chatLoading.value ||
      noteAgentLoading.value ||
      !input.topic.trim()
    ) {
      return;
    }

    noteAgentLoading.value = true;
    try {
      const selectedModel = options.selectedModel.value;
      const request: AgentStartRunClientRequest = {
        runId: createAgentId('run'),
        threadId: createAgentId('thread'),
        conversationId: options.chatConversationId.value || null,
        agentType: 'knowledge.generate',
        locale: locale.value === 'en-US' ? 'en-US' : 'zh-CN',
        input: {
          topic: input.topic,
          ...(input.source ? { source: input.source } : {}),
          ...(input.title ? { title: input.title } : {}),
          ...(selectedModel
            ? {
                provider_id: selectedModel.providerId,
                model: selectedModel.modelId,
              }
            : {}),
        },
      };

      noteSummary.value = null;
      noteAgentRun.value = unwrap(await options.service.startAgentRun(request));
      toast.success(t('aiAssistant.dialogs.note.draftReady'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.note.draftFailed'));
    } finally {
      noteAgentLoading.value = false;
    }
  }

  async function startKnowledgeNoteAgentRun() {
    if (!canRunKnowledgeNoteAgent.value) return;

    await startKnowledgeNoteAgentRunWithInput({
      topic: buildKnowledgeNoteTopic(),
      source: buildConversationSource(),
      title: buildKnowledgeNoteTitle(),
    });
  }

  async function startKnowledgeNoteAgentRunFromKnowledgeAnswer(answer: KnowledgeAnswer | null) {
    if (!answer || answer.evidenceStatus !== 'grounded') return;

    await startKnowledgeNoteAgentRunWithInput({
      topic: buildKnowledgeAnswerNoteTopic(answer),
      source: buildKnowledgeAnswerNoteSource(answer),
      title: buildKnowledgeAnswerNoteTitle(answer),
    });
  }

  /**
   * Residual 357: Host reject lifecycle then cancel the AgentRun executor path.
   * Does not run ProposalKernel mutation execution or write knowledge notes.
   */
  async function cancelKnowledgeNoteAgentRun(hostOptions?: {
    skipHostLifecycle?: boolean;
    revision?: number;
  }) {
    if (!noteAgentRun.value || noteCreating.value || noteAgentLoading.value) return;
    if (noteAgentRun.value.run.status !== 'waiting_approval') return;

    noteCreating.value = true;
    try {
      if (!hostOptions?.skipHostLifecycle) {
        await dispatchHostProposalDecision(options.service, {
          decision: 'reject',
          runId: noteAgentRun.value.run.runId,
          kind: 'knowledge.write',
          reason: 'user_cancel',
          revision: hostOptions?.revision,
        });
      }
      const result = unwrap(
        await options.service.resumeAgentRun(noteAgentRun.value.run.runId, {
          userDecision: 'cancel',
        }),
      );
      noteAgentRun.value = result;
      toast.success(t('aiAssistant.dialogs.agent.cancelled'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      noteCreating.value = false;
    }
  }

  async function openCreatedNote() {
    const resolvedPath = noteSummary.value?.resolvedPath;
    if (!resolvedPath) return;

    if (!options.recentNotes.value.length) {
      await options.refreshRecentNotes();
    }

    const target = options.recentNotes.value.find(
      (item) =>
        item.path === resolvedPath ||
        item.title === noteSummary.value?.note?.name ||
        item.path.endsWith(`/${noteSummary.value?.note?.name ?? ''}`),
    );

    if (target) {
      await options.openKnowledgeNote(target.id);
      return;
    }

    await router.push({ path: '/repository', query: { note: resolvedPath } });
  }

  return {
    noteCreating,
    noteSummary,
    noteAgentRun,
    noteAgentLoading,
    noteAgentDraftArtifact,
    noteAgentDraftTitle,
    noteAgentDraftTopic,
    noteAgentDraftMarkdown,
    noteAgentDraftTargetSubpath,
    canRetryKnowledgeNoteAgentExecution,
    canRunKnowledgeNoteAgent,
    buildKnowledgeNoteTitle,
    buildKnowledgeNoteTopic,
    buildKnowledgeAnswerNoteTitle,
    buildKnowledgeAnswerNoteTopic,
    buildKnowledgeAnswerNoteSource,
    resetNoteArtifacts,
    syncKnowledgeNoteAgentRun,
    startKnowledgeNoteAgentRun,
    startKnowledgeNoteAgentRunFromKnowledgeAnswer,
    createKnowledgeNoteFromConversation,
    retryKnowledgeNoteAgentExecution,
    cancelKnowledgeNoteAgentRun,
    openCreatedNote,
  };
}
