import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type { AgentStartRunClientRequest } from '@dailyuse/contracts/ai';
import type { AiProviderConfigId } from '@dailyuse/contracts/primitives';
import type {
  KnowledgeAnswer,
  KnowledgeQaAgentRunResult,
  UseAIKnowledgeQaWorkflowOptions,
} from './types';
import { getAIErrorMessage } from './error';
import { unwrap } from '@dailyuse/contracts/result';

type KnowledgeRelatedNote = NonNullable<KnowledgeAnswer['relatedNotes']>[number];

export function useAIKnowledgeQaWorkflow(options: UseAIKnowledgeQaWorkflowOptions) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const knowledgeQueryLoading = ref(false);
  const knowledgeAnswer = ref<KnowledgeAnswer | null>(null);
  const knowledgeQaAgentRun = ref<KnowledgeQaAgentRunResult | null>(null);

  const canAskKnowledge = computed(
    () =>
      Boolean(options.selectedModel.value) &&
      !options.chatLoading.value &&
      !knowledgeQueryLoading.value &&
      options.hasWorkflowUserMessages.value,
  );

  function buildKnowledgeQuestion(): string {
    const latestUserMessage = [...options.chatTimeline.value]
      .reverse()
      .find((item) => item.role === 'user' && item.content.trim().length > 0);
    return latestUserMessage?.content.trim().slice(0, 2000) ?? '';
  }

  function resetKnowledgeAnswer() {
    knowledgeAnswer.value = null;
    knowledgeQaAgentRun.value = null;
  }

  function createAgentId(prefix: string): string {
    const randomId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${randomId}`;
  }

  function buildRelatedNotesFromCitations(
    citations: KnowledgeAnswer['citations'],
  ): KnowledgeRelatedNote[] {
    const notesByResourceId = new Map<string, KnowledgeRelatedNote>();
    for (const citation of citations) {
      if (notesByResourceId.has(citation.resourceId)) continue;
      notesByResourceId.set(citation.resourceId, {
        resourceId: citation.resourceId,
        resourcePath: citation.resourcePath,
        title: citation.title,
        excerpt: citation.excerpt,
        score: citation.score,
      });
    }
    return [...notesByResourceId.values()];
  }

  function syncKnowledgeQaAgentRun(result: KnowledgeQaAgentRunResult) {
    resetKnowledgeAnswer();
    knowledgeQaAgentRun.value = result;

    const answerArtifact = result.state.artifacts.find(
      (artifact) => artifact.kind === 'knowledge_answer',
    );
    if (!answerArtifact) return;

    const usage = result.state.usage;
    const citations = result.state.citations.map((citation) => ({
      ...citation,
      title: citation.title ?? undefined,
    }));
    const providerId =
      typeof answerArtifact.data['providerId'] === 'string'
        ? answerArtifact.data['providerId']
        : '';

    knowledgeAnswer.value = {
      question: String(answerArtifact.data['question'] ?? ''),
      answer: String(answerArtifact.data['answer'] ?? ''),
      citations,
      providerId: providerId as AiProviderConfigId,
      tokenUsage: {
        promptTokens: usage.promptTokens ?? 0,
        completionTokens: usage.completionTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
      },
      processingTimeMs:
        typeof answerArtifact.data['processingTimeMs'] === 'number'
          ? answerArtifact.data['processingTimeMs']
          : 0,
      matchedResourceCount:
        typeof answerArtifact.data['matchedResourceCount'] === 'number'
          ? answerArtifact.data['matchedResourceCount']
          : citations.length,
      evidenceStatus:
        answerArtifact.data['evidenceStatus'] === 'insufficient'
          ? 'insufficient'
          : 'grounded',
      relatedNotes: buildRelatedNotesFromCitations(citations),
    };
  }

  async function askKnowledgeFromConversation() {
    if (!canAskKnowledge.value || !options.selectedModel.value) return;

    const question = buildKnowledgeQuestion();
    if (!question) return;

    knowledgeQueryLoading.value = true;
    try {
      const selectedModel = options.selectedModel.value;
      const request: AgentStartRunClientRequest = {
        runId: createAgentId('run'),
        threadId: createAgentId('thread'),
        conversationId: options.chatConversationId.value || null,
        agentType: 'knowledge.qa',
        locale: locale.value === 'en-US' ? 'en-US' : 'zh-CN',
        input: {
          question,
          providerId: selectedModel.providerId,
          maxResources: 8,
        },
      };

      syncKnowledgeQaAgentRun(unwrap(await options.service.startAgentRun(request)));
      if (!knowledgeAnswer.value) {
        throw new Error('Knowledge Q&A Agent did not return an answer artifact.');
      }
      toast.success(t('aiAssistant.dialogs.knowledge.queryCompleted'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.knowledge.queryFailed'));
    } finally {
      knowledgeQueryLoading.value = false;
    }
  }

  async function openKnowledgeCitation(resourceId: string) {
    if (!resourceId) return;
    await options.requestOpenResource(resourceId);
    await router.push('/repository');
  }

  return {
    knowledgeQueryLoading,
    knowledgeAnswer,
    knowledgeQaAgentRun,
    canAskKnowledge,
    buildKnowledgeQuestion,
    resetKnowledgeAnswer,
    syncKnowledgeQaAgentRun,
    askKnowledgeFromConversation,
    openKnowledgeCitation,
  };
}
