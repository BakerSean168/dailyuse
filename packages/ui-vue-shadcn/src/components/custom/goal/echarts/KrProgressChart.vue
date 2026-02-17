<template>
  <v-chart class="chart" :option="krBarOption" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

use([TitleComponent, TooltipComponent, GridComponent, BarChart, CanvasRenderer]);
import { Goal } from '@dailyuse/goal/domain-client';
import { useTheme } from 'vuetify';

const props = defineProps<{
  goal: Goal | null;
}>();
const theme = useTheme();
const surfaceColor = theme.current.value.colors.surface;
const fontColor = theme.current.value.colors.font; // 获取主题主色

const keyResults = computed(() => props.goal?.keyResults || []);

const krNames = computed(() => props.goal?.keyResults?.map((kr) => kr.title) ?? []);
const krProgress = computed(() =>
  props.goal?.keyResults?.map((kr) => kr.progress.progressPercentage) ?? [],
);

const krBarOption = computed(() => {
  const data = keyResults.value.map((kr) => kr.progress.progressPercentage);
  console.log('KR 进度数据:', data);
  const max = data.length ? Math.max(...data) : 0;
  const min = data.length ? Math.min(...data) : 0;
  const maxIdx = data.indexOf(max);
  const minIdx = data.indexOf(min);

  return {
    backgroundColor: surfaceColor,
    title: { text: '关键结果进度', left: 'center', top: 10, textStyle: { fontSize: 16 } },
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
  起始值: ${kr.progress.initialValue ?? 0}<br/>
        目标值: ${kr.progress.targetValue}<br/>
        当前值: ${kr.progress.currentValue}
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

<style scoped>
.chart {
  width: 100%;
  height: 220px;
  min-height: 180px;
  margin-bottom: 24px;

  border-radius: 16px;
  overflow: hidden;
}
</style>
