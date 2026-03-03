<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="right" class="w-96 overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ dateTitle }}</SheetTitle>
        <SheetDescription>
          {{ t('schedule.dayDetail.subtitle', { count: events.length }) }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-4 space-y-2">
        <div v-if="events.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          {{ t('schedule.dayDetail.noEvents') }}
        </div>

        <div
          v-for="event in events"
          :key="event.id"
          class="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
          @click="$emit('event-click', event)"
        >
          <!-- Source indicator dot -->
          <div
            class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            :class="{
              'bg-primary': event.source === 'schedule',
              'bg-green-500': event.source === 'goal',
              'bg-blue-500': event.source === 'task',
            }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ event.title }}</p>
            <p class="text-xs text-muted-foreground">{{ formatTimeRange(event) }}</p>
            <span
              class="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
              :class="{
                'bg-primary/10 text-primary': event.source === 'schedule',
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                  event.source === 'goal',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
                  event.source === 'task',
              }"
            >
              {{ sourceLabel(event.source) }}
            </span>
          </div>
          <AlertCircle v-if="event.hasConflict" class="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <!-- Complete button: only for task instances that are not yet completed -->
          <button
            v-if="event.source === 'task' && event.instanceStatus !== 'Completed'"
            class="ml-1 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-green-100 hover:text-green-600 transition-colors"
            :title="t('task.action.complete')"
            @click.stop="$emit('complete-task', event.originalId)"
          >
            <CheckCircle2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <SheetFooter class="mt-6">
        <Button variant="outline" class="w-full" @click="date && $emit('view-in-day', date)">
          <Calendar class="mr-2 h-4 w-4" />
          {{ t('schedule.dayDetail.viewInDayView') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertCircle, Calendar, CheckCircle2 } from 'lucide-vue-next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Button,
} from '@dailyuse/ui-vue-shadcn';
import type { CalendarEventItem } from '../composables/useCalendarView';

interface Props {
  open: boolean;
  date: Date | null;
  events: CalendarEventItem[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'event-click', event: CalendarEventItem): void;
  (e: 'view-in-day', date: Date): void;
  (e: 'complete-task', originalId: string): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const { t, locale } = useI18n();

const dateTitle = computed(() => {
  if (!props.date) return '';
  return props.date.toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

function formatTimeRange(event: CalendarEventItem): string {
  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  return `${fmt(event.startTime)} – ${fmt(event.endTime)}`;
}

function sourceLabel(source: CalendarEventItem['source']): string {
  const map: Record<CalendarEventItem['source'], string> = {
    schedule: t('schedule.source.schedule'),
    goal: t('schedule.source.goal'),
    task: t('schedule.source.task'),
  };
  return map[source];
}
</script>
