<template>
  <div class="month-calendar flex flex-col h-full">
    <!-- Header: Month Navigation -->
    <div class="flex items-center justify-between px-4 py-3 border-b bg-background">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" class="h-8 w-8" @click="previousMonth">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <h3 class="text-lg font-semibold min-w-[160px] text-center">{{ monthTitle }}</h3>
        <Button variant="outline" size="icon" class="h-8 w-8" @click="nextMonth">
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" @click="goToToday">
          {{ t('schedule.calendar.today') }}
        </Button>
      </div>
      <Button size="sm" @click="$emit('create')">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('schedule.calendar.createSchedule') }}
      </Button>
    </div>

    <!-- Month Grid -->
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
              :class="
                event.hasConflict
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-primary/10 text-primary'
              "
              @click.stop="$emit('event-click', event)"
            >
              {{ event.title || event.name }}
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
import { ref, computed, watch, onMounted } from 'vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { ScheduleJobClientDTO } from '@dailyuse/contracts/schedule';

interface CalendarDay {
  key: string;
  date: number;
  fullDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduleJobClientDTO[];
}

interface Props {
  schedules: ScheduleJobClientDTO[];
  loading?: boolean;
}

interface Emits {
  (e: 'month-change', startDate: Date, endDate: Date): void;
  (e: 'create'): void;
  (e: 'event-click', event: ScheduleJobClientDTO): void;
  (e: 'day-click', date: Date): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();
const { t, locale } = useI18n();

const currentMonth = ref<Date>(new Date());

const monthTitle = computed(() => {
  return currentMonth.value.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
  });
});

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
  const todayStr = today.toISOString().split('T')[0];

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Day of week (0=Sun) -> adjust for Monday start
  let startWeekDay = firstDay.getDay();
  startWeekDay = startWeekDay === 0 ? 6 : startWeekDay - 1; // Monday=0

  // Last day of month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const days: CalendarDay[] = [];

  // Previous month fill
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    const fullDate = toDateStr(date);
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
    const fullDate = toDateStr(date);
    days.push({
      key: `curr-${d}`,
      date: d,
      fullDate,
      isCurrentMonth: true,
      isToday: fullDate === todayStr,
      events: getEventsForDate(fullDate),
    });
  }

  // Next month fill (to fill 6 rows = 42 cells)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const fullDate = toDateStr(date);
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

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getEventsForDate(dateStr: string): ScheduleJobClientDTO[] {
  return props.schedules.filter((event) => {
    const eventDate = new Date(event.startTime).toISOString().split('T')[0];
    return eventDate === dateStr;
  });
}

function previousMonth() {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() - 1);
  currentMonth.value = d;
}

function nextMonth() {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() + 1);
  currentMonth.value = d;
}

function goToToday() {
  currentMonth.value = new Date();
}

function handleDayClick(day: CalendarDay) {
  const [y, m, d] = day.fullDate.split('-').map(Number);
  emit('day-click', new Date(y, m - 1, d));
}

function emitMonthRange() {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  emit('month-change', start, end);
}

watch(currentMonth, () => {
  emitMonthRange();
});

onMounted(() => {
  emitMonthRange();
});
</script>
