<template>
  <v-chart
    class="mb-6 h-55 min-h-45 w-full overflow-hidden rounded-2xl"
    :option="krBarOption"
    autoresize
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

use([TitleComponent, TooltipComponent, GridComponent, BarChart, CanvasRenderer]);

const { t } = useI18n();

import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { getKeyResultProgressPercentage } from '../../utils/progress';

const props = defineProps<{
  goal: GoalClientDTO | null;
}>();
const surfaceColor = 'transparent';
const fontColor = '#64748b';

const keyResults = computed(() => props.goal?.keyResults || []);

const krNames = computed(() => props.goal?.keyResults?.map((kr) => kr.title) ?? []);
const krProgress = computed(
  () => props.goal?.keyResults?.map((kr) => getKeyResultProgressPercentage(kr.progress)) ?? [],
);

const krBarOption = computed(() => {
  const data = keyResults.value.map((kr) => getKeyResultProgressPercentage(kr.progress));
  const max = data.length ? Math.max(...data) : 0;
  const min = data.length ? Math.min(...data) : 0;
  const maxIdx = data.indexOf(max);
  const minIdx = data.indexOf(min);

  return {
    backgroundColor: surfaceColor,
    title: {
      text: t('goal.chart.krProgressChart.title'),
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16 },
    },
    grid: { left: 60, right: 60, top: 50, bottom: 30 },
    tooltip: {
      show: true,
      backgroundColor: surfaceColor,
      borderColor: 'transparent',
      textStyle: {
        color: fontColor,
        fontSize: 14,
      },

      formatter: (params: any) => {
        const kr = keyResults.value[params.dataIndex];
        if (!kr) return '';
        // 获取当前柱子的颜色
        let color = '#5470C6';
        if (params.dataIndex === maxIdx) color = '#52c41a';
        if (params.dataIndex === minIdx) color = '#ff4d4f';
        // 拼接圆圈和 label
        return `
      <div style="display:flex;align-items:center;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>
        <span style="font-weight:bold;">${params.name}</span>
      </div>
      <div>
  ${t('goal.chart.krProgressChart.tooltipStart')} ${kr.progress.initialValue ?? 0}<br/>
        ${t('goal.chart.krProgressChart.tooltipTarget')} ${kr.progress.targetValue}<br/>
        ${t('goal.chart.krProgressChart.tooltipCurrent')} ${kr.progress.currentValue}
      </div>
    `;
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
      data: krNames.value,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { fontSize: 14 },
    },
    series: [
      {
        type: 'bar',
        data: data,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 14,
          color: fontColor,
        },
        itemStyle: {
          color: (params: any) => {
            if (params.dataIndex === maxIdx) return '#52c41a'; // 绿色
            if (params.dataIndex === minIdx) return '#ff4d4f'; // 红色
            return '#5470C6'; // 其他
          },
          borderRadius: [8, 8, 8, 8],
        },
        barWidth: 18,
      },
    ],
  };
});
</script>
