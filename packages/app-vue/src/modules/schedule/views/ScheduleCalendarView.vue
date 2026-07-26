<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden bg-background"
    data-testid="schedule-calendar-view"
  >
    <header
      class="z-10 flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b bg-background/80 px-2 py-2 backdrop-blur-sm @2xl/panel:px-4"
      data-testid="schedule-page-toolbar"
    >
      <div
        class="flex min-w-0 items-center gap-1"
        role="tablist"
        :aria-label="t('schedule.route.calendar')"
        data-testid="schedule-view-tabs"
      >
        <Button
          v-for="tab in viewTabs"
          :key="tab.value"
          variant="ghost"
          size="sm"
          role="tab"
          :aria-selected="activeView === tab.value"
          :aria-label="tab.label"
          :class="[
            'h-8 px-2 text-muted-foreground hover:text-foreground @xl/panel:px-3',
            activeView === tab.value ? 'bg-secondary font-medium text-foreground' : '',
          ]"
          :data-testid="`schedule-view-tab-${tab.value}`"
          @click="activeView = tab.value"
        >
          <component :is="tab.icon" class="h-4 w-4 @xl/panel:mr-1.5" />
          <span class="hidden @xl/panel:inline">{{ tab.label }}</span>
        </Button>
      </div>

      <div
        class="order-last flex w-full min-w-0 items-center justify-center gap-1 @3xl/panel:order-none @3xl/panel:w-auto"
        data-testid="schedule-period-navigation"
      >
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8 shrink-0"
          :aria-label="t('schedule.calendar.previousPeriod')"
          data-testid="schedule-previous-period"
          @click="movePeriod(-1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <p
          class="min-w-0 max-w-44 flex-1 truncate text-center text-sm font-medium @3xl/panel:w-48 @3xl/panel:flex-none"
          data-testid="schedule-period-label"
        >
          {{ currentPeriodTitle }}
        </p>
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8 shrink-0"
          :aria-label="t('schedule.calendar.nextPeriod')"
          data-testid="schedule-next-period"
          @click="movePeriod(1)"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" class="h-8 shrink-0 px-2" @click="goToToday">
          {{ t('schedule.calendar.today') }}
        </Button>
      </div>

      <Button
        size="sm"
        class="ml-auto h-8 shrink-0 px-2 @xl/panel:px-3"
        :aria-label="t('schedule.dashboard.createSchedule')"
        data-primary-action="create-schedule"
        data-testid="create-schedule-button"
        @click="showCreateDialog = true"
      >
        <Plus class="h-4 w-4 @xl/panel:mr-1.5" />
        <span class="hidden @xl/panel:inline">{{ t('schedule.dashboard.createSchedule') }}</span>
      </Button>
    </header>

    <div
      class="min-h-0 flex-1 overflow-hidden"
      data-testid="schedule-calendar-content"
    >
      <DayViewCalendar
        v-if="activeView === 'day'"
        :date="calendarDate"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
      />

      <WeekViewCalendar
        v-else-if="activeView === 'week'"
        :start-date="calendarDate"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
      />

      <MonthViewCalendar
        v-else
        :month="calendarDate"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
        @day-click="handleDayClick"
      />
    </div>

    <DayDetailSheet
      v-model:open="dayDetailOpen"
      :date="selectedDate"
      :events="selectedDayEvents"
      @event-click="handleEventClick"
      @view-in-day="switchToDayView"
      @complete-task="handleCompleteTask"
    />

    <TaskEventActionPanel
      v-model:open="taskPanelOpen"
      :event="selectedTaskEvent"
      @complete-task="handleCompleteTask"
    />

    <EventDetailSheet v-model:open="eventDetailOpen" :event="selectedDetailEvent" />
    <CreateScheduleDialog v-model="showCreateDialog" @submit="handleCreateSchedule" />
    <DevScheduleDebugPanel :tasks="scheduleTasks" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import {
  CalendarDays,
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
} from '@lucide/vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import DayViewCalendar from '../components/DayViewCalendar.vue';
import WeekViewCalendar from '../components/WeekViewCalendar.vue';
import MonthViewCalendar from '../components/MonthViewCalendar.vue';
import DayDetailSheet from '../components/DayDetailSheet.vue';
import TaskEventActionPanel from '../components/TaskEventActionPanel.vue';
import EventDetailSheet from '../components/EventDetailSheet.vue';
import DevScheduleDebugPanel from '../components/DevScheduleDebugPanel.vue';
import { getWeekStart, toLocalDateKey, useCalendarView } from '../composables/useCalendarView';
import { getProductTime } from '@/shared/utils/product-time';
// Residual 1285: getWeekStart dual retired onto schedule sole.
import { useSchedule } from '../composables/useSchedule';
import { useTask } from '../../task/composables/useTask';
import type { CalendarEventItem } from '../composables/useCalendarView';
import type { CreateScheduleRequest } from '@dailyuse/contracts/schedule';

