<template>
  <div class="day-calendar flex h-full min-h-0 flex-col" data-testid="schedule-day-calendar">
    <div class="min-h-0 flex-1 overflow-auto" data-testid="schedule-calendar-scroll-host">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <div v-else class="relative">
        <div v-if="allDayEvents.length" class="border-b bg-muted/20 px-4 py-3">
          <div class="mb-2 text-xs font-medium text-muted-foreground">
            {{ t('schedule.calendar.allDay') }}
          </div>
          <div class="space-y-2">
            <button
              v-for="event in allDayEvents"
              :key="event.id"
              class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-white"
              :class="calendarEventBgClass(event)"
              @click="emit('event-click', event)"
            >
              <span class="truncate">{{ event.title }}</span>
            </button>
          </div>
        </div>

        <!-- Time slots -->
        <div class="grid grid-cols-[4rem_1fr]">
          <template v-for="hour in hours" :key="hour">
            <!-- Time label -->
            <div
              class="h-16 pr-2 text-right text-xs text-muted-foreground border-b border-r flex items-start justify-end pt-1"
            >
              {{ formatHour(hour) }}
            </div>
            <!-- Slot area -->
            <div class="h-16 border-b relative" :class="{ 'bg-primary/5': isCurrentHour(hour) }">
              <!-- Current time indicator -->
              <div
                v-if="isCurrentHour(hour)"
                class="absolute left-0 right-0 h-0.5 bg-destructive z-10"
                :style="{ top: `${currentMinuteOffset}%` }"
              >
                <div class="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-destructive" />
              </div>
            </div>
          </template>
        </div>

        <!-- Events overlay -->
        <div class="absolute top-0 left-16 right-0 bottom-0">
          <div
            v-for="event in dayEvents"
            :key="event.id"
            class="absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer transition-all hover:shadow-md z-20 text-white text-xs"
            :style="getEventStyle(event)"
            :class="calendarEventBgClass(event)"
            @click="emit('event-click', event)"
          >
            <div class="font-medium truncate">{{ event.title }}</div>
            <div class="opacity-80">{{ formatEventTime(event) }}</div>
            <AlertCircle v-if="event.hasConflict" class="absolute top-1 right-1 h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loader2, AlertCircle } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { calendarEventBgClass, toLocalDateKey, type CalendarEventItem } from '../composables/useCalendarView';
import { formatHour } from '../../../shared/utils/format-hour';

interface Props {
  schedules: CalendarEventItem[];
  date?: Date;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEventItem): void;
}>();
const { t } = useI18n();
const currentDate = computed(() => props.date ?? new Date());

const hours = computed(() => Array.from({ length: 24 }, (_, i) => i));

const dayEvents = computed(() => {
  const dateStr = toLocalDateKey(currentDate.value);
  return props.schedules.filter(
    (event) => event.displayMode === 'timed' && toLocalDateKey(event.startTime) === dateStr,
  );
});

const allDayEvents = computed(() => {
  const dateStr = toLocalDateKey(currentDate.value);
  return props.schedules.filter(
    (event) => event.displayMode === 'all-day' && toLocalDateKey(event.startTime) === dateStr,
  );
});

const currentMinuteOffset = computed(() => {
  const now = new Date();
  return (now.getMinutes() / 60) * 100;
});

function isCurrentHour(hour: number): boolean {
  const now = new Date();
  const today = toLocalDateKey(now);
  return toLocalDateKey(currentDate.value) === today && now.getHours() === hour;
}

// Residual 1276: formatHour dual retired onto shared sole.
// Residual 1282: toDateStr dual retired onto toLocalDateKey sole.
// Residual 1288: eventBgClass dual retired onto calendarEventBgClass sole.
/**
 * Residual 1279 keep-boundary: Day formatEventTime — space-hyphen-space " - " between HH:mm.
 * all-day → i18n; padStart local clock (not Intl).
 * Soft residual 1279: Week compact "-" + formatCalendarEventTimeRange en-dash sole (no force-merge).
 */
function formatEventTime(event: CalendarEventItem): string {
  if (event.displayMode === 'all-day') return t('schedule.calendar.allDay');
  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  return `${fmt(event.startTime)} - ${fmt(event.endTime)}`;
}

function getEventStyle(event: CalendarEventItem) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = Math.max(endMinutes - startMinutes, 15);

  const totalMinutes = 24 * 60;
  const top = (startMinutes / totalMinutes) * (24 * 64); // 24 hours * 64px each
  const height = Math.max((duration / totalMinutes) * (24 * 64), 24);

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

</script>
