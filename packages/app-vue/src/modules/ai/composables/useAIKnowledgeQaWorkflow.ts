import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type { KnowledgeAnswer, UseAIKnowledgeQaWorkflowOptions } from './types';
import { getAIErrorMessage } from './error';
import { unwrap } from '@memoflow/contracts/result';

type KnowledgeRelatedNote = NonNullable<KnowledgeAnswer['relatedNotes']>[number];

/**
 * Knowledge Q&A is a product query rather than a durable workflow lifecycle.
 * The server-side knowledge query port owns retrieval/citation semantics while
 * the UI only projects the Result and its evidence status.
 */
export function useAIKnowledgeQaWorkflow(options: UseAIKnowledgeQaWorkflowOptions) {
  const { t } = useI18n();
  const router = useRouter();
  const knowledgeQueryLoading = ref(false);
  const knowledgeAnswer = ref<KnowledgeAnswer | null>(null);

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

  async function askKnowledgeFromConversation() {
    if (!canAskKnowledge.value || !options.selectedModel.value) return;
    const question = buildKnowledgeQuestion();
    if (!question) return;

    knowledgeQueryLoading.value = true;
    try {
      const result = unwrap(
        await options.service.queryKnowledge({
          query: question,
          providerId: options.selectedModel.value.providerId as never,
          maxResources: 8,
        }),
      );
      const citations = result.citations.map((citation) => ({
        ...citation,
        title: citation.title ?? undefined,
      }));
      knowledgeAnswer.value = {
        ...result,
        question,
        evidenceStatus: citations.length > 0 ? 'grounded' : 'insufficient',
        relatedNotes: buildRelatedNotesFromCitations(citations),
      };
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
    await options.requestOpenKnowledgeNote(resourceId);
    await router.push('/repository');
  }

  return {
    knowledgeQueryLoading,
    knowledgeAnswer,
    canAskKnowledge,
    buildKnowledgeQuestion,
    resetKnowledgeAnswer,
    askKnowledgeFromConversation,
    openKnowledgeCitation,
  };
}
