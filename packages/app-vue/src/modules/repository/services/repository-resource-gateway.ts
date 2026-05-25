import { computed } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { useRepository } from '../composables/useRepository';
import type { ResourceInsertionRecentEntry } from '../../editor/composables/useResourceInsertion';

interface RecentInsertionState {
  entries: ResourceInsertionRecentEntry[];
}

let recentInsertionState: RecentInsertionState | null = null;

function getRecentInsertionState(): RecentInsertionState {
  if (!recentInsertionState) {
    recentInsertionState = {
      entries: [],
    };
  }

  return recentInsertionState;
}

export function useRepositoryResourceGateway() {
  const repository = useRepository();
  const recentState = getRecentInsertionState();

  async function ensureReady() {
    await repository.initRepository();

    if (repository.repositoryId.value && repository.resources.value.length === 0) {
      await repository.fetchResources();
    }
  }

  function getCachedResource(resourceId: string): ResourceClientDTO | null {
    return repository.resources.value.find((item) => item.id === resourceId) ?? null;
  }

  async function getResource(resourceId: string): Promise<ResourceClientDTO | null> {
    return repository.getResourceById(resourceId);
  }

  async function refreshResources() {
    await repository.fetchResources();
  }

  function persistRecentEntry(entry: ResourceInsertionRecentEntry) {
    const deduped = recentState.entries.filter((item) => item.resourceId !== entry.resourceId);
    recentState.entries = [entry, ...deduped].slice(0, 20);
  }

  return {
    repositoryId: repository.repositoryId,
    resources: computed(() => repository.resources.value),
    isSaving: repository.isSaving,
    error: repository.error,
    ensureReady,
    getCachedResource,
    getResource,
    refreshResources,
    uploadResources: repository.uploadResources,
    readResourceAsDataUrl: repository.readResourceAsDataUrl,
    createMarkdownNote: repository.createMarkdownNote,
    searchResources: repository.searchResources,
    recentEntries: computed(() => recentState.entries),
    persistRecentEntry,
  };
}
