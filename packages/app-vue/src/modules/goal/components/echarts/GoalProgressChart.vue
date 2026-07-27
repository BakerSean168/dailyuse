<template>
  <v-chart
    class="mb-6 h-55 min-h-45 w-full overflow-hidden rounded-2xl"
    :option="progressOption"
    autoresize
  />
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECElementEvent } from 'echarts';
import VChart from 'vue-echarts';
import { formatProductPattern } from '../../../../shared/utils/product-time';

use([TitleComponent, TooltipComponent, GridComponent, BarChart, CanvasRenderer]);

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { getGoalOverallProgress } from '../../utils/progress';

const { t } = useI18n();

type GoalWithDerivedMetrics = GoalClientDTO & {
  timeRangeSummary?: {
    startDate: number | string | Date | null;
    targetDate: number | string | Date | null;
    actualStartDate: number | string | Date | null;
    actualEndDate: number | string | Date | null;
    remainingDays?: number | null;
  } | null;
  weightedProgress?: number;
  timeProgressPercentage?: number;
  timeProgressRatio?: number;
};

const props = defineProps<{
  goal: GoalWithDerivedMetrics | null;
}>();

const danger_threshold = 20;
const warning_threshold = 10;
const danger_color = '#ff4d4f';
const warning_color = '#faad14';
const safe_color = '#52c41a';

const surfaceColor = 'transparent';
const fontColor = '#64748b';

const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_DURATION = 30 * DAY_MS;

const toTimestamp = (value: number | string | Date | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

const resolveTimeRange = (goal: GoalWithDerivedMetrics | null) => {
  if (!goal) return { start: null, end: null };

  const startCandidates = [goal.startDate, goal.createdAt];
  const endCandidates = [goal.targetDate, goal.completedAt, goal.updatedAt];

  let start = startCandidates.map(toTimestamp).find((value) => value !== null) ?? null;
  let end = endCandidates.map(toTimestamp).find((value) => value !== null) ?? null;

  if (start && (!end || end <= start)) {
    end = start + DEFAULT_DURATION;
  }

  return { start, end };
};

const computeGoalProgress = (goal: GoalWithDerivedMetrics | null): number => {
  return getGoalOverallProgress(goal);
};

const timeRangeSummary = computed(() => props.goal?.timeRangeSummary ?? null);

const fallbackTimeRange = computed(() => resolveTimeRange(props.goal ?? null));

const timeRange = computed(() => {
  const summary = timeRangeSummary.value;
  if (summary) {
    const start = toTimestamp(summary.actualStartDate ?? summary.startDate ?? null);
    const end = toTimestamp(summary.actualEndDate ?? summary.targetDate ?? null);
    return {
      start,
      end,
    };
  }
  return fallbackTimeRange.value;
});

const goalProgress = computed(() => {
  const derived = props.goal?.weightedProgress;
  if (typeof derived === 'number' && !Number.isNaN(derived)) {
    return derived;
  }
  return computeGoalProgress(props.goal ?? null);
});

const timeProgress = computed(() => {
  const derivedPercentage = props.goal?.timeProgressPercentage;
  if (typeof derivedPercentage === 'number' && !Number.isNaN(derivedPercentage)) {
    return derivedPercentage;
  }
  const derivedRatio = props.goal?.timeProgressRatio;
  if (typeof derivedRatio === 'number' && !Number.isNaN(derivedRatio)) {
    return Math.round(derivedRatio * 10000) / 100;
  }
  const { start, end } = timeRange.value;
  if (!start || !end || end <= start) return 0;
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
});

const remainingDays = computed(() => {
  const summary = timeRangeSummary.value;
  if (summary && summary.remainingDays !== undefined && summary.remainingDays !== null) {
    return summary.remainingDays;
  }
  const { end } = timeRange.value;
  if (!end) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
});

const formatDateLabel = (timestamp: number | null) => {
  if (!timestamp) return t('goal.progressChart.notSet');
  return formatProductPattern(timestamp, 'yyyy-MM-dd');
};

const chartData = computed(() => ({
  goal: Number(goalProgress.value.toFixed(1)),
  time: Number(timeProgress.value.toFixed(1)),
}));

const progressDiff = computed(() => chartData.value.goal - chartData.value.time);

const progressOption = computed(() => {
  const diff = progressDiff.value;
  let bgColor = safe_color;
  if (diff <= -danger_threshold) {
    bgColor = danger_color;
  } else if (diff <= -warning_threshold) {
    bgColor = warning_color;
  }

  return {
    backgroundColor: surfaceColor,
    title: {
      text: t('goal.progressChart.title'),
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16 },
    },
    grid: { left: 100, right: 30, top: 50, bottom: 30 },
    tooltip: {
      backgroundColor: surfaceColor,
      borderColor: 'transparent',
      textStyle: {
        color: fontColor,
        fontSize: 14,
      },
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: ECElementEvent) => {
        const dataPoint = Array.isArray(params) ? params[0] : params;
        const name = dataPoint?.name ?? '';
        const value = dataPoint?.value ?? 0;

        if (name === t('goal.progressChart.timeProgress')) {
          const startLabel = formatDateLabel(timeRange.value.start);
          const endLabel = formatDateLabel(timeRange.value.end);
          const days = remainingDays.value;
          const remainingText = days === null ? '—' : `${days}${t('goal.progressChart.remaining')}`;
          return `
        <div>
          <strong>${t('goal.progressChart.timeProgress')}</strong><br/>
          ${startLabel} - ${endLabel}<br/>
          ${remainingText}
        </div>
      `;
        } else if (name === t('goal.progressChart.goalProgress')) {
          const diffValue = chartData.value.goal - chartData.value.time;
          const status =
            diffValue >= 0 ? t('goal.progressChart.ahead') : t('goal.progressChart.behind');
          return `
        <div>
          <strong>${t('goal.progressChart.goalProgress')}</strong><br/>
          ${status}${t('goal.progressChart.timeProgress')} ${Math.abs(diffValue).toFixed(1)}%
        </div>
      `;
        }
        return `${name}: ${value}%`;
      },
    },
    xAxis: {
      max: 100,
      splitLine: { show: false },
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: [t('goal.progressChart.goalProgress'), t('goal.progressChart.timeProgress')],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { fontSize: 14 },
    },
    series: [
      {
        type: 'bar',
        data: [chartData.value.goal, chartData.value.time],
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 14,
          color: fontColor,
        },
        itemStyle: {
          color: bgColor,
          borderRadius: [8, 8, 8, 8],
        },
        barWidth: 18,
      },
    ],
  };
});
</script>
