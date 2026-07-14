<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">{{ t('schedule.dashboard.title') }}</h1>
        <Separator orientation="vertical" class="h-4" />
        <!-- 宽档：日/周/月切换；窄档（split）只渲日视图（V2 §6.3 / §7） -->
        <div v-if="!isNarrow" class="flex items-center gap-1" data-testid="schedule-view-tabs">
          <Button
            v-for="tab in viewTabs"
            :key="tab.value"
            variant="ghost"
            size="sm"
            :class="[
              'h-7 px-3 text-muted-foreground hover:text-foreground',
              activeView === tab.value ? 'bg-secondary font-medium text-foreground' : '',
            ]"
            :data-testid="`schedule-view-tab-${tab.value}`"
            @click="activeView = tab.value"
          >
            <component :is="tab.icon" class="mr-1.5 h-3.5 w-3.5" />
            {{ tab.label }}
          </Button>
        </div>
        <p
          v-else
          class="text-xs text-muted-foreground"
          data-testid="schedule-narrow-day-hint"
        >
          {{ t('schedule.calendar.narrowDayOnly') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button size="sm" class="h-8 gap-2" @click="showCreateDialog = true">
          <Plus class="h-4 w-4" />
          {{ t('schedule.dashboard.createSchedule') }}
        </Button>
      </div>
    </header>

    <!-- Calendar Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Day View（窄档强制日视图） -->
      <DayViewCalendar
        v-if="effectiveView === 'day'"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
        @day-change="handleDayChange"
      />

      <!-- Week View -->
      <WeekViewCalendar
        v-else-if="effectiveView === 'week'"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
        @week-change="handleWeekChange"
      />

      <!-- Month View -->
      <MonthViewCalendar
        v-else-if="effectiveView === 'month'"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
        @month-change="handleMonthChange"
        @day-click="handleDayClick"
      />
    </div>

    <!-- Day Detail Sheet (slides in from right when a month-view date is clicked) -->
    <DayDetailSheet
      v-model:open="dayDetailOpen"
      :date="selectedDate"
      :events="selectedDayEvents"
      @event-click="handleEventClick"
      @view-in-day="switchToDayView"
      @complete-task="handleCompleteTask"
    />

    <!-- Task Event Action Panel (bottom sheet for task events in week/day view) -->
    <TaskEventActionPanel
      v-model:open="taskPanelOpen"
      :event="selectedTaskEvent"
      @complete-task="handleCompleteTask"
    />

    <!-- 非任务事件只读详情（补交互断层，§7-5） -->
    <EventDetailSheet v-model:open="eventDetailOpen" :event="selectedDetailEvent" />

    <CreateScheduleDialog v-model="showCreateDialog" @submit="handleCreateSchedule" />

    <!-- DEV debug panel (only rendered in development) -->
    <DevScheduleDebugPanel :tasks="scheduleTasks" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { CalendarDays, Calendar, CalendarRange, Plus } from '@lucide/vue';
import { Button, Separator } from '@dailyuse/ui-vue-shadcn';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import DayViewCalendar from '../components/DayViewCalendar.vue';
import WeekViewCalendar from '../components/WeekViewCalendar.vue';
import MonthViewCalendar from '../components/MonthViewCalendar.vue';
import DayDetailSheet from '../components/DayDetailSheet.vue';
import TaskEventActionPanel from '../components/TaskEventActionPanel.vue';
import EventDetailSheet from '../components/EventDetailSheet.vue';
import DevScheduleDebugPanel from '../components/DevScheduleDebugPanel.vue';
import { toLocalDateKey, useCalendarView } from '../composables/useCalendarView';
import { useSchedule } from '../composables/useSchedule';
import { useTask } from '../../task/composables/useTask';
import { usePanelWidth } from '../../../layouts/shell/usePanelWidth';
import type { CalendarEventItem } from '../composables/useCalendarView';
import type { CreateScheduleRequest } from '@dailyuse/contracts/schedule';

const { t } = useI18n();
const { events, isLoading, fetchForRange, windowStart, windowEnd } = useCalendarView();
const { tasks: scheduleTasks, createCalendarEntry } = useSchedule();
const task = useTask();
// 面板两档（V2 §6.3/§7）：窄档只渲日视图；宽档允许日/周/月。
const { isNarrow } = usePanelWidth();

const showCreateDialog = ref(false);
const activeView = ref<'day' | 'week' | 'month'>('week');
const effectiveView = computed<'day' | 'week' | 'month'>(() =>
  isNarrow.value ? 'day' : activeView.value,
);

watch(
  isNarrow,
  (narrow) => {
    if (narrow) activeView.value = 'day';
  },
  { immediate: true },
);

// Day detail sheet state
const dayDetailOpen = ref(false);
const selectedDate = ref<Date | null>(null);

// Task event action panel state
const taskPanelOpen = ref(false);
const selectedTaskEvent = ref<CalendarEventItem | null>(null);

// Non-task event detail sheet state（§7-5）
const eventDetailOpen = ref(false);
const selectedDetailEvent = ref<CalendarEventItem | null>(null);

const selectedDayEvents = computed<CalendarEventItem[]>(() => {
  if (!selectedDate.value) return [];
  const dateStr = toLocalDateKey(selectedDate.value);
  return events.value.filter((e) => toLocalDateKey(e.startTime) === dateStr);
});

const viewTabs = computed(() => [
  { label: t('schedule.viewTabs.day'), value: 'day' as const, icon: Calendar },
  { label: t('schedule.viewTabs.week'), value: 'week' as const, icon: CalendarDays },
  { label: t('schedule.viewTabs.month'), value: 'month' as const, icon: CalendarRange },
]);

function handleEventClick(event: CalendarEventItem) {
  if (event.source === 'task') {
    selectedTaskEvent.value = event;
    taskPanelOpen.value = true;
  } else {
    // 只读详情替代此前的 toast（交互断层补位，§7-5）
    selectedDetailEvent.value = event;
    eventDetailOpen.value = true;
  }
}

async function handleCompleteTask(originalId: string) {
  const result = await task.completeInstance(originalId);
  if (result) {
    // Refresh the current window after completing
    if (windowStart.value && windowEnd.value) {
      fetchForRange(windowStart.value, windowEnd.value);
    }
  }
}

function handleDayChange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  fetchForRange(start.getTime(), end.getTime());
}

function handleWeekChange(start: Date, end: Date) {
  fetchForRange(start.getTime(), end.getTime());
}

function handleMonthChange(start: Date, end: Date) {
  fetchForRange(start.getTime(), end.getTime());
}

function handleDayClick(date: Date) {
  // Open day detail sheet instead of switching views
  selectedDate.value = date;
  dayDetailOpen.value = true;
}

function switchToDayView(date: Date | null) {
  if (!date) return;
  dayDetailOpen.value = false;
  activeView.value = 'day';
}

async function handleCreateSchedule(data: CreateScheduleRequest) {
  const result = await createCalendarEntry(data);
  if (result) {
    showCreateDialog.value = false;
    if (windowStart.value && windowEnd.value) {
      await fetchForRange(windowStart.value, windowEnd.value);
    }
    toast.success(t('schedule.toast.scheduleCreated'));
  }
}

onMounted(async () => {
  const now = new Date();
  if (isNarrow.value) {
    // split 窄档：只加载当日窗口
    handleDayChange(now);
    return;
  }
  // 宽档默认周视图窗口
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  await fetchForRange(weekStart.getTime(), weekEnd.getTime());
});
</script>
