<template>
  <div class="w-full">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-base">权重趋势分析</CardTitle>
        <div class="flex items-center gap-0.5">
          <Button
            v-for="range in timeRanges"
            :key="range.value"
            :variant="selectedRange === range.value ? 'default' : 'ghost'"
            size="sm"
            @click="handleRangeChange(range.value)"
          >
            {{ range.label }}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <!-- 空状态 -->
        <Alert v-else-if="!hasTrendData">
          <Info class="h-4 w-4" />
          <AlertDescription>暂无趋势数据</AlertDescription>
        </Alert>

        <!-- 图表 -->
        <v-chart
          v-else
          class="w-full min-h-[400px]"
          :option="chartOption"
          autoresize
          style="height: 400px"
        />

        <!-- 图例说明 -->
        <div v-if="hasTrendData" class="mt-4 rounded-md bg-muted/30 p-3 flex flex-wrap gap-2">
          <Badge
            v-for="kr in trendData?.keyResults"
            :key="kr.id"
            :style="{
              backgroundColor: getKRColor(kr.id),
              color: '#fff',
              borderColor: getKRColor(kr.id),
            }"
          >
            {{ kr.title }}
          </Badge>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
import { useWeightSnapshot } from '../../application/composables/useWeightSnapshot';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Loader2, Info } from 'lucide-vue-next';

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
  goalId: string;
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

const getKRColor = (krId: string) => {
  const index = trendData.value?.keyResults.findIndex((kr) => kr.id === krId) || 0;
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

  await fetchWeightTrend(props.goalId, startTime, now);
};

// 初始加载
onMounted(() => {
  loadTrendData();
});
</script>
