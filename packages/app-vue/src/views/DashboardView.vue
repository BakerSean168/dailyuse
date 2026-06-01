<script setup lang="ts">
/**
 * DashboardView - Linear-style aggregated dashboard
 *
 * Sections: stat cards, trend chart, activity timeline,
 * goal progress, task board summary, upcoming schedule, quick actions.
 */

import { onMounted, onBeforeUnmount, computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboard } from '../modules/dashboard/composables/useDashboard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
  Button,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import {
  CheckCircle2,
  Target,
  Bell,
  ListTodo,
  AlertTriangle,
  Calendar,
  ArrowRight,
  TrendingUp,
  Plus,
  RefreshCw,
  Activity,
} from 'lucide-vue-next';
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
import DailyTodoWidget from '../modules/task/components/widgets/DailyTodoWidget.vue';
import UpcomingRemindersWidget from '../modules/reminder/components/widgets/UpcomingRemindersWidget.vue';

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
]);

const router = useRouter();
const {
  stats,
  activityTimeline,
  trendDays,
  goalProgress,
  isLoading,
  error,
  fetchDashboard,
} = useDashboard();

const chartReady = ref(false);
const chartContainerRef = ref<HTMLElement | null>(null);
const reminderWidgetRefreshKey = ref(0);
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
    return alpha === undefined
      ? `hsl(${fallbackToken})`
      : `hsl(${fallbackToken} / ${alpha})`;
  }

  const token =
    getComputedStyle(document.documentElement)
      .getPropertyValue(cssVariableName)
      .trim() || fallbackToken;

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

  void refreshDashboard();
  void nextTick(() => {
    ensureChartReady();
  });
});

watch(isLoading, (loading) => {
  if (loading) {
    chartReady.value = false;
    cancelChartInit();
    return;
  }

  void nextTick(() => {
    ensureChartReady();
  });
});

onBeforeUnmount(() => {
  cancelChartInit();
  themeObserver?.disconnect();
  themeObserver = null;
  chartReady.value = false;
});

// ── Stat cards config ──
const statCards = computed(() => [
  {
    testId: 'dashboard-stat-card-active-tasks',
    label: '进行中任务',
    value: stats.value.activeTasks,
    icon: ListTodo,
    color: 'text-info',
    bg: 'bg-info/15',
    route: '/tasks',
  },
  {
    testId: 'dashboard-stat-card-completed-today',
    label: '今日完成',
    value: stats.value.completedToday,
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/15',
    route: '/tasks',
  },
  {
    testId: 'dashboard-stat-card-active-goals',
    label: '活跃目标',
    value: stats.value.activeGoals,
    icon: Target,
    color: 'text-primary',
    bg: 'bg-primary/15',
    route: '/goals',
  },
  {
    testId: 'dashboard-stat-card-upcoming-reminders',
    label: '待处理提醒',
    value: stats.value.upcomingReminders,
    icon: Bell,
    color: 'text-warning',
    bg: 'bg-warning/15',
    route: '/reminders',
  },
  {
    testId: 'dashboard-stat-card-unread-notifications',
    label: '未读通知',
    value: stats.value.unreadNotifications,
    icon: Activity,
    color: 'text-destructive',
    bg: 'bg-destructive/15',
    route: '/notifications',
  },
  {
    testId: 'dashboard-stat-card-schedule-conflicts',
    label: '日程冲突',
    value: stats.value.scheduleConflicts,
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/15',
    route: '/schedule',
  },
]);

// ── Trend chart option ──
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
    data: trendDays.value.map((d) => d.date.slice(5)),
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
      name: '已完成',
      type: 'bar',
      data: trendDays.value.map((d) => d.tasksCompleted),
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
      name: '新建',
      type: 'line',
      data: trendDays.value.map((d) => d.tasksCreated),
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

// ── Quick actions ──
const quickActions = [
  { label: '新建任务', icon: Plus, route: '/tasks' },
  { label: '查看日程', icon: Calendar, route: '/schedule' },
  { label: '目标总览', icon: Target, route: '/goals' },
  { label: '通知中心', icon: Bell, route: '/notifications' },
];

// ── Helpers ──
function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function activityIcon(type: string) {
  const map: Record<string, typeof CheckCircle2> = {
    task_completed: CheckCircle2,
    goal_updated: Target,
    reminder_fired: Bell,
    task_created: Plus,
    review_added: TrendingUp,
    schedule_created: Calendar,
  };
  return map[type] ?? Activity;
}

function activityColor(type: string): string {
  const map: Record<string, string> = {
    task_completed: 'text-success',
    goal_updated: 'text-primary',
    reminder_fired: 'text-warning',
    task_created: 'text-info',
    review_added: 'text-info',
    schedule_created: 'text-primary',
  };
  return map[type] ?? 'text-muted-foreground';
}

function navigateTo(path: string) {
  router.push(path);
}

async function refreshDashboard() {
  reminderWidgetRefreshKey.value += 1;
  await fetchDashboard();
}
</script>

