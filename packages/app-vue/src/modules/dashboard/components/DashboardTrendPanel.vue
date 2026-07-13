<script setup lang="ts">
/**
 * DashboardTrendPanel — 任务趋势图（UI_PAGE_REDESIGN_PLAN §2）
 *
 * Collapsible 默认收起：回顾用途、低频；收起时不初始化 ECharts（延迟渲染）。
 * 图表主题 token 同步逻辑从 DashboardView 原样迁入。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
} from '@dailyuse/ui-vue-shadcn';
import { ChevronDown, TrendingUp } from 'lucide-vue-next';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { TrendDay } from '@dailyuse/contracts/dashboard';

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
]);

const props = withDefaults(
  defineProps<{
    trendDays: TrendDay[];
    loading?: boolean;
  }>(),
  { loading: false },
);

const { t } = useI18n();

const open = ref(false);
const chartReady = ref(false);
const chartContainerRef = ref<HTMLElement | null>(null);
let chartFrameId: number | null = null;
let themeObserver: MutationObserver | null = null;

type ChartThemeTokens = {
  border: string;
  mutedForeground: string;
  popover: string;
  popoverForeground: string;
  chartBar: string;
  chartLine: string;
};

const fallbackThemeTokens = {
  border: '240 5.9% 90%',
  mutedForeground: '240 3.8% 46.1%',
  popover: '0 0% 100%',
  popoverForeground: '240 10% 3.9%',
  chartBar: '12 76% 61%',
  chartLine: '173 58% 39%',
} satisfies Record<string, string>;

const chartTheme = ref<ChartThemeTokens>({
  border: `hsl(${fallbackThemeTokens.border})`,
  mutedForeground: `hsl(${fallbackThemeTokens.mutedForeground})`,
  popover: `hsl(${fallbackThemeTokens.popover})`,
  popoverForeground: `hsl(${fallbackThemeTokens.popoverForeground})`,
  chartBar: `hsl(${fallbackThemeTokens.chartBar})`,
  chartLine: `hsl(${fallbackThemeTokens.chartLine})`,
});

function resolveThemeColor(cssVariableName: string, fallbackToken: string, alpha?: number): string {
  if (typeof window === 'undefined') {
    return alpha === undefined ? `hsl(${fallbackToken})` : `hsl(${fallbackToken} / ${alpha})`;
  }

  const token =
    getComputedStyle(document.documentElement).getPropertyValue(cssVariableName).trim() ||
    fallbackToken;

  return alpha === undefined ? `hsl(${token})` : `hsl(${token} / ${alpha})`;
}

function syncChartTheme() {
  chartTheme.value = {
    border: resolveThemeColor('--border', fallbackThemeTokens.border),
    mutedForeground: resolveThemeColor('--muted-foreground', fallbackThemeTokens.mutedForeground),
    popover: resolveThemeColor('--popover', fallbackThemeTokens.popover),
    popoverForeground: resolveThemeColor(
      '--popover-foreground',
      fallbackThemeTokens.popoverForeground,
    ),
    chartBar: resolveThemeColor('--chart-1', fallbackThemeTokens.chartBar),
    chartLine: resolveThemeColor('--chart-2', fallbackThemeTokens.chartLine),
  };
}

function cancelChartInit() {
  if (chartFrameId !== null) {
    cancelAnimationFrame(chartFrameId);
    chartFrameId = null;
  }
}

function ensureChartReady() {
  cancelChartInit();

  const attempt = () => {
    const container = chartContainerRef.value;
    if (!container) {
      chartReady.value = false;
      return;
    }

    if (container.clientWidth > 0 && container.clientHeight > 0) {
      chartReady.value = true;
      chartFrameId = null;
      return;
    }

    chartReady.value = false;
    chartFrameId = requestAnimationFrame(attempt);
  };

  chartFrameId = requestAnimationFrame(attempt);
}

onMounted(() => {
  syncChartTheme();
  themeObserver = new MutationObserver(() => {
    syncChartTheme();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'style'],
  });
});

watch(open, (isOpen) => {
  if (!isOpen) {
    chartReady.value = false;
    cancelChartInit();
    return;
  }
  void nextTick(() => {
    ensureChartReady();
  });
});

watch(
  () => props.loading,
  (loading) => {
    if (!open.value) return;
    if (loading) {
      chartReady.value = false;
      cancelChartInit();
      return;
    }
    void nextTick(() => {
      ensureChartReady();
    });
  },
);

onBeforeUnmount(() => {
  cancelChartInit();
  themeObserver?.disconnect();
  themeObserver = null;
  chartReady.value = false;
});

const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: chartTheme.value.popover,
    borderColor: chartTheme.value.border,
    textStyle: { color: chartTheme.value.popoverForeground, fontSize: 12 },
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: chartTheme.value.border,
        width: 1,
      },
      label: {
        show: false,
      },
    },
  },
  legend: {
    bottom: 0,
    textStyle: { color: chartTheme.value.mutedForeground, fontSize: 11 },
  },
  grid: { top: 16, right: 16, bottom: 36, left: 40 },
  xAxis: {
    type: 'category',
    data: props.trendDays.map((d) => d.date.slice(5)),
    axisLine: { lineStyle: { color: chartTheme.value.border } },
    axisTick: { show: false },
    axisLabel: { color: chartTheme.value.mutedForeground, fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartTheme.value.border, type: 'dashed' } },
    axisLabel: { color: chartTheme.value.mutedForeground, fontSize: 11 },
  },
  series: [
    {
      name: t('dashboard.chart.completed'),
      type: 'bar',
      data: props.trendDays.map((d) => d.tasksCompleted),
      itemStyle: { color: chartTheme.value.chartBar, borderRadius: [4, 4, 0, 0] },
      emphasis: {
        focus: 'none',
        itemStyle: {
          color: chartTheme.value.chartBar,
          borderRadius: [4, 4, 0, 0],
        },
      },
      barMaxWidth: 24,
    },
    {
      name: t('dashboard.chart.created'),
      type: 'line',
      data: props.trendDays.map((d) => d.tasksCreated),
      smooth: true,
      lineStyle: { color: chartTheme.value.chartLine, width: 2.5 },
      itemStyle: { color: chartTheme.value.chartLine },
      showSymbol: false,
      emphasis: {
        focus: 'none',
        lineStyle: {
          color: chartTheme.value.chartLine,
          width: 2.5,
        },
        itemStyle: {
          color: chartTheme.value.chartLine,
        },
      },
    },
  ],
}));
</script>

<template>
  <Collapsible v-model:open="open">
    <Card class="border-border/50">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between px-4 py-3 text-left"
        data-testid="dashboard-trend-toggle"
      >
        <span class="flex items-center gap-2 text-sm font-medium text-foreground">
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
          {{ t('dashboard.chart.title') }}
        </span>
        <ChevronDown
          class="h-4 w-4 text-muted-foreground transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent class="px-4 pb-4 pt-0">
          <div ref="chartContainerRef" class="h-[220px] w-full">
            <template v-if="loading || !chartReady">
              <Skeleton class="h-[220px] w-full rounded-lg" />
            </template>
            <template v-else>
              <v-chart class="h-[220px] w-full" :option="trendChartOption" autoresize />
            </template>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>
