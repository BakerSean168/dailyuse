/**
 * Search Store
 * Story 11.2: Obsidian 风格搜索
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO, SearchMode, SearchResultItem, SearchRequest, SearchResponse } from '@dailyuse/contracts/repository';
import { repositoryApiClient } from '@/modules/repository/infrastructure/api';


export const useSearchStore = defineStore('repository-search', () => {
  // State
  const results = ref<SearchResultItem[]>([]);
  const totalResults = ref(0);
  const totalMatches = ref(0);
  const searchTime = ref(0);
  const isSearching = ref(false);
  const error = ref<string | null>(null);
  const lastQuery = ref('');
  const lastMode = ref<SearchMode>('all');

  // Search history (localStorage)
  const searchHistory = ref<string[]>([]);
  const MAX_HISTORY = 10;

  // Computed
  const hasResults = computed(() => results.value.length > 0);
  const isEmpty = computed(() => !isSearching.value && results.value.length === 0 && lastQuery.value !== '');

  /**
   * 执行搜索
   */
  async function search(
    repositoryUuid: string,
    query: string,
    mode: SearchMode = 'all',
    options: {
      caseSensitive?: boolean;
      useRegex?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<void> {
    if (!query.trim()) {
      clearResults();
      return;
    }

    try {
      isSearching.value = true;
      error.value = null;
      lastQuery.value = query;
      lastMode.value = mode;

      const response = await repositoryApiClient.search(repositoryUuid, {
        query,
        mode,
        caseSensitive: options.caseSensitive || false,
        useRegex: options.useRegex || false,
        page: options.page || 1,
        pageSize: options.pageSize || 50,
      });

      if (response.ok && response.data) {
        const data = response.data as SearchResponse;
        results.value = data.results;
        totalResults.value = data.totalResults;
        totalMatches.value = data.totalMatches;
        searchTime.value = data.searchTime;

        // 保存到搜索历史
        addToHistory(query);
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      error.value = err instanceof Error ? err.message : 'Search failed';
      clearResults();
    } finally {
      isSearching.value = false;
    }
  }

  /**
   * 清空结果
   */
  function clearResults(): void {
    results.value = [];
    totalResults.value = 0;
    totalMatches.value = 0;
    searchTime.value = 0;
    error.value = null;
  }

  /**
   * 添加到搜索历史
   */
  function addToHistory(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) return;

    // 移除重复项
    searchHistory.value = searchHistory.value.filter(q => q !== trimmed);
    
    // 添加到开头
    searchHistory.value.unshift(trimmed);
    
    // 限制数量
    if (searchHistory.value.length > MAX_HISTORY) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY);
    }

    // 持久化
    saveHistory();
  }

  /**
   * 清空搜索历史
   */
  function clearHistory(): void {
    searchHistory.value = [];
    saveHistory();
  }

  /**
   * 保存历史到 localStorage
   */
  function saveHistory(): void {
    try {
      localStorage.setItem('repository-search-history', JSON.stringify(searchHistory.value));
    } catch (err) {
      console.error('Failed to save search history:', err);
    }
  }

  /**
   * 从 localStorage 加载历史
   */
  function loadHistory(): void {
    try {
      const saved = localStorage.getItem('repository-search-history');
      if (saved) {
        searchHistory.value = JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load search history:', err);
      searchHistory.value = [];
    }
  }

  // 初始化时加载历史
  loadHistory();

  return {
    // State
    results,
    totalResults,
    totalMatches,
    searchTime,
    isSearching,
    error,
    lastQuery,
    lastMode,
    searchHistory,

    // Computed
    hasResults,
    isEmpty,

    // Actions
    search,
    clearResults,
    clearHistory,
  };
});