<template>
  <div class="flex flex-col h-full bg-background" data-testid="dashboard-view">
    <!-- Page Header -->
    <div
      class="flex items-center justify-between px-6 py-3 border-b border-border bg-background sticky top-0 z-10"
    >
      <div>
        <h1 class="text-base font-semibold tracking-tight text-foreground">仪表盘</h1>
        <p class="text-xs text-muted-foreground mt-0.5">全局概览与快速操作</p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          data-testid="dashboard-refresh-button"
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          @click="refreshDashboard"
        >
          <RefreshCw class="w-4 h-4 mr-1" :class="{ 'animate-spin': isLoading }" />
          刷新
        </Button>
      </div>
    </div>

    <!-- Content -->
    <ScrollArea class="flex-1">
      <div class="p-6 space-y-6 max-w-[1400px] mx-auto">
        <!-- Error banner -->
        <div
          v-if="error"
          class="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2"
        >
          <AlertTriangle class="w-4 h-4 shrink-0" />
          {{ error }}
        </div>

        <!-- ═══ Stat Cards ═══ -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <template v-if="isLoading">
            <Card v-for="i in 6" :key="i" class="border-border/50">
              <CardContent class="p-4">
                <Skeleton class="h-4 w-20 mb-3" />
                <Skeleton class="h-8 w-12" />
              </CardContent>
            </Card>
          </template>
          <template v-else>
            <Card
              v-for="card in statCards"
              :key="card.label"
              :data-testid="card.testId"
              class="border-border/50 hover:border-border transition-colors cursor-pointer group"
              @click="navigateTo(card.route)"
            >
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-muted-foreground font-medium">{{ card.label }}</span>
                  <div :class="[card.bg, 'rounded-md p-1.5']">
                    <component :is="card.icon" :class="[card.color, 'w-3.5 h-3.5']" />
                  </div>
                </div>
                <p class="text-2xl font-bold tracking-tight text-foreground">
                  {{ card.value }}
                </p>
              </CardContent>
            </Card>
          </template>
        </div>

        <!-- ═══ Main Grid: Chart + Activity ═══ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Trend Chart -->
          <Card class="lg:col-span-2 border-border/50">
            <CardHeader class="pb-2 px-4 pt-4">
              <CardTitle class="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp class="w-4 h-4 text-muted-foreground" />
                任务趋势 (近 7 天)
              </CardTitle>
            </CardHeader>
            <CardContent class="px-4 pb-4">
              <div ref="chartContainerRef" class="h-[220px] w-full">
                <template v-if="isLoading">
                  <Skeleton class="h-[220px] w-full rounded-lg" />
                </template>
                <template v-else-if="chartReady">
                  <v-chart class="h-[220px] w-full" :option="trendChartOption" autoresize />
                </template>
                <template v-else>
                  <Skeleton class="h-[220px] w-full rounded-lg" />
                </template>
              </div>
            </CardContent>
          </Card>

          <!-- Activity Timeline -->
          <Card class="border-border/50">
            <CardHeader class="pb-2 px-4 pt-4">
              <CardTitle class="text-sm font-medium text-foreground flex items-center gap-2">
                <Activity class="w-4 h-4 text-muted-foreground" />
                最近动态
              </CardTitle>
            </CardHeader>
            <CardContent class="px-4 pb-4">
              <template v-if="isLoading">
                <div class="space-y-3">
                  <div v-for="i in 5" :key="i" class="flex items-start gap-2">
                    <Skeleton class="w-5 h-5 rounded-full shrink-0" />
                    <div class="flex-1 space-y-1">
                      <Skeleton class="h-3 w-full" />
                      <Skeleton class="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <ScrollArea class="h-[220px]">
                  <div class="space-y-1">
                    <div
                      v-for="item in activityTimeline"
                      :key="item.id"
                      class="flex items-start gap-2.5 py-1.5 rounded-md hover:bg-muted/50 px-1 transition-colors"
                    >
                      <component
                        :is="activityIcon(item.type)"
                        :class="[activityColor(item.type), 'w-4 h-4 mt-0.5 shrink-0']"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-xs text-foreground leading-relaxed truncate">
                          {{ item.description }}
                        </p>
                        <p class="text-[11px] text-muted-foreground">
                          {{ formatTime(item.timestamp) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </template>
            </CardContent>
          </Card>
        </div>

        <!-- ═══ Second Row: Goals + Task Board + Schedule ═══ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Goal Progress -->
          <Card class="border-border/50">
            <CardHeader class="pb-2 px-4 pt-4 flex flex-row items-center justify-between">
              <CardTitle class="text-sm font-medium text-foreground flex items-center gap-2">
                <Target class="w-4 h-4 text-muted-foreground" />
                目标进度
              </CardTitle>
              <Button variant="ghost" size="sm" class="h-7 text-xs" @click="navigateTo('/goals')">
                查看全部
                <ArrowRight class="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent class="px-4 pb-4">
              <template v-if="isLoading">
                <div class="space-y-4">
                  <div v-for="i in 4" :key="i" class="space-y-1.5">
                    <Skeleton class="h-3 w-32" />
                    <Skeleton class="h-2 w-full" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="space-y-3">
                  <div v-for="goal in goalProgress" :key="goal.id" class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-foreground font-medium truncate max-w-[60%]">
                        {{ goal.name }}
                      </span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] text-muted-foreground font-mono">
                          {{ goal.progress }}%
                        </span>
                      </div>
                    </div>
                    <Progress :model-value="goal.progress" class="h-1.5" />
                  </div>
                </div>
              </template>
            </CardContent>
          </Card>

          <!-- Daily Todo Widget -->
          <DailyTodoWidget @view-all="navigateTo('/tasks')" />

          <UpcomingRemindersWidget
            :refresh-key="reminderWidgetRefreshKey"
            @view-all="navigateTo('/reminders')"
          />
        </div>

        <!-- ═══ Quick Actions Bar ═══ -->
        <Card class="border-border/50">
          <CardContent class="px-4 py-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-muted-foreground mr-1">快速操作:</span>
              <Button
                v-for="action in quickActions"
                :key="action.label"
                variant="outline"
                size="sm"
                class="h-7 text-xs"
                @click="navigateTo(action.route)"
              >
                <component :is="action.icon" class="w-3.5 h-3.5 mr-1" />
                {{ action.label }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>
