<template>
  <Card class="week-calendar">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button variant="outline" size="icon" @click="previousWeek">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <h3 class="text-lg font-semibold">{{ weekRange }}</h3>
          <Button variant="outline" size="icon" @click="nextWeek">
            <ChevronRight class="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" @click="goToToday">{{
            t('schedule.calendar.today')
          }}</Button>
        </div>
      </div>
    </CardHeader>

    <CardContent class="p-0">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin" />
      </div>

      <div v-else class="calendar-container overflow-auto">
        <!-- Header: Days of Week -->
        <div class="calendar-header grid grid-cols-8 border-b-2 sticky top-0 bg-background z-10">
          <div class="time-column-header border-r"></div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="day-header p-3 text-center border-r"
            :class="{ 'bg-primary/10': day.isToday }"
          >
            <div class="text-xs text-muted-foreground">{{ day.dayName }}</div>
            <div class="text-lg font-bold mt-1">{{ day.dateNumber }}</div>
          </div>
        </div>

        <div v-if="weekAllDayCount > 0" class="grid grid-cols-8 border-b bg-muted/20">
          <div class="border-r px-2 py-3 text-right text-xs font-medium text-muted-foreground">
            {{ t('schedule.calendar.allDay') }}
          </div>
          <div
            v-for="day in weekDays"
            :key="`${day.date}-all-day`"
            class="min-h-[56px] space-y-1 border-r px-1.5 py-2"
          >
            <button
              v-for="event in getAllDayEventsForDay(day.date)"
              :key="event.id"
              class="block w-full rounded px-2 py-1 text-left text-[11px] text-white"
              :class="eventBgClass(event)"
              @click="emit('event-click', event)"
            >
              <span class="block truncate">{{ event.title }}</span>
            </button>
          </div>
        </div>

        <!-- Body: Time Slots + Events -->
        <div class="calendar-body grid grid-cols-8 relative">
          <!-- Time Column -->
          <div class="time-column border-r">
            <div
              v-for="hour in hours"
              :key="hour"
              class="time-slot h-15 p-1 text-right text-xs text-muted-foreground border-b"
            >
              {{ formatHour(hour) }}
            </div>
          </div>

          <!-- Day Columns -->
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="day-column relative border-r"
            :class="{ 'bg-primary/5': day.isToday }"
          >
            <!-- Time Slot Backgrounds -->
            <div v-for="hour in hours" :key="hour" class="time-slot-bg h-15 border-b"></div>

            <!-- Events for this day -->
            <div
              v-for="event in getTimedEventsForDay(day.date)"
              :key="event.id"
              class="event-card absolute left-0.5 right-0.5 rounded px-2 py-1 cursor-pointer transition-transform hover:scale-105 z-20 text-white"
              :style="getEventStyle(event)"
              :class="eventBgClass(event)"
              @click="emit('event-click', event)"
            >
              <div class="text-[10px] opacity-90">{{ formatEventTime(event) }}</div>
              <div class="text-xs font-medium truncate">{{ event.title }}</div>
              <AlertCircle v-if="event.hasConflict" class="absolute top-0.5 right-0.5 h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Card, CardContent, CardHeader } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { CalendarEventItem } from '../composables/useCalendarView';

interface Props {
  schedules: CalendarEventItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'week-change', startDate: Date, endDate: Date): void;
  (e: 'event-click', event: CalendarEventItem): void;
}>();

const { t, locale } = useI18n();

const currentWeekStart = ref<Date>(getWeekStart(new Date()));

const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = toDateStr(date);

    days.push({
      date: dateStr,
      dayName: getDayName(date.getDay()),
      dateNumber: date.getDate(),
      isToday: date.getTime() === today.getTime(),
    });
  }

  return days;
});

const weekRange = computed(() => {
  const start = currentWeekStart.value;
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (date: Date) =>
    date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
  return t('schedule.calendar.weekRange', { start: format(start), end: format(end) });
});

const hours = computed(() => Array.from({ length: 24 }, (_, i) => i));

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as week start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayName(day: number): string {
  const dayKeys = [
    'schedule.calendar.daySun',
    'schedule.calendar.dayMon',
    'schedule.calendar.dayTue',
    'schedule.calendar.dayWed',
    'schedule.calendar.dayThu',
    'schedule.calendar.dayFri',
    'schedule.calendar.daySat',
  ];
  return t(dayKeys[day]);
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatEventTime(event: CalendarEventItem): string {
  if (event.displayMode === 'all-day') return t('schedule.calendar.allDay');
  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  return `${fmt(event.startTime)}-${fmt(event.endTime)}`;
}

const weekAllDayCount = computed(
  () => props.schedules.filter((event) => event.displayMode === 'all-day').length,
);

function toDateStr(value: Date | number): string {
  const date = typeof value === 'number' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimedEventsForDay(dateStr: string): CalendarEventItem[] {
  return props.schedules.filter(
    (event) => event.displayMode === 'timed' && toDateStr(event.startTime) === dateStr,
  );
}

function getAllDayEventsForDay(dateStr: string): CalendarEventItem[] {
  return props.schedules.filter(
    (event) => event.displayMode === 'all-day' && toDateStr(event.startTime) === dateStr,
  );
}

function eventBgClass(event: CalendarEventItem): string {
  if (event.hasConflict) return 'bg-warning';
  const map: Record<CalendarEventItem['source'], string> = {
    schedule: 'bg-primary',
    goal: 'bg-success',
    task: 'bg-info',
  };
  return map[event.source];
}

function getEventStyle(event: CalendarEventItem) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const duration = endHour - startHour;

  const top = (startHour / 24) * 100;
  const height = Math.max((duration / 24) * 100, 2);

  return {
    top: `${top}%`,
    height: `${height}%`,
  };
}

function previousWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  currentWeekStart.value = newStart;
}

function nextWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  currentWeekStart.value = newStart;
}

function goToToday() {
  currentWeekStart.value = getWeekStart(new Date());
}

watch(currentWeekStart, (newStart) => {
  const endDate = new Date(newStart);
  endDate.setDate(newStart.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  emit('week-change', newStart, endDate);
});

onMounted(() => {
  const endDate = new Date(currentWeekStart.value);
  endDate.setDate(currentWeekStart.value.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  emit('week-change', currentWeekStart.value, endDate);
});
</script>

<style scoped>
.calendar-container {
  height: calc(100vh - 200px);
}

.time-slot,
.time-slot-bg {
  height: 60px;
}
</style>
