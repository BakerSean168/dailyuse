<template>
  <div class="day-calendar flex flex-col h-full">
    <!-- Header: Date Navigation -->
    <div class="flex items-center justify-between px-4 py-3 border-b bg-background">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" class="h-8 w-8" @click="previousDay">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <h3 class="text-lg font-semibold min-w-[200px] text-center">{{ dayTitle }}</h3>
        <Button variant="outline" size="icon" class="h-8 w-8" @click="nextDay">
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

    <!-- Day Grid -->
    <div class="flex-1 overflow-auto">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <div v-else class="relative">
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
                class="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                :style="{ top: `${currentMinuteOffset}%` }"
              >
                <div class="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
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
            :class="event.hasConflict ? 'bg-orange-500' : 'bg-primary'"
            @click="$emit('event-click', event)"
          >
            <div class="font-medium truncate">{{ event.title || event.name }}</div>
            <div class="opacity-80">{{ formatEventTime(event) }}</div>
            <AlertCircle v-if="event.hasConflict" class="absolute top-1 right-1 h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { ChevronLeft, ChevronRight, Plus, Loader2, AlertCircle } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { ScheduleJobClientDTO } from '@dailyuse/contracts/schedule';

interface Props {
  schedules: ScheduleJobClientDTO[];
  loading?: boolean;
}

interface Emits {
  (e: 'day-change', date: Date): void;
  (e: 'create'): void;
  (e: 'event-click', event: ScheduleJobClientDTO): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();
const { t, locale } = useI18n();

const currentDate = ref<Date>(new Date());

const dayTitle = computed(() => {
  return currentDate.value.toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const hours = computed(() => Array.from({ length: 24 }, (_, i) => i));

const dayEvents = computed(() => {
  const dateStr = toDateStr(currentDate.value);
  return props.schedules.filter((event) => {
    const eventDate = new Date(event.startTime).toISOString().split('T')[0];
    return eventDate === dateStr;
  });
});

const currentMinuteOffset = computed(() => {
  const now = new Date();
  return (now.getMinutes() / 60) * 100;
});

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isCurrentHour(hour: number): boolean {
  const now = new Date();
  const today = toDateStr(now);
  return toDateStr(currentDate.value) === today && now.getHours() === hour;
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatEventTime(event: ScheduleJobClientDTO): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function getEventStyle(event: ScheduleJobClientDTO) {
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

function previousDay() {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() - 1);
  currentDate.value = d;
}

function nextDay() {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + 1);
  currentDate.value = d;
}

function goToToday() {
  currentDate.value = new Date();
}

watch(currentDate, (d) => {
  emit('day-change', d);
});

onMounted(() => {
  emit('day-change', currentDate.value);
});
</script>
