import { computed } from 'vue';
import { useRepositoryStore } from '../../repository/stores/repositoryStore';
import { buildResourceReferenceIndex } from '../utils/resourceReferenceIndex';

export function useResourceReferenceIndex() {
  const store = useRepositoryStore();
  const index = computed(() => buildResourceReferenceIndex(store.resources));

  return {
    index,
    notes: computed(() => index.value.notes),
    unresolvedReferences: computed(() => index.value.unresolvedReferences),
    getNoteReferences: (noteId: string) => index.value.getNoteReferences(noteId),
    getInboundReferences: (resourceId: string) => index.value.getInboundReferences(resourceId),
    getUnresolvedReferences: (noteId?: string) => index.value.getUnresolvedReferences(noteId),
    getDeleteImpact: (resourceId: string) => index.value.getDeleteImpact(resourceId),
  };
}
