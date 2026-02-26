<template>
  <div class="w-full">
    <Card>
      <CardHeader>
        <CardTitle>权重对比分析</CardTitle>
      </CardHeader>

      <CardContent>
        <!-- 时间点选择器 -->
        <div class="mb-4 rounded bg-muted/50 p-4">
          <Alert class="mb-3">
            <Info class="h-4 w-4" />
            <AlertDescription>最多选择 5 个时间点进行对比</AlertDescription>
          </Alert>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div
              v-for="(timePoint, index) in selectedTimePoints"
              :key="index"
              class="flex items-end gap-2"
            >
              <div class="flex-1 space-y-1">
                <Label :for="`time-point-${index}`">时间点 {{ index + 1 }}</Label>
                <Input
                  :id="`time-point-${index}`"
                  v-model="timePoint.label"
                  type="datetime-local"
                  @change="handleTimePointChange(index, $event)"
                />
              </div>
              <Button
                v-if="selectedTimePoints.length > 2"
                variant="ghost"
                size="icon-sm"
                @click="removeTimePoint(index)"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <Button
              v-if="selectedTimePoints.length < 5"
              variant="outline"
              size="sm"
              @click="addTimePoint"
            >
              <Plus class="h-4 w-4" />
              添加时间点
            </Button>

            <Button size="sm" :disabled="!canCompare" @click="loadComparison">
              <BarChart3 class="h-4 w-4" />
              开始对比
            </Button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin text-primary" />
        </div>

        <!-- 空状态 -->
        <Alert v-else-if="!hasComparisonData">
          <Info class="h-4 w-4" />
          <AlertDescription>请选择时间点并点击"开始对比"</AlertDescription>
        </Alert>

        <!-- 对比图表 -->
        <div v-else>
          <!-- 柱状对比图 -->
          <v-chart class="h-[400px] w-full" :option="barChartOption" autoresize />

          <!-- 雷达对比图 -->
          <v-chart class="mt-4 h-[400px] w-full" :option="radarChartOption" autoresize />

          <!-- 数据表格 -->
          <div class="mt-4 overflow-x-auto rounded-md border">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-muted/50">
                  <th class="px-4 py-2 text-left font-medium">KeyResult</th>
                  <th
                    v-for="(tp, index) in timePointLabels"
                    :key="index"
                    class="px-4 py-2 text-left font-medium"
                  >
                    {{ tp }}
                  </th>
                  <th class="px-4 py-2 text-left font-medium">总变化</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="kr in comparisonData?.keyResults"
                  :key="kr.id"
                  class="border-b last:border-b-0"
                >
                  <td class="px-4 py-2 font-medium">{{ kr.title }}</td>
                  <td v-for="(weight, index) in getKRWeights(kr.id)" :key="index" class="px-4 py-2">
                    <Badge :variant="getBadgeVariant(getWeightChangeColor(weight, index))">
                      {{ weight }}%
                    </Badge>
                  </td>
                  <td class="px-4 py-2">
                    <Badge :variant="getBadgeVariant(getTotalChangeColor(getTotalChange(kr.id)))">
                      {{ getTotalChange(kr.id) > 0 ? '+' : '' }}{{ getTotalChange(kr.id) }}%
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { BarChart, RadarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { useWeightSnapshot } from '../../application/composables/useWeightSnapshot';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Alert,
  AlertDescription,
  Badge,
  Input,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import { Plus, BarChart3, X, Loader2, Info } from 'lucide-vue-next';

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  BarChart,
  RadarChart,
  CanvasRenderer,
]);

const props = defineProps<{
  goalId: string;
}>();

const {
  weightComparison: comparisonData,
  isFetchingComparison: isLoading,
  hasWeightComparison: hasComparisonData,
  fetchWeightComparison,
} = useWeightSnapshot();

// 时间点选择
interface TimePoint {
  label: string;
  timestamp: number;
}

const selectedTimePoints = ref<TimePoint[]>([
  { label: '', timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000 }, // 60天前
  { label: '', timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000 }, // 30天前
  { label: '', timestamp: Date.now() }, // 现在
]);

// 能否对比
const canCompare = computed(() => {
  return selectedTimePoints.value.every((tp) => tp.timestamp > 0);
});

