<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  formatCapsuleTime,
  formatScheduleCapsuleLabel,
  toLocalDateKey,
  type ScheduleCapsuleSnapshot,
  useCalendarView,
} from '../../../modules/schedule/composables/useCalendarView';

defineEmits<{
  'view-all': [];
}>();

const { t } = useI18n();
const calendar = useCalendarView();
const isLoading = ref(false);
const snapshot = ref<ScheduleCapsuleSnapshot>({
  kind: 'empty',
  event: null,
  minutesUntilStart: null,
});

const label = computed(() =>
  formatScheduleCapsuleLabel(
    snapshot.value,
    t as (key: string, params?: Record<string, unknown>) => string,
  ),
);

/**
 * Phase 5：后续事件列表（summary 行之后）。展示今天剩余的 upcoming 事件
 * （跳过 summary 已显示的 current/next），最多 2 条 + 剩余数量。
 */
const UPCOMING_DISPLAY_LIMIT = 2;
const upcomingEvents = computed(() => {
  const now = Date.now();
  const todayKey = toLocalDateKey(now);
  const focus = snapshot.value.event?.startTime ?? now;
  return calendar.events.value
    .filter(
      (event) =>
        toLocalDateKey(event.startTime) === todayKey &&
        event.startTime > focus &&
        event.displayMode !== 'all-day',
    )
    .sort((a, b) => a.startTime - b.startTime);
});
const upcomingList = computed(() => upcomingEvents.value.slice(0, UPCOMING_DISPLAY_LIMIT));
const upcomingRemaining = computed(() =>
  Math.max(0, upcomingEvents.value.length - UPCOMING_DISPLAY_LIMIT),
);

async function load(): Promise<void> {
  isLoading.value = true;
  try {
    await calendar.ensureTodayLoaded();
    snapshot.value = calendar.getScheduleCapsuleSnapshot();
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="space-y-3" data-testid="schedule-capsule-preview">
    <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
      <p class="text-xs font-bold">{{ t('nav.schedule') }}</p>
      <span class="text-[10px] text-muted-foreground">{{ t('shell.home.title') }}</span>
    </div>

    <div v-if="isLoading" class="space-y-2 py-2" data-testid="schedule-capsule-loading">
      <div class="h-3 w-4/5 animate-pulse rounded bg-muted" />
      <div class="h-3 w-3/5 animate-pulse rounded bg-muted" />
    </div>
    <p
      v-else-if="!label"
      class="py-3 text-center text-[11px] text-muted-foreground"
      data-testid="schedule-capsule-empty"
    >
      {{ t('shell.schedule.empty') }}
    </p>
    <p
      v-else
      class="rounded-md bg-accent/60 px-2.5 py-2 text-xs leading-5"
      data-testid="schedule-capsule-summary"
    >
      {{ label }}
    </p>

    <!-- Phase 5：后续事件列表（当前/下一个之后），最多 2 条 + 剩余数量。 -->
    <div v-if="upcomingList.length" class="space-y-1.5" data-testid="schedule-capsule-upcoming">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {{ t('shell.schedule.upcomingTitle') }}
      </p>
      <div
        v-for="event in upcomingList"
        :key="event.id"
        class="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
      >
        <span class="shrink-0 text-muted-foreground">{{ formatCapsuleTime(event.startTime) }}</span>
        <span class="min-w-0 truncate">{{ event.title }}</span>
      </div>
      <p
        v-if="upcomingRemaining > 0"
        class="px-1 text-[10px] text-muted-foreground"
        data-testid="schedule-capsule-more"
      >
        {{ t('shell.schedule.moreCount', { count: upcomingRemaining }) }}
      </p>
    </div>

    <button
      type="button"
      class="block w-full rounded-md border border-border/60 bg-accent py-1.5 text-center text-xs font-medium transition-colors hover:bg-accent/80"
      data-testid="schedule-capsule-view-all"
      @click="$emit('view-all')"
    >
      {{ t('shell.openSchedule') }}
    </button>
  </div>
</template>
