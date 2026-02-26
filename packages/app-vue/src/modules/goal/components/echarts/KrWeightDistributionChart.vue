<template>
  <v-chart
    class="mb-6 h-75 min-h-62.5 w-full overflow-hidden rounded-2xl"
    :option="weightOption"
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

// 计算权重分布
const weightData = computed(() => {
  const totalWeight = keyResults.value.reduce((sum, kr) => sum + (kr.weight || 0), 0);

  return keyResults.value.map((kr) => {
    const weight = kr.weight || 0;
    const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0';
    return {
      name: kr.title,
      value: weight,
      percentage,
      totalWeight,
    };
  });
});

const weightOption = computed(() => {
  const data = weightData.value;
  const totalWeight = data.length > 0 ? data[0].totalWeight : 0;

  return {
    backgroundColor: surfaceColor,
    title: {
      text: '关键结果权重分布',
      subtext: `总权重: ${totalWeight}`,
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
        const item = data[params.dataIndex];
        return `
          <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
          <div>权重: ${item.value}/10</div>
          <div>占比: ${item.percentage}%</div>
        `;
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
        name: '权重分布',
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
            fontSize: 16,
            fontWeight: 'bold',
            formatter: (params: any) => {
              const item = data[params.dataIndex];
              return `${params.name}\n权重: ${item.value}\n占比: ${item.percentage}%`;
            },
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: [
              '#5470c6',
              '#91cc75',
              '#fac858',
              '#ee6666',
              '#73c0de',
              '#3ba272',
              '#fc8452',
              '#9a60b4',
              '#ea7ccc',
            ][index % 9],
          },
        })),
      },
    ],
  };
});
</script>
