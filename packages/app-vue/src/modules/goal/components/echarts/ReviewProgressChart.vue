<template>
  <Card class="overflow-hidden rounded-2xl">
    <CardHeader class="flex flex-row items-center gap-2 pb-2">
      <TrendingUp class="h-5 w-5 text-primary" />
      <CardTitle class="text-lg">{{ t('goal.chart.reviewProgress.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="!review || !goal" class="flex items-center justify-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <div v-else class="space-y-6">
        <!-- 整体进度对比 -->
        <div class="rounded-xl bg-muted/30 p-4">
          <h3 class="mb-4 text-sm font-medium">{{ t('goal.chart.reviewProgress.vsTitle') }}</h3>
          <div class="flex items-center gap-4">
            <div class="flex-1 space-y-2">
              <div class="text-xs text-muted-foreground">
                {{ t('goal.chart.reviewProgress.timeProgress') }}
              </div>
              <div class="relative">
                <Progress :model-value="timeProgress" class="h-6" />
                <span
                  class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary-foreground"
                >
                  {{ timeProgress.toFixed(1) }}%
                </span>
              </div>
            </div>
            <div class="flex-1 space-y-2">
              <div class="text-xs text-muted-foreground">
                {{ t('goal.chart.reviewProgress.goalProgress') }}
              </div>
              <div class="relative">
                <Progress :model-value="goalProgress" class="h-6" />
                <span
                  class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary-foreground"
                >
                  {{ goalProgress.toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex justify-center">
            <Badge :variant="getProgressStatusVariant()">
              <Info class="mr-1 h-3 w-3" />
              {{ getProgressStatusText() }}
            </Badge>
          </div>
        </div>

        <!-- 关键结果进度 -->
        <div class="rounded-xl bg-muted/20 p-4">
          <h3 class="mb-4 text-sm font-medium">{{ t('goal.chart.reviewProgress.krProgress') }}</h3>
          <div class="space-y-4">
            <div
              v-for="(kr, index) in review.keyResultSnapshots"
              :key="kr.keyResultId"
              class="rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium">{{ index + 1 }}. {{ kr.title }}</span>
                <Badge :variant="getProgressBadgeVariant(kr.progressPercentage)">
                  {{ kr.progressPercentage.toFixed(1) }}%
                </Badge>
              </div>
              <Progress :model-value="kr.progressPercentage" class="h-2.5" />
              <div class="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{{ t('goal.chart.reviewProgress.current') }} {{ kr.currentValue }}</span>
                <span>{{ t('goal.chart.reviewProgress.target') }} {{ kr.targetValue }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 不同进度区间的关键结果数量 -->
        <div class="rounded-xl bg-muted/20 p-4">
          <h3 class="mb-4 text-sm font-medium">
            {{ t('goal.chart.reviewProgress.differentRanges') }}
          </h3>
          <div ref="periodChartContainer" style="height: 280px"></div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';

const { t } = useI18n();
import { use } from 'echarts/core';
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

use([GridComponent, TooltipComponent, TitleComponent, BarChart, CanvasRenderer]);

import { Card, CardHeader, CardTitle, CardContent, Progress, Badge } from '@dailyuse/ui-vue-shadcn';
import { TrendingUp, Loader2, Info } from 'lucide-vue-next';
import type {
  GoalReviewClientDTO,
  GoalClientDTO,
  KeyResultClientDTO,
} from '@dailyuse/contracts/goal';

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
  const sum = goalKeyResults.value.reduce((acc, kr) => acc + (kr.weight ?? 1), 0);
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

// 获取进度状态 Badge variant
const getProgressStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const diff = goalProgress.value - timeProgress.value;
  if (diff >= 10) return 'default';
  if (diff >= 0) return 'secondary';
  if (diff >= -10) return 'outline';
  return 'destructive';
};

// 获取 KR 进度 Badge variant
const getProgressBadgeVariant = (
  progress: number,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (progress >= 80) return 'default';
  if (progress >= 60) return 'secondary';
  if (progress >= 40) return 'outline';
  return 'destructive';
};

// 获取进度状态文本
const getProgressStatusText = (): string => {
  const diff = goalProgress.value - timeProgress.value;
  if (diff >= 10) return t('goal.chart.reviewProgress.ahead', { n: diff.toFixed(1) });
  if (diff >= 0) return t('goal.chart.reviewProgress.normal');
  if (diff >= -10) return t('goal.chart.reviewProgress.delay', { n: Math.abs(diff).toFixed(1) });
  return t('goal.chart.reviewProgress.lagging', { n: Math.abs(diff).toFixed(1) });
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
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: bucketLabels,
      axisLabel: {
        color: '#666',
      },
    },
    yAxis: {
      type: 'value',
      name: t('goal.chart.reviewProgress.yAxisName'),
      axisLabel: {
        color: '#666',
      },
    },
    series: [
      {
        name: t('goal.chart.reviewProgress.seriesName'),
        type: 'bar',
        data: bucketData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4CAF50' },
            { offset: 1, color: '#81C784' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#666',
        },
      },
    ],
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
  { deep: true, immediate: true },
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
