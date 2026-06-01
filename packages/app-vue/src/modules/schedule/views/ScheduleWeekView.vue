<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="$router.push({ name: 'ScheduleDashboard' })"
        >
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" class="h-4" />
        <h1 class="text-lg font-medium text-foreground">{{ t('schedule.weekViewPage.title') }}</h1>
      </div>

      <Button size="sm" class="h-8 gap-2" @click="showCreateDialog = true">
        <Plus class="h-4 w-4" />
        {{ t('schedule.weekViewPage.createSchedule') }}
      </Button>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <div v-if="isLoading" class="flex h-[50vh] items-center justify-center text-muted-foreground">
        {{ t('schedule.weekViewPage.loading') }}
      </div>

      <WeekViewCalendar
        v-else
        :schedules="events"
        @event-click="handleEventClick"
        @week-change="handleWeekChange"
      />
    </div>

    <CreateScheduleDialog v-model="showCreateDialog" @submit="handleCreate" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { ArrowLeft, Plus } from 'lucide-vue-next';
import { Button, Separator } from '@dailyuse/ui-vue-shadcn';
import WeekViewCalendar from '../components/WeekViewCalendar.vue';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import { useCalendarView } from '../composables/useCalendarView';
import { useSchedule } from '../composables/useSchedule';
import type { CalendarEventItem } from '../composables/useCalendarView';
import type { CreateScheduleRequest } from '@dailyuse/contracts/schedule';

const { t } = useI18n();
const { events, isLoading, fetchForRange } = useCalendarView();
const { createCalendarEntry } = useSchedule();

const showCreateDialog = ref(false);

function handleEventClick(event: CalendarEventItem) {
  toast.info(t('schedule.weekViewPage.eventToast', { name: event.title }));
}

function handleWeekChange(start: Date, end: Date) {
  fetchForRange(start.getTime(), end.getTime());
}

async function handleCreate(data: CreateScheduleRequest) {
  const result = await createCalendarEntry(data);
  if (result) {
    showCreateDialog.value = false;
    toast.success(t('schedule.toast.scheduleCreated'));
  }
}

onMounted(async () => {
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
