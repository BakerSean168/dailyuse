<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">调度控制台</h1>
        <Separator orientation="vertical" class="h-4" />
        <div class="flex items-center gap-1">
          <Button
            v-for="tab in statusTabs"
            :key="tab.value"
            variant="ghost"
            size="sm"
            :class="[
              'h-7 px-2 text-muted-foreground hover:text-foreground',
              selectedStatus === tab.value ? 'bg-secondary font-medium text-foreground' : '',
            ]"
            @click="selectedStatus = tab.value"
          >
            {{ tab.label }}
            <span class="ml-1.5 text-xs opacity-50">{{ getCountByStatus(tab.value) }}</span>
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8"
          @click="$router.push({ name: 'ScheduleWeekView' })"
        >
          <CalendarDays class="mr-2 h-4 w-4" />
          周视图
        </Button>
        <Button size="sm" class="h-8 gap-2" @click="showCreateDialog = true">
          <Plus class="h-4 w-4" />
          新建调度
        </Button>
      </div>
    </header>

    <!-- Content -->
    <ScrollArea class="flex-1 p-6">
      <div class="mx-auto max-w-5xl">
        <div
          v-if="isLoading"
          class="flex h-[50vh] items-center justify-center text-muted-foreground"
        >
          加载中...
        </div>

        <div
          v-else-if="filteredTasks.length === 0"
          class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <CalendarClock class="h-6 w-6 opacity-50" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">暂无调度任务</h3>
          <p class="mb-6 text-sm">创建一个新的调度任务开始管理日程</p>
          <Button @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            新建调度
          </Button>
        </div>

        <div v-else class="space-y-3">
          <ActionableWrapper
            v-for="task in filteredTasks"
            :key="task.id"
            :actions="getTaskActions(task)"
            more-button-position="top-right"
          >
            <div
              class="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                :class="statusColorMap[task.status] || 'bg-gray-100'"
              >
                <CalendarClock class="h-5 w-5 text-white" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ task.name }}</span>
                  <Badge variant="outline" class="text-xs">{{ task.sourceModule }}</Badge>
                  <Badge :variant="task.enabled ? 'default' : 'secondary'" class="text-xs">
                    {{ task.enabled ? '启用' : '禁用' }}
                  </Badge>
                </div>
                <p v-if="task.description" class="mt-0.5 text-sm text-muted-foreground truncate">
                  {{ task.description }}
                </p>
                <div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>下次: {{ task.nextRunAtFormatted || '-' }}</span>
                  <span>{{ task.executionSummary }}</span>
                </div>
              </div>
            </div>
          </ActionableWrapper>
        </div>
      </div>
    </ScrollArea>

    <CreateScheduleDialog v-model="showCreateDialog" @submit="handleCreateSchedule" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { CalendarClock, CalendarDays, Plus, Pause, Play, Trash2 } from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Separator } from '@dailyuse/ui-vue-shadcn';
import CreateScheduleDialog from '../components/CreateScheduleDialog.vue';
import { useSchedule } from '../composables/useSchedule';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

const { tasks, isLoading, fetchTasks, createTask, deleteTask, pauseTask, resumeTask } =
  useSchedule();

const showCreateDialog = ref(false);
const selectedStatus = ref('all');

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Paused', value: 'Paused' },
  { label: 'Completed', value: 'Completed' },
];

const statusColorMap: Record<string, string> = {
  Active: 'bg-green-500',
  Paused: 'bg-yellow-500',
  Completed: 'bg-blue-500',
  Cancelled: 'bg-gray-400',
  Failed: 'bg-red-500',
};

const filteredTasks = computed(() => {
  if (selectedStatus.value === 'all') return tasks.value;
  return tasks.value.filter((t) => t.status === selectedStatus.value);
});

function getCountByStatus(status: string): number {
  if (status === 'all') return tasks.value.length;
  return tasks.value.filter((t) => t.status === status).length;
}

async function handleCreateSchedule(data: Record<string, unknown>) {
  const result = await createTask(data);
  if (result) {
    showCreateDialog.value = false;
    toast.success('调度任务已创建');
  }
}

async function handlePause(id: string) {
  await pauseTask(id);
  toast.success('调度任务已暂停');
}

async function handleResume(id: string) {
  await resumeTask(id);
  toast.success('调度任务已恢复');
}

async function handleDelete(task: ScheduleTaskClientDTO) {
  if (!window.confirm(`确认删除调度「${task.name}」？`)) return;
  const ok = await deleteTask(task.id);
  if (ok) toast.success('调度任务已删除');
}

function getTaskActions(task: ScheduleTaskClientDTO): MenuAction[] {
  const actions: MenuAction[] = [];

  if (task.status === 'Active') {
    actions.push({
      key: 'pause',
      label: menuLabel('pause'),
      icon: Pause,
      handler: () => handlePause(task.id),
    });
  }

  if (task.status === 'Paused') {
    actions.push({
      key: 'resume',
      label: menuLabel('resume'),
      icon: Play,
      handler: () => handleResume(task.id),
    });
  }

  actions.push({
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: actions.length > 0,
    handler: () => handleDelete(task),
  });

  return actions;
}

onMounted(async () => {
  await fetchTasks();
});
</script>
