import { computed } from 'vue';
import { useRepository } from '../../repository/composables/useRepository';
import { useRepositoryStore } from '../../repository/stores/repositoryStore';
import {
  buildEditorLinkIndex,
  getBacklinksForDocument,
  getLinkGraphForDocument,
  searchLinkIndexDocuments,
  type GraphOptions,
  type LinkGraphData,
  type LinkIndexDocument,
  type SearchDocumentsOptions,
} from '../utils/linkIndex';

export function useEditorLinkIndex() {
  const store = useRepositoryStore();
  const repository = useRepository();

  const index = computed(() => buildEditorLinkIndex(store.resources));
  const documents = computed(() => index.value.documents);

  async function ensureResourcesLoaded(force = false) {
    await repository.initRepository();

    if (!repository.repositoryId.value) {
      return;
    }

    if (force || store.resources.length === 0) {
      await repository.fetchResources();
    }
  }

  function getDocumentById(documentId: string): LinkIndexDocument | null {
    return index.value.documentsById.get(documentId) ?? null;
  }

  function resolveDocument(target: string): LinkIndexDocument | null {
    return index.value.resolveDocument(target);
  }

  function searchDocuments(
    query: string,
    options: SearchDocumentsOptions = {},
  ): LinkIndexDocument[] {
    return searchLinkIndexDocuments(index.value, query, options);
  }

  function getBacklinks(documentId: string, limit?: number) {
    return getBacklinksForDocument(index.value, documentId, limit);
  }

  function getGraph(documentId: string, depth: number, options?: GraphOptions): LinkGraphData {
    return getLinkGraphForDocument(index.value, documentId, depth, options);
  }

  async function createMarkdownDocument(title: string, initialContent = '') {
    await ensureResourcesLoaded();

    const normalizedTitle = title.trim().endsWith('.md') ? title.trim() : `${title.trim()}.md`;
    return repository.createMarkdownNote(normalizedTitle, initialContent);
  }

  async function saveDocumentContent(documentId: string, content: string) {
    return repository.saveResourceContent(documentId, content);
  }

  return {
    index,
    documents,
    repositoryId: repository.repositoryId,
    isSaving: repository.isSaving,
    error: repository.error,
    ensureResourcesLoaded,
    getDocumentById,
    resolveDocument,
    searchDocuments,
    getBacklinks,
    getGraph,
    createMarkdownDocument,
    saveDocumentContent,
  };
}