// 时间点标签
const timePointLabels = computed(() => {
  if (!comparisonData.value) return [];
  return comparisonData.value.timePoints.map((tp) =>
    format(new Date(tp), 'MM-dd HH:mm', { locale: zhCN }),
  );
});

// 添加时间点
const addTimePoint = () => {
  if (selectedTimePoints.value.length < 5) {
    selectedTimePoints.value.push({
      label: '',
      timestamp: Date.now(),
    });
  }
};

// 移除时间点
const removeTimePoint = (index: number) => {
  selectedTimePoints.value.splice(index, 1);
};

// 处理时间点变化
const handleTimePointChange = (index: number, event: any) => {
  const dateStr = event.target?.value || event;
  const timestamp = new Date(dateStr).getTime();
  selectedTimePoints.value[index].timestamp = timestamp;
};

// 获取 KR 权重
const getKRWeights = (krId: string) => {
  return comparisonData.value?.comparisons[krId] || [];
};

// 获取总变化
const getTotalChange = (krId: string) => {
  const weights = getKRWeights(krId);
  if (weights.length < 2) return 0;
  return weights[weights.length - 1] - weights[0];
};

// 获取权重变化颜色
const getWeightChangeColor = (weight: number, index: number) => {
  if (index === 0) return 'grey';
  const prev = getKRWeights(comparisonData.value!.keyResults[0].id)[index - 1];
  if (weight > prev) return 'success';
  if (weight < prev) return 'error';
  return 'grey';
};

// 获取总变化颜色
const getTotalChangeColor = (change: number) => {
  if (change > 0) return 'success';
  if (change < 0) return 'error';
  return 'grey';
};

// 将 Vuetify 颜色映射到 Badge variant
const getBadgeVariant = (color: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (color) {
    case 'success':
      return 'default';
    case 'error':
      return 'destructive';
    case 'grey':
    default:
      return 'secondary';
  }
};

// 柱状图配置
const barChartOption = computed(() => {
  if (!comparisonData.value) return {};

  const { keyResults, comparisons, timePoints } = comparisonData.value;

  const series = timePoints.map((tp, tpIndex) => ({
    name: format(new Date(tp), 'MM-dd HH:mm', { locale: zhCN }),
    type: 'bar',
    data: keyResults.map((kr) => comparisons[kr.id][tpIndex]),
  }));

  return {
    title: {
      text: '权重分布对比（柱状图）',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        let html = `<div style="padding: 8px;">`;
        params.forEach((param: any) => {
          html += `
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${param.value}%</span>
            </div>`;
        });
        html += '</div>';
        return html;
      },
    },
    legend: {
      data: timePoints.map((tp) => format(new Date(tp), 'MM-dd HH:mm', { locale: zhCN })),
      bottom: 10,
    },
    xAxis: {
      type: 'category',
      data: keyResults.map((kr) => kr.title),
      axisLabel: {
        interval: 0,
        rotate: 30,
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
    grid: {
      left: '3%',
      right: '4%',
      bottom: '80px',
      top: '60px',
      containLabel: true,
    },
    series,
  };
});

// 雷达图配置
const radarChartOption = computed(() => {
  if (!comparisonData.value) return {};

  const { keyResults, comparisons, timePoints } = comparisonData.value;

  const indicator = keyResults.map((kr) => ({
    name: kr.title,
    max: 100,
  }));

  const series = timePoints.map((tp, tpIndex) => ({
    value: keyResults.map((kr) => comparisons[kr.id][tpIndex]),
    name: format(new Date(tp), 'MM-dd HH:mm', { locale: zhCN }),
  }));

  return {
    title: {
      text: '权重分布对比（雷达图）',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      data: timePoints.map((tp) => format(new Date(tp), 'MM-dd HH:mm', { locale: zhCN })),
      bottom: 10,
    },
    radar: {
      indicator,
      center: ['50%', '55%'],
      radius: '60%',
    },
    series: [
      {
        type: 'radar',
        data: series,
      },
    ],
  };
});

// 加载对比数据
const loadComparison = async () => {
  const timestamps = selectedTimePoints.value.map((tp) => tp.timestamp);
  await fetchWeightComparison(props.goalId, timestamps);
};

// 初始化时间点标签
onMounted(() => {
  selectedTimePoints.value.forEach((tp, index) => {
    tp.label = format(new Date(tp.timestamp), "yyyy-MM-dd'T'HH:mm");
  });
});
</script>
