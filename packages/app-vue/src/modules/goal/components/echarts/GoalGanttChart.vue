<template>
  <Card class="w-full">
    <CardHeader class="pb-3">
      <CardTitle class="flex items-center gap-2 text-base">
        <GanttChartSquare class="h-4 w-4" />
        {{ t('goal.chart.goalGantt.title') }}
      </CardTitle>
      <CardDescription>{{
        t('goal.chart.goalGantt.description', { n: sortedGoals.length })
      }}</CardDescription>
    </CardHeader>

    <Separator />

    <CardContent class="space-y-4 overflow-x-auto py-4">
      <div class="flex min-w-245 items-center justify-between text-xs text-muted-foreground">
        <div class="w-56">{{ t('goal.chart.goalGantt.goalAxis') }}</div>
        <div class="flex-1 px-2">{{ t('goal.chart.goalGantt.timeAxis') }}</div>
      </div>

      <div class="space-y-3">
        <div
          v-for="goal in sortedGoals"
          :key="String(goal.id)"
          class="flex min-w-245 items-center gap-3"
        >
          <div class="w-56 rounded-md border bg-card px-3 py-2">
            <p class="truncate text-sm font-medium">{{ goal.name }}</p>
            <p class="text-xs text-muted-foreground">{{ getProgressLabel(goal) }}</p>
          </div>

          <div class="relative h-8 flex-1 rounded-md bg-muted">
            <div
              class="absolute top-1/2 h-4 -translate-y-1/2 rounded"
              :style="getGoalBarStyle(goal, false)"
            />
            <div
              class="absolute top-1/2 h-4 -translate-y-1/2 rounded"
              :style="getGoalBarStyle(goal, true)"
            />
            <Badge
              variant="outline"
              class="absolute top-1/2 -translate-y-1/2 text-[10px]"
              :style="{ left: `${getGoalLabelPosition(goal)}%` }"
            >
              {{ getProgressPercent(goal) }}%
            </Badge>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <span class="inline-block h-2 w-2 rounded-full bg-primary" />
          {{ t('goal.chart.goalGantt.completedLegend') }}
        </div>
        <div class="flex items-center gap-1">
          <span class="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
          {{ t('goal.chart.goalGantt.totalLegend') }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GanttChartSquare } from 'lucide-vue-next';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';

const props = withDefaults(
  defineProps<{
    goals?: GoalClientDTO[];
  }>(),
  {
    goals: () => [],
  },
);

const { t } = useI18n();

const dateRange = computed(() => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 10);
  start.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(today.getDate() + 40);
  end.setHours(23, 59, 59, 999);

  return { start, end };
});

const sortedGoals = computed(() => {
  return [...(props.goals ?? [])]
    .filter((goal) => !goal.deletedAt && !goal.archivedAt)
    .sort((a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime());
});

const toDate = (value: string | number | null) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const getProgressPercent = (goal: GoalClientDTO) => {
  const keyResults = goal.keyResults ?? [];
  if (keyResults.length === 0) return 0;

  const total = keyResults.reduce((acc, item) => {
    const target = item.progress.targetValue || 0;
    const current = item.progress.currentValue || 0;
    if (target <= 0) return acc;
    return acc + Math.min(100, Math.max(0, (current / target) * 100));
  }, 0);

  return Math.round(total / keyResults.length);
};

const getProgressLabel = (goal: GoalClientDTO) => {
  return `${getProgressPercent(goal)}% · ${goal.status}`;
};

const daysBetween = (a: Date, b: Date) => {
  const diff = b.getTime() - a.getTime();
  return diff / (1000 * 60 * 60 * 24);
};

const clampPercent = (value: number) => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

const getGoalBarStyle = (goal: GoalClientDTO, filled: boolean) => {
  const start = toDate(goal.startDate);
  const end = toDate(goal.targetDate);
  const range = dateRange.value;
  const totalDays = Math.max(1, daysBetween(range.start, range.end));

  const startOffset = clampPercent((daysBetween(range.start, start) / totalDays) * 100);
  const duration = Math.max(2, (daysBetween(start, end) / totalDays) * 100);
  const width = filled ? Math.max(2, (duration * getProgressPercent(goal)) / 100) : duration;

  return {
    left: `${startOffset}%`,
    width: `${clampPercent(width)}%`,
    background: filled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.35)',
  };
};

const getGoalLabelPosition = (goal: GoalClientDTO) => {
  const start = toDate(goal.startDate);
  const range = dateRange.value;
  const totalDays = Math.max(1, daysBetween(range.start, range.end));
  return clampPercent((daysBetween(range.start, start) / totalDays) * 100 + 1);
};
</script>
