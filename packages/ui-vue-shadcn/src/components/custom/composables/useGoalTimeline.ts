import { computed, ref, watch, type Ref } from 'vue';
import type { TimelineData, TimelineSnapshot } from '../../application/services/GoalTimelineService';

export const useGoalTimeline = (goalRef: Ref<any>) => {
  const loadingSnapshots = ref(false);
  const currentIndex = ref(0);
  const isPlaying = ref(false);
  const speed = ref<0.5 | 1 | 2>(1);
  const loop = ref(false);

  const timelineData = computed<TimelineData | null>(() => {
    const goal = goalRef.value;
    const keyResults = goal?.keyResults ?? [];
    if (!keyResults.length) return null;

    const snapshot: TimelineSnapshot = {
      timestamp: Date.now(),
      data: {
        totalWeight: keyResults.reduce((sum: number, kr: any) => sum + (kr.weight ?? 0), 0),
        totalProgress:
          keyResults.length === 0
            ? 0
            : keyResults.reduce(
                (sum: number, kr: any) =>
                  sum +
                  ((kr.progress?.targetValue ?? 0) > 0
                    ? ((kr.progress?.currentValue ?? 0) / (kr.progress?.targetValue ?? 1)) * 100
                    : 0),
                0,
              ) / keyResults.length,
        keyResults: keyResults.map((kr: any) => ({
          id: String(kr.id ?? ''),
          title: kr.title ?? 'KR',
          weight: kr.weight ?? 0,
          progress:
            (kr.progress?.targetValue ?? 0) > 0
              ? ((kr.progress?.currentValue ?? 0) / (kr.progress?.targetValue ?? 1)) * 100
              : 0,
        })),
      },
    };

    return {
      snapshots: [snapshot],
      stats: {
        totalSnapshots: 1,
        totalChanges: 0,
        avgWeightChange: 0,
      },
    };
  });

  const currentSnapshot = computed(() => {
    const snapshots = timelineData.value?.snapshots ?? [];
    return snapshots[currentIndex.value] ?? null;
  });

  const hasTimeline = computed(() => (timelineData.value?.snapshots.length ?? 0) > 0);

  watch(
    () => timelineData.value?.snapshots.length,
    () => {
      currentIndex.value = 0;
      isPlaying.value = false;
    },
  );

  return {
    timelineData,
    currentSnapshot,
    hasTimeline,
    loadingSnapshots,
    currentIndex,
    isPlaying,
    speed,
    loop,
  };
};
