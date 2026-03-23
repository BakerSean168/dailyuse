<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">{{ t('schedule.dashboard.title') }}</h1>
        <Separator orientation="vertical" class="h-4" />
        <!-- View Mode Tabs: Day / Week / Month -->
        <div class="flex items-center gap-1">
          <Button
            v-for="tab in viewTabs"
            :key="tab.value"
            variant="ghost"
            size="sm"
            :class="[
              'h-7 px-3 text-muted-foreground hover:text-foreground',
              activeView === tab.value ? 'bg-secondary font-medium text-foreground' : '',
            ]"
            @click="activeView = tab.value"
          >
            <component :is="tab.icon" class="mr-1.5 h-3.5 w-3.5" />
            {{ tab.label }}
          </Button>
        </div>
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
      <!-- Day View -->
      <DayViewCalendar
        v-if="activeView === 'day'"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
        @day-change="handleDayChange"
      />

      <!-- Week View -->
      <WeekViewCalendar
        v-else-if="activeView === 'week'"
        :schedules="events"
        :loading="isLoading"
        @event-click="handleEventClick"
        @week-change="handleWeekChange"
      />

      <!-- Month View -->
      <MonthViewCalendar
        v-else-if="activeView === 'month'"
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

    <CreateScheduleDialog v-model="showCreateDialog" @submit="handleCreateSchedule" />

    <!-- DEV debug panel (only rendered in development) -->
    <DevScheduleDebugPanel :tasks="scheduleTasks" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { CalendarDays, Calendar, CalendarRange, Plus } from 'lucide-vue-next';
import { Button, Separator } from '@dailyuse/ui-vue-shadcn';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import DayViewCalendar from '../components/DayViewCalendar.vue';
import WeekViewCalendar from '../components/WeekViewCalendar.vue';
import MonthViewCalendar from '../components/MonthViewCalendar.vue';
import DayDetailSheet from '../components/DayDetailSheet.vue';
import TaskEventActionPanel from '../components/TaskEventActionPanel.vue';
import DevScheduleDebugPanel from '../components/DevScheduleDebugPanel.vue';
import { toLocalDateKey, useCalendarView } from '../composables/useCalendarView';
import { useSchedule } from '../composables/useSchedule';
import { useTask } from '../../task/composables/useTask';
import type { CalendarEventItem } from '../composables/useCalendarView';

const { t } = useI18n();
const { events, isLoading, fetchForRange, windowStart, windowEnd } = useCalendarView();
const { tasks: scheduleTasks, createCalendarEntry } = useSchedule();
const task = useTask();

const showCreateDialog = ref(false);
const activeView = ref<'day' | 'week' | 'month'>('week');

// Day detail sheet state
const dayDetailOpen = ref(false);
const selectedDate = ref<Date | null>(null);

// Task event action panel state
const taskPanelOpen = ref(false);
const selectedTaskEvent = ref<CalendarEventItem | null>(null);

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
    toast.info(t('schedule.weekViewPage.eventToast', { name: event.title }));
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

async function handleCreateSchedule(data: Record<string, unknown>) {
  const result = await createCalendarEntry(data as any);
  if (result) {
    showCreateDialog.value = false;
    if (windowStart.value && windowEnd.value) {
      await fetchForRange(windowStart.value, windowEnd.value);
    }
    toast.success(t('schedule.toast.scheduleCreated'));
  }
}

onMounted(async () => {
  // Load current week by default
  const now = new Date();
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
