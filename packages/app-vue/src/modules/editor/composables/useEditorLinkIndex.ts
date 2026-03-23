import { computed } from 'vue';
import { useRepositoryStore } from '../../repository/stores/repositoryStore';
import { useRepositoryResourceGateway } from '../../repository/services/repositoryResourceGateway';
import {
  buildEditorLinkIndex,
  getBacklinksForNote,
  getLinkGraphForNote,
  searchLinkIndexNotes,
  type GraphOptions,
  type LinkGraphData,
  type LinkIndexNote,
  type SearchNotesOptions,
} from '../utils/linkIndex';
import { useResourceInsertion } from './useResourceInsertion';

export function useEditorLinkIndex() {
  const store = useRepositoryStore();
  const repository = useRepositoryResourceGateway();
  const resourceInsertion = useResourceInsertion();

  const index = computed(() => buildEditorLinkIndex(store.resources));
  const notes = computed(() => index.value.notes);

  async function ensureResourcesLoaded(force = false) {
    await repository.ensureReady();

    if (!repository.repositoryId.value) {
      return;
    }

    if (force || store.resources.length === 0) {
      await repository.refreshResources();
    }
  }

  function getNoteById(noteId: string): LinkIndexNote | null {
    return index.value.notesById.get(noteId) ?? null;
  }

  function resolveNote(target: string): LinkIndexNote | null {
    return index.value.resolveNote(target);
  }

  function searchNotes(query: string, options: SearchNotesOptions = {}): LinkIndexNote[] {
    return searchLinkIndexNotes(index.value, query, options);
  }

  function getBacklinks(noteId: string, limit?: number) {
    return getBacklinksForNote(index.value, noteId, limit);
  }

  function getGraph(noteId: string, depth: number, options?: GraphOptions): LinkGraphData {
    return getLinkGraphForNote(index.value, noteId, depth, options);
  }

  async function createMarkdownNote(title: string, initialContent = '') {
    await ensureResourcesLoaded();

    const normalizedTitle = title.trim().endsWith('.md') ? title.trim() : `${title.trim()}.md`;
    return repository.createMarkdownNote(normalizedTitle, initialContent);
  }

  return {
    index,
    notes,
    repositoryId: repository.repositoryId,
    isSaving: repository.isSaving,
    error: repository.error,
    ensureResourcesLoaded,
    getNoteById,
    resolveNote,
    searchNotes,
    getBacklinks,
    getGraph,
    createMarkdownNote,
    imageResources: resourceInsertion.imageResources,
    resourceItems: resourceInsertion.resourceItems,
    recentResources: resourceInsertion.recentResources,
    insertUploadedImages: resourceInsertion.insertUploadedImages,
    insertExistingImage: resourceInsertion.insertExistingImage,
    insertExistingResource: resourceInsertion.insertExistingResource,
    exportMarkdownAsSelfContained: resourceInsertion.exportMarkdownAsSelfContained,
  };
}