type CalendarView = 'day' | 'week' | 'month';

const { t } = useI18n();
const { events, isLoading, fetchForRange, windowStart, windowEnd } = useCalendarView();
const { tasks: scheduleTasks, createCalendarEntry } = useSchedule();
const task = useTask();

const showCreateDialog = ref(false);
const activeView = ref<CalendarView>('week');
const calendarDate = ref(new Date());
const dayDetailOpen = ref(false);
const selectedDate = ref<Date | null>(null);
const taskPanelOpen = ref(false);
const selectedTaskEvent = ref<CalendarEventItem | null>(null);
const eventDetailOpen = ref(false);
const selectedDetailEvent = ref<CalendarEventItem | null>(null);

const selectedDayEvents = computed<CalendarEventItem[]>(() => {
  if (!selectedDate.value) return [];
  const dateStr = toLocalDateKey(selectedDate.value);
  return events.value.filter((event) => toLocalDateKey(event.startTime) === dateStr);
});

const viewTabs = computed(() => [
  { label: t('schedule.viewTabs.day'), value: 'day' as const, icon: Calendar },
  { label: t('schedule.viewTabs.week'), value: 'week' as const, icon: CalendarDays },
  { label: t('schedule.viewTabs.month'), value: 'month' as const, icon: CalendarRange },
]);

const currentPeriodTitle = computed(() => {
  if (activeView.value === 'day') {
    return getProductTime().format.slot('periodDay', calendarDate.value.getTime());
  }

  if (activeView.value === 'month') {
    return getProductTime().format.slot('periodMonth', calendarDate.value.getTime());
  }

  const start = getWeekStart(calendarDate.value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const format = (date: Date) => getProductTime().format.slot('chartMonthDay', date.getTime());
  return t('schedule.calendar.weekRange', { start: format(start), end: format(end) });
});

function resolveCalendarWindow(view: CalendarView, date: Date) {
  if (view === 'day') {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (view === 'month') {
    return {
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function refreshCalendar() {
  const { start, end } = resolveCalendarWindow(activeView.value, calendarDate.value);
  await fetchForRange(start.getTime(), end.getTime());
}

function movePeriod(direction: -1 | 1) {
  const nextDate = new Date(calendarDate.value);
  if (activeView.value === 'month') {
    nextDate.setDate(1);
    nextDate.setMonth(nextDate.getMonth() + direction);
  } else {
    nextDate.setDate(nextDate.getDate() + direction * (activeView.value === 'week' ? 7 : 1));
  }
  calendarDate.value = nextDate;
}

function goToToday() {
  calendarDate.value = new Date();
}

function handleEventClick(event: CalendarEventItem) {
  if (event.source === 'task') {
    selectedTaskEvent.value = event;
    taskPanelOpen.value = true;
  } else {
    selectedDetailEvent.value = event;
    eventDetailOpen.value = true;
  }
}

async function handleCompleteTask(originalId: string) {
  const result = await task.completeInstance(originalId);
  if (result && windowStart.value && windowEnd.value) {
    await fetchForRange(windowStart.value, windowEnd.value);
  }
}

function handleDayClick(date: Date) {
  selectedDate.value = date;
  dayDetailOpen.value = true;
}

function switchToDayView(date: Date | null) {
  if (!date) return;
  dayDetailOpen.value = false;
  calendarDate.value = new Date(date);
  activeView.value = 'day';
}

async function handleCreateSchedule(data: CreateScheduleRequest) {
  const result = await createCalendarEntry(data);
  if (result) {
    showCreateDialog.value = false;
    await refreshCalendar();
    toast.success(t('schedule.toast.scheduleCreated'));
  }
}

watch([activeView, calendarDate], () => void refreshCalendar(), { immediate: true });
</script>
