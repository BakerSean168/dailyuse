import { computed, inject, ref, watch, type Ref } from 'vue';
import { AI_SERVICE_KEY } from '../../../di/keys';

export type EditorKnowledgeIndexState = 'idle' | 'pending' | 'indexed' | 'failed';

export function useEditorKnowledgeIndexState(
  resourceId: Ref<string | null>,
  lastSavedContent: Ref<string>,
) {
  const aiService = inject(AI_SERVICE_KEY, null);
  const state = ref<EditorKnowledgeIndexState>('idle');
  const error = ref<string | null>(null);
  let runId = 0;

  async function refresh(nextResourceId = resourceId.value) {
    const currentRunId = ++runId;
    if (!nextResourceId || !aiService) {
      state.value = 'idle';
      error.value = null;
      return;
    }

    state.value = 'pending';
    error.value = null;

    try {
      const result = await aiService.reindexKnowledge({
        resourceIds: [nextResourceId],
        force: false,
      });
      if (currentRunId !== runId || resourceId.value !== nextResourceId) {
        return;
      }

      const item = result.results.find((candidate) => candidate.resourceId === nextResourceId);
      if (!item || item.status === 'failed') {
        state.value = 'failed';
        error.value = item?.error ?? 'Knowledge indexing did not return a resource result';
        return;
      }

      state.value = 'indexed';
    } catch (cause) {
      if (currentRunId !== runId || resourceId.value !== nextResourceId) {
        return;
      }
      state.value = 'failed';
      error.value = cause instanceof Error ? cause.message : 'Knowledge indexing failed';
    }
  }

  watch(
    [resourceId, lastSavedContent],
    ([nextResourceId], previous) => {
      if (!nextResourceId) {
        void refresh(null);
        return;
      }

      const [previousResourceId, previousContent] = previous ?? [];
      if (nextResourceId !== previousResourceId || lastSavedContent.value !== previousContent) {
        void refresh(nextResourceId);
      }
    },
    { immediate: true },
  );

  return {
    state: computed(() => state.value),
    error: computed(() => error.value),
    refresh,
  };
}
