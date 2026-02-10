<template>
  <v-chart class="chart" :option="completionOption" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { Goal } from '@dailyuse/goal/domain-client';
import { useTheme } from 'vuetify';

const props = defineProps<{
  goal: Goal | null;
}>();

const theme = useTheme();
const surfaceColor = theme.current.value.colors.surface;
const fontColor = theme.current.value.colors.font;

const keyResults = computed(() => props.goal?.keyResults || []);

// 计算完成情况统计
const completionStats = computed(() => {
  const total = keyResults.value.length;
  const completed = keyResults.value.filter(kr => kr.progress.progressPercentage >= 100).length;
  const inProgress = keyResults.value.filter(kr => kr.progress.progressPercentage > 0 && kr.progress.progressPercentage < 100).length;
  const notStarted = keyResults.value.filter(kr => kr.progress.progressPercentage === 0).length;
  
  return {
    completed,
    inProgress,
    notStarted,
    total,
    completedRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
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
      subtextStyle: { fontSize: 12, color: fontColor }
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
      }
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: { color: fontColor }
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
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            formatter: '{b}\n{c}个'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: stats.completed, 
            name: '已完成',
            itemStyle: { color: '#52c41a' }
          },
          { 
            value: stats.inProgress, 
            name: '进行中',
            itemStyle: { color: '#1890ff' }
          },
          { 
            value: stats.notStarted, 
            name: '未开始',
            itemStyle: { color: '#d9d9d9' }
          }
        ]
      }
    ]
  };
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 300px;
  min-height: 250px;
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
}
</style>
