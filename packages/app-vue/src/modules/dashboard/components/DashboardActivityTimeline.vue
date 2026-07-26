<script setup lang="ts">
/**
 * DashboardActivityTimeline — 活动时间线（UI_PAGE_REDESIGN_PLAN §2）
 *
 * Collapsible 默认收起：与通知中心信息重叠，先弱化观察使用率。
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ScrollArea,
  Skeleton,
} from '@dailyuse/ui-vue-shadcn';
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Plus,
  Target,
  TrendingUp,
} from '@lucide/vue';
import type { ActivityItem } from '@dailyuse/contracts/dashboard';
import { formatProductPattern, getProductTime } from '../../../shared/utils/product-time';

withDefaults(
  defineProps<{
    items: ActivityItem[];
    loading?: boolean;
  }>(),
  { loading: false },
);

const { t } = useI18n();

const open = ref(false);

/**
 * Residual 1237 (P3): dashboard relative product time.
 * Residual 1309: absolute branch via formatProductPattern (HH:mm dual retired).
 * Near band keeps dashboard.time.* i18n (L4 copy); clock/now via session facade FixedClock-friendly.
 * Beyond Style.relative.maxAgeMs → formatProductRelative absolute fallback (or short m/d pattern).
 */
function formatActivityTime(ts: number): string {
  const now = getProductTime().now();
  const diff = now - ts;
  if (diff < 60_000) return t('dashboard.time.justNow');
  if (diff < 3_600_000) {
    return t('dashboard.time.minutesAgo', { count: Math.floor(diff / 60_000) });
  }
  if (diff < 86_400_000) {
    return t('dashboard.time.hoursAgo', { count: Math.floor(diff / 3_600_000) });
  }
  // Absolute short chrome: Style-backed pattern (not component-local pad).
  return formatProductPattern(ts, 'M/d HH:mm');
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
</script>

<template>
  <Collapsible v-model:open="open">
    <Card class="border-border/50">
      <CollapsibleTrigger
        class="flex w-full items-center justify-between px-4 py-3 text-left"
        data-testid="dashboard-activity-toggle"
      >
        <span class="flex items-center gap-2 text-sm font-medium text-foreground">
          <Activity class="h-4 w-4 text-muted-foreground" />
          {{ t('dashboard.activity.title') }}
        </span>
        <ChevronDown
          class="h-4 w-4 text-muted-foreground transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent class="px-4 pb-4 pt-0">
          <template v-if="loading">
            <div class="space-y-3">
              <div v-for="i in 5" :key="i" class="flex items-start gap-2">
                <Skeleton class="h-5 w-5 shrink-0 rounded-full" />
                <div class="flex-1 space-y-1">
                  <Skeleton class="h-3 w-full" />
                  <Skeleton class="h-3 w-16" />
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="items.length">
            <ScrollArea class="h-[220px]">
              <div class="space-y-1">
                <div
                  v-for="item in items"
                  :key="item.id"
                  class="flex items-start gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <component
                    :is="activityIcon(item.type)"
                    :class="[activityColor(item.type), 'mt-0.5 h-4 w-4 shrink-0']"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs leading-relaxed text-foreground">
                      {{ item.description }}
                    </p>
                    <p class="text-[11px] text-muted-foreground">
                      {{ formatActivityTime(item.timestamp) }}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </template>
          <p v-else class="py-6 text-center text-xs text-muted-foreground">
            {{ t('dashboard.activity.empty') }}
          </p>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>
