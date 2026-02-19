<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">周视图</h2>
        <p class="text-sm text-muted-foreground">以周为单位查看调度任务安排</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="showCreateDialog = true">
          <Plus class="mr-1 h-4 w-4" /> 新建任务
        </Button>
      </div>
    </div>

    <!-- 周日历 -->
    <div class="flex-1">
      <WeekViewCalendar
        :schedules="(calendarEvents as any)"
        @event-click="handleEventClick"
      />
    </div>

    <!-- 任务详情dialog -->
    <ScheduleTaskDetailDialog
      v-model:show="showDetailDialog"
      :task="selectedTask as any"
      @pause="handlePause"
      @resume="handleResume"
      @delete="handleDelete"
    />

    <!-- 创建dialog -->
    <CreateScheduleDialog
      v-model="showCreateDialog"
      @submit="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { Plus } from 'lucide-vue-next';
import {
  Button,
  WeekViewCalendar, ScheduleTaskDetailDialog, CreateScheduleDialog,
} from '@dailyuse/ui-vue-shadcn';
import { useSchedule } from '../composables/useSchedule';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

const {
  tasks, fetchTasks, pauseTask, resumeTask, deleteTask,
} = useSchedule();

const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const selectedTask = ref<ScheduleTaskClientDTO | null>(null);

const calendarEvents = computed(() =>
  tasks.value.map((t) => ({
    id: t.id,
    title: t.name,
    status: t.status,
    enabled: t.enabled,
    sourceModule: t.sourceModule,
    nextRunAt: t.nextRunAtFormatted,
    healthStatus: t.healthStatus,
  })),
);

function handleEventClick(event: { id: string }) {
  const task = tasks.value.find((t) => t.id === event.id);
  if (task) {
    selectedTask.value = task;
    showDetailDialog.value = true;
  }
}

async function handlePause(id: string) {
  const result = await pauseTask(id);
  if (result) {
    toast.success('任务已暂停');
    showDetailDialog.value = false;
  }
}

async function handleResume(id: string) {
  const result = await resumeTask(id);
  if (result) {
    toast.success('任务已恢复');
    showDetailDialog.value = false;
  }
}

async function handleDelete(id: string) {
  if (!window.confirm('确认删除此调度任务？')) return;
  const ok = await deleteTask(id);
  if (ok) {
    toast.success('任务已删除');
    showDetailDialog.value = false;
  }
}

function handleCreated() {
  showCreateDialog.value = false;
  fetchTasks();
  toast.success('调度任务创建成功');
}

onMounted(() => {
  fetchTasks();
});
</script>
