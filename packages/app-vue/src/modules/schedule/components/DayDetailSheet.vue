<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
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
          @click="emit('event-click', event)"
        >
          <!-- Source indicator dot -->
          <div
            class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            :class="{
              'bg-primary': event.source === 'schedule',
              'bg-success': event.source === 'goal',
              'bg-info': event.source === 'task',
            }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ event.title }}</p>
            <p class="text-xs text-muted-foreground">{{ formatTimeRange(event) }}</p>
            <span
              class="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
              :class="{
                'bg-primary/10 text-primary': event.source === 'schedule',
                'bg-success/15 text-success': event.source === 'goal',
                'bg-info/15 text-info': event.source === 'task',
              }"
            >
              {{ calendarEventSourceLabel(event.source, t) }}
            </span>
          </div>
          <AlertCircle v-if="event.hasConflict" class="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <!-- Complete button: only for task instances that are not yet completed -->
          <button
            v-if="event.source === 'task' && event.instanceStatus !== 'Completed'"
            class="ml-1 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-success/15 hover:text-success transition-colors"
            :title="t('task.action.complete')"
            @click.stop="emit('complete-task', event.originalId)"
          >
            <CheckCircle2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <SheetFooter class="mt-6">
        <Button variant="outline" class="w-full" @click="emit('view-in-day', date)">
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
import { AlertCircle, Calendar, CheckCircle2 } from '@lucide/vue';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Button,
} from '@dailyuse/ui-vue-shadcn';
import { calendarEventSourceLabel, type CalendarEventItem } from '../composables/useCalendarView';
import { formatCalendarEventTimeRange } from '../../../shared/utils/format-calendar-event-time-range';
import { getProductTime } from '../../../shared/utils/product-time';

interface Props {
  open: boolean;
  date: Date | null;
  events: CalendarEventItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'event-click', event: CalendarEventItem): void;
  (e: 'view-in-day', date: Date | null): void;
  (e: 'complete-task', originalId: string): void;
}>();

const { t } = useI18n();

const dateTitle = computed(() => {
  if (!props.date) return '';
  return getProductTime().format.slot('periodDay', props.date.getTime());
});

/**
 * Residual 1213 keep-boundary: app-vue schedule event/all-day time range (vs app-react Intl pair).
 * Residual 1273: local dual retired onto formatCalendarEventTimeRange sole.
 * Residual 1291: sourceLabel dual retired onto calendarEventSourceLabel sole.
 * Soft residual 1213: app-react useScheduleAgenda formatTimeRange is Intl zh-CN pair (no force-merge).
 */
function formatTimeRange(event: CalendarEventItem): string {
  return formatCalendarEventTimeRange(event, t('schedule.calendar.allDay'));
}

</script>
