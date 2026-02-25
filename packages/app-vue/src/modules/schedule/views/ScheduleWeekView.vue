<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="$router.push({ name: 'ScheduleDashboard' })">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" class="h-4" />
        <h1 class="text-lg font-medium text-foreground">周视图</h1>
      </div>

      <Button size="sm" class="h-8 gap-2" @click="showCreateDialog = true">
        <Plus class="h-4 w-4" />
        新建日程
      </Button>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-[50vh] items-center justify-center text-muted-foreground"
      >
        加载中...
      </div>

      <WeekViewCalendar
        v-else
        :schedules="(schedules as any)"
        @create="showCreateDialog = true"
        @event-click="handleEventClick"
        @week-change="handleWeekChange"
      />
    </div>

    <CreateScheduleDialog
      v-model="showCreateDialog"
      @submit="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { ArrowLeft, Plus } from 'lucide-vue-next';
import { Button, Separator } from '@dailyuse/ui-vue-shadcn';
import WeekViewCalendar from '../components/WeekViewCalendar.vue';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import { useSchedule } from '../composables/useSchedule';

const { tasks: schedules, isLoading, fetchTasks, createTask } = useSchedule();

const showCreateDialog = ref(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleEventClick(event: any) {
  toast.info(`日程: ${event.name || event.title}`);
}

function handleWeekChange(_start: Date, _end: Date) {
  fetchTasks();
}

async function handleCreate(data: Record<string, unknown>) {
  const result = await createTask(data);
  if (result) {
    showCreateDialog.value = false;
    toast.success('日程已创建');
  }
}

onMounted(async () => {
  await fetchTasks();
});
</script>
