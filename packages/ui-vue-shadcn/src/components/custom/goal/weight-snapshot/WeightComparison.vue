<template>
  <div class="weight-comparison">
    <v-card>
      <v-card-title>权重对比分析</v-card-title>

      <v-card-text>
        <!-- 时间点选择器 -->
        <div class="time-selector mb-4">
          <v-alert type="info" variant="tonal" class="mb-3"> 最多选择 5 个时间点进行对比 </v-alert>

          <v-row>
            <v-col v-for="(timePoint, index) in selectedTimePoints" :key="index" cols="12" md="6">
              <v-text-field
                v-model="timePoint.label"
                :label="`时间点 ${index + 1}`"
                type="datetime-local"
                density="compact"
                @change="handleTimePointChange(index, $event)"
              >
                <template #append>
                  <v-btn
                    v-if="selectedTimePoints.length > 2"
                    icon="mdi-close"
                    variant="text"
                    size="x-small"
                    @click="removeTimePoint(index)"
                  />
                </template>
              </v-text-field>
            </v-col>
          </v-row>

          <v-btn
            v-if="selectedTimePoints.length < 5"
            prepend-icon="mdi-plus"
            variant="outlined"
            size="small"
            @click="addTimePoint"
          >
            添加时间点
          </v-btn>

          <v-btn
            class="ml-2"
            prepend-icon="mdi-chart-bar"
            color="primary"
            size="small"
            :disabled="!canCompare"
            @click="loadComparison"
          >
            开始对比
          </v-btn>
        </div>

        <!-- 加载状态 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" />

        <!-- 空状态 -->
        <v-alert v-else-if="!hasComparisonData" type="info" variant="tonal">
          请选择时间点并点击"开始对比"
        </v-alert>

        <!-- 对比图表 -->
        <div v-else>
          <!-- 柱状对比图 -->
          <v-chart class="chart" :option="barChartOption" autoresize style="height: 400px" />

          <!-- 雷达对比图 -->
          <v-chart class="chart mt-4" :option="radarChartOption" autoresize style="height: 400px" />

          <!-- 数据表格 -->
          <v-table class="mt-4">
            <thead>
              <tr>
                <th>KeyResult</th>
                <th v-for="(tp, index) in timePointLabels" :key="index">
                  {{ tp }}
                </th>
                <th>总变化</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="kr in comparisonData?.keyResults" :key="kr.uuid">
                <td class="font-weight-medium">{{ kr.title }}</td>
                <td v-for="(weight, index) in getKRWeights(kr.uuid)" :key="index">
                  <v-chip size="small" :color="getWeightChangeColor(weight, index)">
                    {{ weight }}%
                  </v-chip>
                </td>
                <td>
                  <v-chip size="small" :color="getTotalChangeColor(getTotalChange(kr.uuid))">
                    {{ getTotalChange(kr.uuid) > 0 ? '+' : '' }}{{ getTotalChange(kr.uuid) }}%
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>
    </v-card>
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
import { useWeightSnapshot } from '../../../application/composables/useWeightSnapshot';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
  goalUuid: string;
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
const getKRWeights = (krUuid: string) => {
  return comparisonData.value?.comparisons[krUuid] || [];
};

// 获取总变化
const getTotalChange = (krUuid: string) => {
  const weights = getKRWeights(krUuid);
  if (weights.length < 2) return 0;
  return weights[weights.length - 1] - weights[0];
};

// 获取权重变化颜色
const getWeightChangeColor = (weight: number, index: number) => {
  if (index === 0) return 'grey';
  const prev = getKRWeights(comparisonData.value!.keyResults[0].uuid)[index - 1];
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

// 柱状图配置
const barChartOption = computed(() => {
  if (!comparisonData.value) return {};

  const { keyResults, comparisons, timePoints } = comparisonData.value;

  const series = timePoints.map((tp, tpIndex) => ({
    name: format(new Date(tp), 'MM-dd HH:mm', { locale: zhCN }),
    type: 'bar',
    data: keyResults.map((kr) => comparisons[kr.uuid][tpIndex]),
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
    value: keyResults.map((kr) => comparisons[kr.uuid][tpIndex]),
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
  await fetchWeightComparison(props.goalUuid, timestamps);
};

// 初始化时间点标签
onMounted(() => {
  selectedTimePoints.value.forEach((tp, index) => {
    tp.label = format(new Date(tp.timestamp), "yyyy-MM-dd'T'HH:mm");
  });
});
</script>

<style scoped>
.weight-comparison {
  width: 100%;
}

.chart {
  width: 100%;
  min-height: 400px;
}

.time-selector {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}
</style>
