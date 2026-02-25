import { computed, ref } from 'vue';

const SEARCH_TARGET_MS = 200;
const DETAIL_TARGET_MS = 500;

export function usePerformanceMonitor() {
  const searchDurationMs = ref<number | null>(null);
  const detailDurationMs = ref<number | null>(null);

  const isSearchWithinTarget = computed(
    () => searchDurationMs.value === null || searchDurationMs.value <= SEARCH_TARGET_MS,
  );

  const isDetailWithinTarget = computed(
    () => detailDurationMs.value === null || detailDurationMs.value <= DETAIL_TARGET_MS,
  );

  async function trackSearch<T>(operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await operation();
    searchDurationMs.value = Math.round(performance.now() - start);

    if (!isSearchWithinTarget.value) {
      console.warn(
        `[governance:perf] Search exceeded target (${searchDurationMs.value}ms > ${SEARCH_TARGET_MS}ms)`,
      );
    }

    return result;
  }

  async function trackDetail<T>(operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await operation();
    detailDurationMs.value = Math.round(performance.now() - start);

    if (!isDetailWithinTarget.value) {
      console.warn(
        `[governance:perf] Detail exceeded target (${detailDurationMs.value}ms > ${DETAIL_TARGET_MS}ms)`,
      );
    }

    return result;
  }

  return {
    searchDurationMs,
    detailDurationMs,
    isSearchWithinTarget,
    isDetailWithinTarget,
    trackSearch,
    trackDetail,
    searchTargetMs: SEARCH_TARGET_MS,
    detailTargetMs: DETAIL_TARGET_MS,
  };
}
