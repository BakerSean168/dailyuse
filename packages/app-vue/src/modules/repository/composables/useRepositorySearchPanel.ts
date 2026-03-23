import { ref } from 'vue';
import type { SearchMode, SearchResultItem } from '@dailyuse/contracts/repository';
import { useEditorWorkspaceActions } from '../../editor/composables/useEditorWorkspaceActions';
import { useRepository } from './useRepository';

export function useRepositorySearchPanel() {
  const { repositoryId, searchResources } = useRepository();
  const { requestOpenResource } = useEditorWorkspaceActions();

  const searchResults = ref<SearchResultItem[]>([]);
  const isSearching = ref(false);
  const hasSearched = ref(false);
  const searchTotalResults = ref(0);
  const searchTotalMatches = ref(0);
  const searchTime = ref(0);

  async function handleSearch(
    query: string,
    mode: SearchMode,
    options: { caseSensitive: boolean; useRegex: boolean },
  ) {
    isSearching.value = true;
    hasSearched.value = true;

    try {
      if (!repositoryId.value) {
        searchResults.value = [];
        searchTotalResults.value = 0;
        searchTotalMatches.value = 0;
        searchTime.value = 0;
        return;
      }

      const result = await searchResources({
        repositoryId: repositoryId.value,
        query,
        mode,
        caseSensitive: options.caseSensitive,
        useRegex: options.useRegex,
      });

      searchResults.value = result.results;
      searchTotalResults.value = result.totalResults;
      searchTotalMatches.value = result.totalMatches;
      searchTime.value = result.searchTime;
    } finally {
      isSearching.value = false;
    }
  }

  function handleSearchSelect(result: SearchResultItem) {
    void requestOpenResource(result.resourceId);
  }

  return {
    searchResults,
    isSearching,
    hasSearched,
    searchTotalResults,
    searchTotalMatches,
    searchTime,
    handleSearch,
    handleSearchSelect,
  };
}
