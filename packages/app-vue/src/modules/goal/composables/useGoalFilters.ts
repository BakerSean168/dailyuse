import { computed } from 'vue';
import type { GoalSystemView } from '@memoflow/contracts/goal';
import { useGoalStore } from '../stores/goal-store';

/**
 * Goal list filter/search state and actions.
 * Delegates fetch to the caller — this composable only manages filter state.
 */
export function useGoalFilters(fetchGoals: () => Promise<void>) {
  const store = useGoalStore();

  const systemView = computed(() => store.systemView);
  const selectedFolderId = computed(() => store.selectedFolderId);
  const hasActiveFilter = computed(() => store.hasActiveFilter);
  const pagination = computed(() => store.pagination);

  function setSystemView(v: GoalSystemView) {
    store.setSystemView(v);
    fetchGoals();
  }

  function setPage(p: number) {
    store.setPage(p);
    fetchGoals();
  }

  function clearFilters() {
    store.clearFilters();
    fetchGoals();
  }

  function search(q: string) {
    store.setSearchQuery(q);
    fetchGoals();
  }

  function setSelectedFolderId(folderId: string | null) {
    store.setSelectedFolderId(folderId);
  }

  return {
    systemView,
    selectedFolderId,
    hasActiveFilter,
    pagination,
    setSystemView,
    setPage,
    clearFilters,
    search,
    setSelectedFolderId,
  };
}
