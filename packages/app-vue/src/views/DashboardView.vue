<script setup lang="ts">
/**
 * DashboardView — 完整统计与回顾页（UI_PAGE_REDESIGN_PLAN §2）
 *
 * 从「第二首页」降级：今日概览高频职责由 AI 首页右栏承接（Plan §1），
 * 本页保留全量统计、趋势与活动回顾。
 *
 * 结构：StatStrip → 三列 widget（今日待办 / 即将提醒 / 目标进度）
 *       → 趋势图（Collapsible 收起）→ 活动时间线（Collapsible 收起）。
 * 快捷操作条已删除（与主导航 100% 重复，Brief §4.2）。
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Alert, AlertDescription, Button } from '@dailyuse/ui-vue-shadcn';
import { AlertTriangle, RefreshCw } from 'lucide-vue-next';
import { useDashboard } from '../modules/dashboard/composables/useDashboard';
import ListPageShell from '../components/shared/ListPageShell.vue';
import DashboardStatsStrip from '../modules/dashboard/components/DashboardStatsStrip.vue';
import DashboardTrendPanel from '../modules/dashboard/components/DashboardTrendPanel.vue';
import DashboardActivityTimeline from '../modules/dashboard/components/DashboardActivityTimeline.vue';
import GoalProgressWidget from '../modules/goal/components/widgets/GoalProgressWidget.vue';
import DailyTodoWidget from '../modules/task/components/widgets/DailyTodoWidget.vue';
import UpcomingRemindersWidget from '../modules/reminder/components/widgets/UpcomingRemindersWidget.vue';

const router = useRouter();
const { t } = useI18n();
const { stats, activityTimeline, trendDays, goalProgress, isLoading, error, fetchDashboard } =
  useDashboard();

const reminderWidgetRefreshKey = ref(0);

function navigateTo(path: string) {
  router.push(path);
}

async function refreshDashboard() {
  reminderWidgetRefreshKey.value += 1;
  await fetchDashboard();
}

onMounted(() => {
  void refreshDashboard();
});
</script>

<template>
  <div class="h-full" data-testid="dashboard-view">
    <ListPageShell :title="t('dashboard.title')" :description="t('dashboard.subtitle')">
      <template #actions>
        <Button
          data-testid="dashboard-refresh-button"
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          @click="refreshDashboard"
        >
          <RefreshCw class="mr-1 h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          {{ t('common.refresh') }}
        </Button>
      </template>

      <div class="space-y-6">
        <!-- Error: inline alert + retry（区块级错误约定，§0.3） -->
        <Alert v-if="error" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription class="flex items-center justify-between gap-4">
            <span>{{ error }}</span>
            <Button variant="outline" size="sm" class="h-7 shrink-0" @click="refreshDashboard">
              {{ t('common.retry') }}
            </Button>
          </AlertDescription>
        </Alert>

        <!-- StatStrip：6 数字一行，点击跳转（testid 保留） -->
        <DashboardStatsStrip :stats="stats" :loading="isLoading" @navigate="navigateTo" />

        <!-- 三列 widget：今日待办 / 即将提醒 / 目标进度 -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <DailyTodoWidget @view-all="navigateTo('/tasks')" />
          <UpcomingRemindersWidget
            :refresh-key="reminderWidgetRefreshKey"
            @view-all="navigateTo('/reminders')"
          />
          <GoalProgressWidget
            :goals="goalProgress"
            :loading="isLoading"
            @view-all="navigateTo('/goals')"
            @select="(id) => navigateTo(`/goals/${id}`)"
          />
        </div>

        <!-- 趋势图 / 活动时间线：Collapsible 默认收起 -->
        <DashboardTrendPanel :trend-days="trendDays" :loading="isLoading" />
        <DashboardActivityTimeline :items="activityTimeline" :loading="isLoading" />
      </div>
    </ListPageShell>
  </div>
</template>
