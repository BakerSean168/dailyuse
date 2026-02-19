import { computed, ref } from 'vue';

type WeightTrendData = {
  keyResults: Array<{
    uuid: string;
    title: string;
    data: Array<{ time: number; weight: number }>;
  }>;
};

type WeightComparisonData = {
  keyResults: Array<{ uuid: string; title: string }>;
  timePoints: number[];
  comparisons: Record<string, number[]>;
};

type GoalSnapshotItem = {
  uuid: string;
  keyResultUuid: string;
  trigger: string;
  snapshotTime: number;
  oldWeight: number;
  newWeight: number;
  delta: number;
};

type SnapshotPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const useWeightSnapshot = () => {
  const weightTrend = ref<WeightTrendData | null>(null);
  const weightComparison = ref<WeightComparisonData | null>(null);
  const goalSnapshots = ref<GoalSnapshotItem[]>([]);
  const pagination = ref<SnapshotPagination | null>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const isFetchingTrend = ref(false);
  const isFetchingComparison = ref(false);
  const isLoading = ref(false);

  const hasWeightTrend = computed(() => !!weightTrend.value && weightTrend.value.keyResults.length > 0);
  const hasWeightComparison = computed(() => !!weightComparison.value && weightComparison.value.keyResults.length > 0);
  const hasGoalSnapshots = computed(() => goalSnapshots.value.length > 0);

  const fetchWeightTrend = async (_goalId: string, _startTime?: number, _endTime?: number) => {
    isFetchingTrend.value = true;
    try {
      weightTrend.value = weightTrend.value ?? { keyResults: [] };
    } finally {
      isFetchingTrend.value = false;
    }
  };

  const fetchWeightComparison = async (_goalId: string, _timePoints: number[]) => {
    isFetchingComparison.value = true;
    try {
      weightComparison.value = weightComparison.value ?? {
        keyResults: [],
        timePoints: [],
        comparisons: {},
      };
    } finally {
      isFetchingComparison.value = false;
    }
  };

  const fetchGoalSnapshots = async (_goalId: string, _page = 1, _pageSize = 20) => {
    isLoading.value = true;
    try {
      goalSnapshots.value = goalSnapshots.value ?? [];
      pagination.value = {
        page: _page,
        pageSize: _pageSize,
        total: goalSnapshots.value.length,
        totalPages: 1,
      };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    weightTrend,
    isFetchingTrend,
    hasWeightTrend,
    fetchWeightTrend,

    weightComparison,
    isFetchingComparison,
    hasWeightComparison,
    fetchWeightComparison,

    goalSnapshots,
    pagination,
    isLoading,
    hasGoalSnapshots,
    fetchGoalSnapshots,
  };
};
