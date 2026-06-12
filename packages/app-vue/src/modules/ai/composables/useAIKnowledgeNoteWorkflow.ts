import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type {
  AgentArtifact,
  AgentExecutedAction,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import type { Ref } from 'vue';
import type {
  AIChatService,
  ChatItem,
  ChatModelOption,
  KnowledgeAnswer,
  KnowledgeNoteAgentRunResult,
  NoteSummary,
} from './types';
import { getAIErrorMessage } from './error';

export interface UseAIKnowledgeNoteWorkflowOptions {
  service: Pick<AIChatService, 'createKnowledgeNote' | 'startAgentRun' | 'resumeAgentRun'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatConversationId: Ref<string>;
  chatLoading: Ref<boolean>;
  chatTimeline: Ref<ChatItem[]>;
  conversationTitle: Ref<string>;
  hasWorkflowMessages: Ref<boolean>;
  knowledgeNoteSubpath: Ref<string>;
  scrollMessagesToBottom: () => void;
  maybeRenameCurrentConversation: (name: string) => Promise<void>;
  fetchResources: () => Promise<void>;
  resources: Ref<Array<{ id: string; name: string; path?: string }>>;
  requestOpenResource: (id: string) => Promise<unknown>;
}

type CreateKnowledgeNoteRequest = Parameters<
  UseAIKnowledgeNoteWorkflowOptions['service']['createKnowledgeNote']
>[0];

export function useAIKnowledgeNoteWorkflow(options: UseAIKnowledgeNoteWorkflowOptions) {
  const { t } = useI18n();
  const router = useRouter();

  const noteCreating = ref(false);
  const noteSummary = ref<NoteSummary | null>(null);
  const noteAgentRun = ref<Awaited<ReturnType<AIChatService['startAgentRun']>> | null>(null);
  const noteAgentLoading = ref(false);

  const noteAgentDraftArtifact = computed(
    () =>
      noteAgentRun.value?.state.artifacts.find(
        (artifact) => artifact.kind === 'knowledge_note_draft',
      ) ?? null,
  );
  const noteAgentDraftTitle = computed(() => getArtifactString(noteAgentDraftArtifact.value, 'title'));
  const noteAgentDraftTopic = computed(() => getArtifactString(noteAgentDraftArtifact.value, 'topic'));
  const noteAgentDraftMarkdown = computed(() =>
    getArtifactString(noteAgentDraftArtifact.value, 'markdown'),
  );
  const noteAgentDraftTargetSubpath = computed(() =>
    getArtifactString(noteAgentDraftArtifact.value, 'targetSubpath'),
  );
  const noteAgentExecutionRecovery = computed(() => {
    const recovery = noteAgentRun.value?.state.artifacts
      .find((artifact) => artifact.kind === 'execution_timeline')
      ?.data['recovery'];
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

    const resourceData = isRecord(data.resource) ? data.resource : null;
    const content = resourceData
      ? resourceData.content === null || typeof resourceData.content === 'string'
        ? resourceData.content
        : undefined
      : undefined;

    return {
      resolvedPath,
      indexStatus: normalizeIndexStatus(getRecordString(data, 'indexStatus')),
      resource: resourceData
        ? {
            id: getRecordString(resourceData, 'id') || undefined,
            name: getRecordString(resourceData, 'name') || undefined,
            content,
          }
        : action.entityId
          ? { id: action.entityId }
          : undefined,
    };
  }

  function noteSummaryFromAgentRun(run: KnowledgeNoteAgentRunResult): NoteSummary | null {
    for (const action of run.state.executedActions) {
      const summary = noteSummaryFromExecutedAction(action);
      if (summary) return summary;
    }
    return null;
  }

  function syncKnowledgeNoteAgentRun(run: KnowledgeNoteAgentRunResult) {
    noteAgentRun.value = run;
    noteSummary.value = noteSummaryFromAgentRun(run);
  }

  function getKnowledgeNoteSaveFailure(run: KnowledgeNoteAgentRunResult): string {
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

  async function createKnowledgeNote(input: {
    topic: string;
    title?: string;
    contentMarkdown?: string;
    targetSubpath?: string;
  }) {
    if (!options.selectedModel.value || !input.topic.trim()) return;

    noteCreating.value = true;
    try {
      const targetSubpath = input.targetSubpath || options.knowledgeNoteSubpath.value;
      const summary = await options.service.createKnowledgeNote({
        topic: input.topic,
        ...(input.contentMarkdown ? { contentMarkdown: input.contentMarkdown } : {}),
        ...(input.title ? { title: input.title } : {}),
        ...(targetSubpath ? { targetSubpath } : {}),
        providerId:
          options.selectedModel.value.providerId as CreateKnowledgeNoteRequest['providerId'],
        model: options.selectedModel.value.modelId,
      });

      noteSummary.value = {
        resolvedPath: summary.resolvedPath,
        indexStatus: summary.indexStatus,
        resource: summary.resource
          ? {
              id: summary.resource.id,
              name: summary.resource.name,
              content: summary.resource.content,
            }
          : undefined,
      };
      await options.fetchResources();
      await options.maybeRenameCurrentConversation(
        summary.resource?.name?.replace(/\.md$/i, '') || input.title || input.topic,
      );
      toast.success(t('aiAssistant.dialogs.note.created'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.note.createFailed'));
    } finally {
      noteCreating.value = false;
    }
  }

  async function createKnowledgeNoteFromConversation() {
    if (!options.hasWorkflowMessages.value && !noteAgentDraftMarkdown.value) return;

    if (noteAgentRun.value) {
      const approvedActions = noteAgentRun.value.state.pendingActions.length
        ? noteAgentRun.value.state.pendingActions
        : noteAgentRun.value.state.approvedActions;
      if (!approvedActions.length) return;

      noteCreating.value = true;
      try {
        const result = await options.service.resumeAgentRun(noteAgentRun.value.run.runId, {
          userDecision: 'confirm',
          approvedActions,
        });
        noteAgentRun.value = result;
        const summary = noteSummaryFromAgentRun(result);
        if (!summary) {
          toast.error(getKnowledgeNoteSaveFailure(result));
          options.scrollMessagesToBottom();
          return;
        }

        noteSummary.value = summary;
        await options.fetchResources();
        await options.maybeRenameCurrentConversation(
          summary.resource?.name?.replace(/\.md$/i, '') || noteAgentDraftTitle.value || buildKnowledgeNoteTitle(),
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

    const noteTitle = buildKnowledgeNoteTitle();
    await createKnowledgeNote({
      topic: buildKnowledgeNoteTopic(),
      ...(noteAgentDraftMarkdown.value
        ? { contentMarkdown: noteAgentDraftMarkdown.value.slice(0, 50000) }
        : {}),
      ...(noteTitle ? { title: noteTitle } : {}),
      ...(noteAgentDraftTargetSubpath.value
        ? { targetSubpath: noteAgentDraftTargetSubpath.value }
        : {}),
    });
  }

  async function retryKnowledgeNoteAgentExecution() {
    if (!canRetryKnowledgeNoteAgentExecution.value || !noteAgentRun.value) return;

    noteCreating.value = true;
    try {
      const result = await options.service.resumeAgentRun(noteAgentRun.value.run.runId, {
        userDecision: 'confirm',
      });
      noteAgentRun.value = result;

      const summary = noteSummaryFromAgentRun(result);
      if (!summary) {
        toast.error(getKnowledgeNoteSaveFailure(result));
        options.scrollMessagesToBottom();
        return;
      }

      noteSummary.value = summary;
      await options.fetchResources();
      await options.maybeRenameCurrentConversation(
        summary.resource?.name?.replace(/\.md$/i, '') || noteAgentDraftTitle.value || buildKnowledgeNoteTitle(),
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
        input: {
          topic: input.topic,
          ...(input.source ? { source: input.source } : {}),
          ...(input.title ? { title: input.title } : {}),
          ...(options.knowledgeNoteSubpath.value
            ? { targetSubpath: options.knowledgeNoteSubpath.value }
            : {}),
          ...(selectedModel
            ? {
                providerId: selectedModel.providerId,
                model: selectedModel.modelId,
              }
            : {}),
        },
      };

      noteSummary.value = null;
      noteAgentRun.value = await options.service.startAgentRun(request);
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

  async function openCreatedNote() {
    const resolvedPath = noteSummary.value?.resolvedPath;
    if (!resolvedPath) return;

    if (!options.resources.value.length) {
      await options.fetchResources();
    }

    const target = options.resources.value.find(
      (item) => item.path === resolvedPath || item.name === noteSummary.value?.resource?.name,
    );

    if (target) {
      await options.requestOpenResource(target.id);
      await router.push('/repository');
    }
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
    openCreatedNote,
  };
}
