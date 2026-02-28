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
        :schedules="schedules as any"
        :loading="isLoading"
        @create="showCreateDialog = true"
        @event-click="handleEventClick"
        @day-change="handleDayChange"
      />

      <!-- Week View -->
      <WeekViewCalendar
        v-else-if="activeView === 'week'"
        :schedules="schedules as any"
        :loading="isLoading"
        @create="showCreateDialog = true"
        @event-click="handleEventClick"
        @week-change="handleWeekChange"
      />

      <!-- Month View -->
      <MonthViewCalendar
        v-else-if="activeView === 'month'"
        :schedules="schedules as any"
        :loading="isLoading"
        @create="showCreateDialog = true"
        @event-click="handleEventClick"
        @month-change="handleMonthChange"
        @day-click="handleDayClick"
      />
    </div>

    <CreateScheduleDialog v-model="showCreateDialog" @submit="handleCreateSchedule" />
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
import { useSchedule } from '../composables/useSchedule';

const { t } = useI18n();
const { tasks: schedules, isLoading, fetchTasks, createTask } = useSchedule();

const showCreateDialog = ref(false);
const activeView = ref<'day' | 'week' | 'month'>('week');

const viewTabs = computed(() => [
  { label: t('schedule.viewTabs.day'), value: 'day' as const, icon: Calendar },
  { label: t('schedule.viewTabs.week'), value: 'week' as const, icon: CalendarDays },
  { label: t('schedule.viewTabs.month'), value: 'month' as const, icon: CalendarRange },
]);

function handleEventClick(event: any) {
  toast.info(t('schedule.weekViewPage.eventToast', { name: event.name || event.title }));
}

function handleDayChange(_date: Date) {
  fetchTasks();
}

function handleWeekChange(_start: Date, _end: Date) {
  fetchTasks();
}

function handleMonthChange(_start: Date, _end: Date) {
  fetchTasks();
}

function handleDayClick(date: Date) {
  // Switch to day view for the clicked date
  activeView.value = 'day';
}

async function handleCreateSchedule(data: Record<string, unknown>) {
  const result = await createTask(data);
  if (result) {
    showCreateDialog.value = false;
    toast.success(t('schedule.toast.scheduleCreated'));
  }
}

onMounted(async () => {
  await fetchTasks();
});
</script>
