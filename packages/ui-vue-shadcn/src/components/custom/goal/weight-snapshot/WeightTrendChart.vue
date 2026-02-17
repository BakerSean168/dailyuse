<template>
  <div class="weight-trend-chart">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>权重趋势分析</span>
        <v-btn-group density="compact">
          <v-btn
            v-for="range in timeRanges"
            :key="range.value"
            :variant="selectedRange === range.value ? 'flat' : 'text'"
            :color="selectedRange === range.value ? 'primary' : undefined"
            size="small"
            @click="handleRangeChange(range.value)"
          >
            {{ range.label }}
          </v-btn>
        </v-btn-group>
      </v-card-title>

      <v-card-text>
        <!-- 加载状态 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" />

        <!-- 空状态 -->
        <v-alert v-else-if="!hasTrendData" type="info" variant="tonal"> 暂无趋势数据 </v-alert>

        <!-- 图表 -->
        <v-chart v-else class="chart" :option="chartOption" autoresize style="height: 400px" />

        <!-- 图例说明 -->
        <div v-if="hasTrendData" class="legend-section mt-4">
          <v-chip
            v-for="kr in trendData?.keyResults"
            :key="kr.uuid"
            :color="getKRColor(kr.uuid)"
            size="small"
            class="mr-2"
          >
            {{ kr.title }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { useWeightSnapshot } from '../../../application/composables/useWeightSnapshot';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  LineChart,
  CanvasRenderer,
]);

const props = defineProps<{
  goalUuid: string;
}>();

const {
  weightTrend: trendData,
  isFetchingTrend: isLoading,
  hasWeightTrend: hasTrendData,
  fetchWeightTrend,
} = useWeightSnapshot();

const selectedRange = ref<'7d' | '30d' | '90d' | '180d'>('30d');

// 时间范围选项
const timeRanges: Array<{ label: string; value: '7d' | '30d' | '90d' | '180d' }> = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
  { label: '半年', value: '180d' },
];

// KR 颜色映射
const krColors = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
];

const getKRColor = (krUuid: string) => {
  const index = trendData.value?.keyResults.findIndex((kr) => kr.uuid === krUuid) || 0;
  return krColors[index % krColors.length];
};

// ECharts 配置
const chartOption = computed(() => {
  if (!trendData.value) return {};

  const { keyResults } = trendData.value;

  // 构建系列数据
  const series = keyResults.map((kr, index) => ({
    name: kr.title,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 2,
    },
    emphasis: {
      focus: 'series',
    },
    data: kr.data.map((point: any) => [point.time, point.weight]),
    itemStyle: {
      color: krColors[index % krColors.length],
    },
  }));

  return {
    title: {
      text: '权重变化趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
      formatter: (params: any) => {
        const time = format(new Date(params[0].value[0]), 'yyyy-MM-dd HH:mm', { locale: zhCN });
        let html = `<div style="padding: 8px;">
          <div style="font-weight: bold; margin-bottom: 8px;">${time}</div>`;

        params.forEach((param: any) => {
          html += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${param.value[1]}%</span>
            </div>`;
        });

        html += '</div>';
        return html;
      },
    },
    legend: {
      data: keyResults.map((kr) => kr.title),
      bottom: 10,
      left: 'center',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '60px',
      top: '60px',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: (value: number) => format(new Date(value), 'MM-dd', { locale: zhCN }),
      },
    },
    yAxis: {
      type: 'value',
      name: '权重 (%)',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 30,
        bottom: 25,
      },
    ],
    series,
  };
});

// 处理时间范围变化
const handleRangeChange = async (range: typeof selectedRange.value) => {
  selectedRange.value = range;
  await loadTrendData();
};

// 加载趋势数据
const loadTrendData = async () => {
  const now = Date.now();
  const days =
    selectedRange.value === '7d'
      ? 7
      : selectedRange.value === '30d'
        ? 30
        : selectedRange.value === '90d'
          ? 90
          : 180;
  const startTime = now - days * 24 * 60 * 60 * 1000;

  await fetchWeightTrend(props.goalUuid, startTime, now);
};

// 初始加载
onMounted(() => {
  loadTrendData();
});
</script>

<style scoped>
.weight-trend-chart {
  width: 100%;
}

.chart {
  width: 100%;
  min-height: 400px;
}

.legend-section {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}
</style>
