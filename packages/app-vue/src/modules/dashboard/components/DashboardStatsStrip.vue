<script setup lang="ts">
/**
 * DashboardStatsStrip — 6 项统计压成一行紧凑数字条（UI_PAGE_REDESIGN_PLAN §2）
 *
 * 替代原 6 张统计卡阵列；保留 `dashboard-stat-card-*` testid 与点击跳转。
 * 窄屏横向滚动、不换行。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Skeleton } from '@dailyuse/ui-vue-shadcn';
import {
  CheckCircle2,
  Target,
  Bell,
  ListTodo,
  AlertTriangle,
  Activity,
} from 'lucide-vue-next';
import type { DashboardStats } from '@dailyuse/contracts/dashboard';

const props = withDefaults(
  defineProps<{
    stats: DashboardStats;
    loading?: boolean;
  }>(),
  { loading: false },
);

const emit = defineEmits<{ navigate: [path: string] }>();

const { t } = useI18n();

const items = computed(() => [
  {
    testId: 'dashboard-stat-card-active-tasks',
    label: t('dashboard.stats.activeTasks'),
    value: props.stats.activeTasks,
    icon: ListTodo,
    color: 'text-info',
    route: '/tasks',
  },
  {
    testId: 'dashboard-stat-card-completed-today',
    label: t('dashboard.stats.completedToday'),
    value: props.stats.completedToday,
    icon: CheckCircle2,
    color: 'text-success',
    route: '/tasks',
  },
  {
    testId: 'dashboard-stat-card-active-goals',
    label: t('dashboard.stats.activeGoals'),
    value: props.stats.activeGoals,
    icon: Target,
    color: 'text-primary',
    route: '/goals',
  },
  {
    testId: 'dashboard-stat-card-upcoming-reminders',
    label: t('dashboard.stats.upcomingReminders'),
    value: props.stats.upcomingReminders,
    icon: Bell,
    color: 'text-warning',
    route: '/reminders',
  },
  {
    testId: 'dashboard-stat-card-unread-notifications',
    label: t('dashboard.stats.unreadNotifications'),
    value: props.stats.unreadNotifications,
    icon: Activity,
    color: 'text-destructive',
    route: '/notifications',
  },
  {
    testId: 'dashboard-stat-card-schedule-conflicts',
    label: t('dashboard.stats.scheduleConflicts'),
    value: props.stats.scheduleConflicts,
    icon: AlertTriangle,
    color: 'text-warning',
    route: '/schedule',
  },
]);
</script>

<template>
  <div
    class="flex items-stretch gap-2 overflow-x-auto rounded-lg border border-border/50 bg-card p-1"
    data-testid="dashboard-stats-strip"
  >
    <template v-if="loading">
      <div v-for="i in 6" :key="i" class="flex min-w-[9rem] flex-1 items-center gap-2.5 px-3 py-2">
        <Skeleton class="h-4 w-4 rounded" />
        <div class="space-y-1">
          <Skeleton class="h-4 w-8" />
          <Skeleton class="h-3 w-16" />
        </div>
      </div>
    </template>
    <template v-else>
      <button
        v-for="(item, i) in items"
        :key="item.testId"
        :data-testid="item.testId"
        type="button"
        class="flex min-w-[9rem] flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50"
        :class="i > 0 ? 'border-l border-border/40' : ''"
        @click="emit('navigate', item.route)"
      >
        <component :is="item.icon" :class="[item.color, 'h-4 w-4 shrink-0']" />
        <div class="min-w-0">
          <p class="text-lg font-bold leading-none tracking-tight text-foreground">
            {{ item.value }}
          </p>
          <p class="mt-1 truncate text-[11px] text-muted-foreground">{{ item.label }}</p>
        </div>
      </button>
    </template>
  </div>
</template>
