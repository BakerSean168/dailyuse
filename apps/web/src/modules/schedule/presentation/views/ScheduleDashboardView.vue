<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">调度中心</h2>
        <p class="text-sm text-muted-foreground">管理所有定时任务和调度计划</p>
      </div>
      <Button @click="showCreateDialog = true">
        <Plus class="mr-1 h-4 w-4" /> 创建调度任务
      </Button>
    </div>

    <!-- 统计卡片 -->
    <div class="mb-6">
      <StatisticsCard
        :statistics="scheduleStatistics"
        :is-loading="isLoading"
      />
    </div>

    <!-- 任务列表 -->
    <Card class="flex-1">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>调度任务</CardTitle>
          <div class="flex items-center gap-2">
            <Input
              v-model="searchQuery"
              placeholder="搜索任务..."
              class="w-64"
            >
              <template #prefix>
                <Search class="h-4 w-4 text-muted-foreground" />
              </template>
            </Input>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="py-8 text-center text-sm text-muted-foreground">
          加载中...
        </div>
        <div v-else-if="filteredTasks.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          暂无调度任务
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div class="flex items-center gap-3">
              <div
                class="h-2 w-2 rounded-full"
                :class="{
                  'bg-green-500': task.healthStatus === 'healthy',
                  'bg-yellow-500': task.healthStatus === 'warning',
                  'bg-red-500': task.healthStatus === 'critical',
                  'bg-gray-400': task.status === 'Paused',
                }"
              />
              <div>
                <p class="font-medium">{{ task.name }}</p>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" class="text-xs">{{ task.sourceModuleDisplay }}</Badge>
                  <span>{{ task.executionSummary }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge :variant="task.enabled ? 'default' : 'outline'">
                {{ task.enabledDisplay }}
              </Badge>
              <span class="text-xs text-muted-foreground">
                下次: {{ task.nextRunAtFormatted }}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="task.status !== 'Paused'"
                    @click="handlePause(task.id)"
                  >
                    <Pause class="mr-2 h-4 w-4" /> 暂停
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="task.status === 'Paused'"
                    @click="handleResume(task.id)"
                  >
                    <Play class="mr-2 h-4 w-4" /> 恢复
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleDelete(task.id)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" /> 删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 创建调度dialog -->
    <CreateScheduleDialog
      v-model="showCreateDialog"
      @submit="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import {
  Plus, Search, MoreHorizontal, Trash2, Play, Pause,
} from 'lucide-vue-next';
import {
  Button, Badge, Card, CardHeader, CardTitle, CardContent, Input,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  StatisticsCard, CreateScheduleDialog,
} from '@dailyuse/ui-vue-shadcn';
import { useSchedule } from '../composables/useSchedule';

const {
  tasks, isLoading, fetchTasks, pauseTask, resumeTask, deleteTask, createTask,
} = useSchedule();

const searchQuery = ref('');
const showCreateDialog = ref(false);

const scheduleStatistics = computed(() => ({
  totalTasks: tasks.value.length,
  activeTasks: activeTasks.value.length,
  pausedTasks: pausedTasks.value.length,
  completedTasks: 0,
  failedTasks: failedTasks.value.length,
  successRate: 0,
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
}));

const activeTasks = computed(() => tasks.value.filter((t) => t.status === 'Active'));
const pausedTasks = computed(() => tasks.value.filter((t) => t.status === 'Paused'));
const failedTasks = computed(() => tasks.value.filter((t) => t.healthStatus === 'critical'));

const filteredTasks = computed(() => {
  if (!searchQuery.value) return tasks.value;
  const q = searchQuery.value.toLowerCase();
  return tasks.value.filter((t) => t.name.toLowerCase().includes(q));
});

async function handlePause(id: string) {
  const result = await pauseTask(id);
  if (result) toast.success('任务已暂停');
}

async function handleResume(id: string) {
  const result = await resumeTask(id);
  if (result) toast.success('任务已恢复');
}

async function handleDelete(id: string) {
  if (!window.confirm('确认删除此调度任务？')) return;
  const ok = await deleteTask(id);
  if (ok) toast.success('任务已删除');
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
