<template>
  <v-chart
    class="mb-6 h-75 min-h-62.5 w-full overflow-hidden rounded-2xl"
    :option="completionOption"
    autoresize
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer]);

const props = defineProps<{
  goal: GoalClientDTO | null;
}>();

const surfaceColor = 'transparent';
const fontColor = '#64748b';

const keyResults = computed(() => props.goal?.keyResults || []);

const getProgressPercentage = (target: number, current: number) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
};

// 计算完成情况统计
const completionStats = computed(() => {
  const total = keyResults.value.length;
  const completed = keyResults.value.filter(
    (kr) => getProgressPercentage(kr.progress.targetValue, kr.progress.currentValue) >= 100,
  ).length;
  const inProgress = keyResults.value.filter((kr) => {
    const percentage = getProgressPercentage(kr.progress.targetValue, kr.progress.currentValue);
    return percentage > 0 && percentage < 100;
  }).length;
  const notStarted = keyResults.value.filter(
    (kr) => getProgressPercentage(kr.progress.targetValue, kr.progress.currentValue) === 0,
  ).length;

  return {
    completed,
    inProgress,
    notStarted,
    total,
    completedRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
  };
});

const completionOption = computed(() => {
  const stats = completionStats.value;

  return {
    backgroundColor: surfaceColor,
    title: {
      text: '关键结果完成情况',
      subtext: `完成率: ${stats.completedRate}%`,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16 },
      subtextStyle: { fontSize: 12, color: fontColor },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: surfaceColor,
      borderColor: 'transparent',
      textStyle: {
        color: fontColor,
        fontSize: 14,
      },
      formatter: (params: any) => {
        const percent = ((params.value / stats.total) * 100).toFixed(1);
        return `${params.name}: ${params.value}个 (${percent}%)`;
      },
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: { color: fontColor },
    },
    series: [
      {
        name: '完成情况',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: surfaceColor,
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            formatter: '{b}\n{c}个',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: stats.completed,
            name: '已完成',
            itemStyle: { color: '#52c41a' },
          },
          {
            value: stats.inProgress,
            name: '进行中',
            itemStyle: { color: '#1890ff' },
          },
          {
            value: stats.notStarted,
            name: '未开始',
            itemStyle: { color: '#d9d9d9' },
          },
        ],
      },
    ],
  };
});
</script>
