import { computed } from 'vue';
import type { GoalSystemView } from '@memoflow/contracts/goal';
import { useGoalStore } from '../stores/goal-store';
export function useGoalFilters(fetchGoals: () => Promise<void>) {
  const store = useGoalStore();
  const systemView = computed(() => store.systemView);
  const hasActiveFilter = computed(() => store.hasActiveFilter);
  const pagination = computed(() => store.pagination);
  function setSystemView(v: GoalSystemView) { store.setSystemView(v); void fetchGoals(); }
  function setPage(p: number) { store.setPage(p); void fetchGoals(); }
  function clearFilters() { store.clearFilters(); void fetchGoals(); }
  function search(q: string) { store.setSearchQuery(q); void fetchGoals(); }
  return { systemView, hasActiveFilter, pagination, setSystemView, setPage, clearFilters, search };
}
