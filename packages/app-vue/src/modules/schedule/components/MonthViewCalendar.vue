<template>
  <div class="month-calendar flex h-full min-h-0 flex-col" data-testid="schedule-month-calendar">
    <div v-if="loading" class="flex-1 flex justify-center items-center">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 border-b">
        <div
          v-for="dayName in weekDayNames"
          :key="dayName"
          class="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
        >
          {{ dayName }}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
        <div
          v-for="day in calendarDays"
          :key="day.key"
          class="border-r border-b last:border-r-0 p-1 overflow-hidden cursor-pointer transition-colors min-h-0"
          :class="{
            'bg-muted/30': !day.isCurrentMonth,
            'bg-primary/5': day.isToday,
            'hover:bg-accent/50': true,
          }"
          @click="handleDayClick(day)"
        >
          <!-- Date Number -->
          <div class="flex items-center justify-between mb-0.5">
            <span
              class="text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full"
              :class="{
                'text-muted-foreground': !day.isCurrentMonth,
                'bg-primary text-primary-foreground': day.isToday,
                'text-foreground': day.isCurrentMonth && !day.isToday,
              }"
            >
              {{ day.date }}
            </span>
            <span v-if="day.events.length > 0" class="text-[10px] text-muted-foreground">
              {{ day.events.length }}
            </span>
          </div>

          <!-- Events (show max 3) -->
          <div class="space-y-0.5">
            <div
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              class="text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer"
              :class="eventClass(event)"
              @click.stop="emit('event-click', event)"
            >
              {{ event.title }}
            </div>
            <div v-if="day.events.length > 3" class="text-[10px] text-muted-foreground px-1">
              +{{ day.events.length - 3 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loader2 } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { toLocalDateKey, type CalendarEventItem } from '../composables/useCalendarView';
// Residual 1282: toDateStr dual retired onto toLocalDateKey sole.

interface CalendarDay {
  key: string;
  date: number;
  fullDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEventItem[];
}

interface Props {
  schedules: CalendarEventItem[];
  month?: Date;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEventItem): void;
  (e: 'day-click', date: Date): void;
}>();
const { t } = useI18n();
const currentMonth = computed(() => props.month ?? new Date());

const weekDayNames = computed(() => {
  const dayKeys = [
    'schedule.calendar.dayMon',
    'schedule.calendar.dayTue',
    'schedule.calendar.dayWed',
    'schedule.calendar.dayThu',
    'schedule.calendar.dayFri',
    'schedule.calendar.daySat',
    'schedule.calendar.daySun',
  ];
  return dayKeys.map((k) => t(k));
});

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateKey(today);

  const firstDay = new Date(year, month, 1);
  let startWeekDay = firstDay.getDay();
  startWeekDay = startWeekDay === 0 ? 6 : startWeekDay - 1; // Monday=0

  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const days: CalendarDay[] = [];

  // Previous month fill
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    const fullDate = toLocalDateKey(date);
    days.push({
      key: `prev-${d}`,
      date: d,
      fullDate,
      isCurrentMonth: false,
      isToday: fullDate === todayStr,
      events: getEventsForDate(fullDate),
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const fullDate = toLocalDateKey(date);
    days.push({
      key: `curr-${d}`,
      date: d,
      fullDate,
      isCurrentMonth: true,
      isToday: fullDate === todayStr,
      events: getEventsForDate(fullDate),
    });
  }

  // Next month fill (to 42 cells)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const fullDate = toLocalDateKey(date);
    days.push({
      key: `next-${d}`,
      date: d,
      fullDate,
      isCurrentMonth: false,
      isToday: fullDate === todayStr,
      events: getEventsForDate(fullDate),
    });
  }

  return days;
});

function getEventsForDate(dateStr: string): CalendarEventItem[] {
  return props.schedules.filter((event) => toLocalDateKey(event.startTime) === dateStr);
}

function eventClass(event: CalendarEventItem): string {
  if (event.hasConflict) {
    return 'bg-warning/15 text-warning';
  }
  const map: Record<CalendarEventItem['source'], string> = {
    schedule: 'bg-primary/10 text-primary',
    goal: 'bg-success/15 text-success',
    task: 'bg-info/15 text-info',
  };
  return map[event.source];
}

function handleDayClick(day: CalendarDay) {
  const [y, m, d] = day.fullDate.split('-').map(Number);
  emit('day-click', new Date(y, m - 1, d));
}

</script>
