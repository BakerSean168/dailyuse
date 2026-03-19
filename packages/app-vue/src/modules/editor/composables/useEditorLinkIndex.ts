import { computed } from 'vue';
import { useRepository } from '../../repository/composables/useRepository';
import { useRepositoryStore } from '../../repository/stores/repositoryStore';
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
  const repository = useRepository();
  const resourceInsertion = useResourceInsertion();

  const index = computed(() => buildEditorLinkIndex(store.resources));
  const notes = computed(() => index.value.notes);

  async function ensureResourcesLoaded(force = false) {
    await repository.initRepository();

    if (!repository.repositoryId.value) {
      return;
    }

    if (force || store.resources.length === 0) {
      await repository.fetchResources();
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

  async function saveNoteContent(noteId: string, content: string) {
    return repository.saveResourceContent(noteId, content);
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
    saveNoteContent,
    imageResources: resourceInsertion.imageResources,
    resourceItems: resourceInsertion.resourceItems,
    recentResources: resourceInsertion.recentResources,
    insertUploadedImages: resourceInsertion.insertUploadedImages,
    insertExistingImage: resourceInsertion.insertExistingImage,
    insertExistingResource: resourceInsertion.insertExistingResource,
    exportMarkdownAsSelfContained: resourceInsertion.exportMarkdownAsSelfContained,
  };
}
