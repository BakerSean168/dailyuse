/**
 * @deprecated Use useTask() instead. This is a backward compatibility shim.
 */
import { computed, ref } from 'vue';

export function useTaskStatistics() {
  const instanceStatistics = ref({ total: 0, completed: 0, pending: 0, skipped: 0, overdue: 0 });
  const completionRate = computed(() => {
    const s = instanceStatistics.value;
    return s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
  });
  const isLoading = ref(false);

  return { instanceStatistics, completionRate, isLoading };
}

export const useTaskStatisticsData = useTaskStatistics;
