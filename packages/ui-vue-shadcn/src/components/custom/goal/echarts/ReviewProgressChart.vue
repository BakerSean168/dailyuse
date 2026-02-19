<template>
  <v-card class="review-progress-chart" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
      <span class="text-h6">目标进度分析</span>
    </v-card-title>
    <v-card-text>
      <div v-if="!review || !goal" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else class="progress-charts">
        <!-- 整体进度对比 -->
        <div class="progress-comparison mb-6">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">
            目标完成进度 vs 时间进度
          </h3>
          <div class="d-flex align-center gap-4">
            <div class="flex-1">
              <div class="text-caption text-medium-emphasis mb-2">时间进度</div>
              <v-progress-linear
                :model-value="timeProgress"
                height="24"
                rounded
                color="grey"
                striped
              >
                <template #default>
                  <strong class="text-white">{{ timeProgress.toFixed(1) }}%</strong>
                </template>
              </v-progress-linear>
            </div>
            <div class="flex-1">
              <div class="text-caption text-medium-emphasis mb-2">目标完成进度</div>
              <v-progress-linear
                :model-value="goalProgress"
                height="24"
                rounded
                :color="getProgressColor(goalProgress)"
              >
                <template #default>
                  <strong class="text-white">{{ goalProgress.toFixed(1) }}%</strong>
                </template>
              </v-progress-linear>
            </div>
          </div>
          <div class="mt-3 text-center">
            <v-chip
              :color="getProgressStatusColor()"
              size="small"
              variant="tonal"
              prepend-icon="mdi-information"
            >
              {{ getProgressStatusText() }}
            </v-chip>
          </div>
        </div>

        <!-- 关键结果进度 -->
        <div class="kr-progress">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">关键结果进度</h3>
          <div class="kr-list">
            <div
              v-for="(kr, index) in review.keyResultSnapshots"
              :key="kr.keyResultId"
              class="kr-item mb-4"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="kr-title">
                  <span class="text-body-2 font-weight-medium">{{ index + 1 }}. {{ kr.title }}</span>
                </div>
                <v-chip
                  size="small"
                  :color="getProgressColor(kr.progressPercentage)"
                  variant="tonal"
                >
                  {{ kr.progressPercentage.toFixed(1) }}%
                </v-chip>
              </div>
              <v-progress-linear
                :model-value="kr.progressPercentage"
                height="10"
                rounded
                :color="getProgressColor(kr.progressPercentage)"
              />
              <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                <span>当前: {{ kr.currentValue }}</span>
                <span>目标: {{ kr.targetValue }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 不同时间段的任务完成数 -->
        <div class="completion-by-period mt-6">
          <h3 class="text-subtitle-1 font-weight-medium mb-4">不同进度区间的关键结果数量</h3>
          <div ref="periodChartContainer" style="height: 280px"></div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import { use } from 'echarts/core';
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

use([GridComponent, TooltipComponent, TitleComponent, BarChart, CanvasRenderer]);
import type { GoalReviewClientDTO, GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';

defineOptions({ name: 'ReviewProgressChart' });

const props = defineProps<{
  review: GoalReviewClientDTO;
  goal: GoalClientDTO;
}>();

const periodChartContainer = ref<HTMLElement>();
let periodChart: echarts.ECharts | null = null;
const handleResize = () => {
  periodChart?.resize();
};

const goalKeyResults = computed<KeyResultClientDTO[]>(() => props.goal.keyResults ?? []);

const weightsByKrId = computed(() => {
  const map = new Map<string, number>();
  goalKeyResults.value.forEach((kr) => {
    map.set(kr.id, kr.weight ?? 1);
  });
  return map;
});

const totalWeight = computed(() => {
  const sum = goalKeyResults.value.reduce(
    (acc, kr) => acc + (kr.weight ?? 1),
    0,
  );
  if (sum > 0) return sum;
  const snapshotCount = props.review.keyResultSnapshots?.length ?? 0;
  return snapshotCount || 1;
});

const goalTimeRange = computed(() => {
  const start = props.goal.startDate ?? props.goal.createdAt;
  const defaultDuration = 30 * 24 * 60 * 60 * 1000;
  const fallbackEnd = start + defaultDuration;
  const candidateEnd =
    props.goal.targetDate ?? props.goal.completedAt ?? props.goal.updatedAt ?? fallbackEnd;
  const end = candidateEnd > start ? candidateEnd : fallbackEnd;
  return { start, end };
});

// 计算时间进度
const timeProgress = computed(() => {
  const { start, end } = goalTimeRange.value;
  if (!start || !end || end <= start) return 100;
  const now = props.review.reviewedAt ?? Date.now();
  const clampedNow = Math.min(Math.max(now, start), end);
  const total = end - start;
  const elapsed = clampedNow - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

// 计算目标完成进度（使用加权进度）
const goalProgress = computed(() => {
  const snapshots = props.review.keyResultSnapshots ?? [];
  if (snapshots.length === 0) return 0;

  const weights = weightsByKrId.value;
  const total = totalWeight.value || snapshots.length;
  const fallbackWeight = total / snapshots.length;

  const weightedSum = snapshots.reduce((sum, snapshot) => {
    const weight = weights.get(snapshot.keyResultId) ?? fallbackWeight;
    return sum + snapshot.progressPercentage * weight;
  }, 0);

  return weightedSum / total;
});

// 获取进度颜色
const getProgressColor = (progress: number | undefined): string => {
  if (progress == null) return 'grey';
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'info';
  if (progress >= 40) return 'warning';
  return 'error';
};

// 获取进度状态颜色
const getProgressStatusColor = (): string => {
  const diff = goalProgress.value - timeProgress.value;
  if (diff >= 10) return 'success';
  if (diff >= 0) return 'info';
  if (diff >= -10) return 'warning';
  return 'error';
};

// 获取进度状态文本
const getProgressStatusText = (): string => {
  const diff = goalProgress.value - timeProgress.value;
  if (diff >= 10) return `进度超前 ${diff.toFixed(1)}%，表现优秀！`;
  if (diff >= 0) return `进度正常，按计划推进`;
  if (diff >= -10) return `进度稍有延迟 ${Math.abs(diff).toFixed(1)}%`;
  return `进度严重滞后 ${Math.abs(diff).toFixed(1)}%，需加快推进`;
};

const progressBuckets = computed(() => {
  const snapshots = props.review.keyResultSnapshots ?? [];
  const ranges = [
    { label: '0-25%', min: 0, max: 25 },
    { label: '25-50%', min: 25, max: 50 },
    { label: '50-75%', min: 50, max: 75 },
    { label: '75-100%', min: 75, max: 100 },
    { label: '100%+', min: 100, max: Infinity },
  ];

  return ranges.map((range) => ({
    label: range.label,
    count: snapshots.filter((snapshot) => {
      const progress = snapshot.progressPercentage ?? 0;
      return progress >= range.min && progress < range.max;
    }).length,
  }));
});

// 初始化进度区间图表
const initPeriodChart = () => {
  if (!periodChartContainer.value) return;

  if (!periodChart) {
    periodChart = echarts.init(periodChartContainer.value);
  }

  if (!progressBuckets.value.length) {
    periodChart.clear();
    return;
  }

  const bucketLabels = progressBuckets.value.map((bucket) => bucket.label);
  const bucketData = progressBuckets.value.map((bucket) => bucket.count);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: bucketLabels,
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '关键结果数量',
      axisLabel: {
        color: '#666'
      }
    },
    series: [
      {
        name: '关键结果数',
        type: 'bar',
        data: bucketData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4CAF50' },
            { offset: 1, color: '#81C784' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#666'
        }
      }
    ]
  };

  periodChart.setOption(option);

  // 响应式调整
  window.addEventListener('resize', handleResize);
};

// 监听数据变化
watch(
  () => [progressBuckets.value, goalTimeRange.value],
  () => {
    nextTick(() => {
      initPeriodChart();
    });
  },
  { deep: true, immediate: true }
);

// 初始化
onMounted(() => {
  nextTick(() => {
    initPeriodChart();
  });
});

// 清理
onBeforeUnmount(() => {
  if (periodChart) {
    periodChart.dispose();
    periodChart = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.review-progress-chart {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.progress-comparison {
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.kr-progress {
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.2);
}

.kr-item {
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
  transition: all 0.2s ease;
}

.kr-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.kr-title {
  flex: 1;
  min-width: 0;
}

.completion-by-period {
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.2);
}
</style>
