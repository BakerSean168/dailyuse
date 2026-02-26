<template>
  <div id="task-instance-management">
    <div class="task-header">
      <div class="header-info">
        <div class="title-section">
          <h2 class="header-title">{{ headerTitle }}</h2>
          <p class="header-subtitle">{{ headerSubtitle }}</p>
        </div>
        <div class="header-actions flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="emit('refresh')" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <RefreshCw v-else class="h-4 w-4" />
          </Button>
          <Badge
            :variant="completedCount === totalCount && totalCount > 0 ? 'default' : 'secondary'"
            class="text-sm px-3 py-1"
          >
            <CheckCircle class="h-4 w-4 mr-1" />
            {{ completedCount }}/{{ totalCount }}
          </Badge>
        </div>
      </div>

      <div v-if="totalCount > 0" class="progress-section mt-3">
        <Progress :model-value="(completedCount / totalCount) * 100" class="h-2.5" />
        <span class="progress-text text-sm mt-1 block"
          >{{ Math.round((completedCount / totalCount) * 100) }}% 完成</span
        >
      </div>
    </div>

    <Card class="week-selector-card mt-4">
      <CardContent class="p-4">
        <div class="week-selector-header flex items-center justify-between">
          <Button variant="ghost" size="icon" @click="shiftWeek(-7)">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="week-title font-medium">{{ weekTitle }}</span>
          <Button variant="ghost" size="icon" @click="shiftWeek(7)">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <div class="week-selector flex gap-1 mt-3">
          <Button
            v-for="day in weekDays"
            :key="day.date"
            :variant="day.date === selectedDate ? 'default' : 'ghost'"
            class="day-button flex-1"
            @click="selectedDate = day.date"
          >
            <div class="day-content flex flex-col items-center">
              <span class="weekday text-xs">{{ day.weekday }}</span>
              <span class="date text-sm font-medium">{{ new Date(day.date).getDate() }}</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>

    <div class="task-sections mt-4">
      <div v-if="totalCount === 0" class="overlay-card text-center py-12">
        <div class="overlay-content">
          <Palmtree class="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h3 class="text-xl font-semibold mb-3">休息日</h3>
          <p class="text-base text-muted-foreground mb-4">今天没有安排任务，好好休息吧！</p>
        </div>
      </div>

      <div class="task-lists-row grid grid-cols-1 md:grid-cols-2 gap-4" v-else>
        <Card class="task-section-card incomplete-tasks">
          <CardHeader class="section-header flex flex-row items-center justify-between pb-2">
            <div class="flex items-center gap-2">
              <Clock class="h-5 w-5 text-yellow-500" />
              <CardTitle class="text-base">待完成任务</CardTitle>
            </div>
            <Badge variant="outline" class="text-yellow-600">{{ incompleteTasks.length }}</Badge>
          </CardHeader>
          <CardContent class="p-0 task-content">
            <div class="task-list">
              <TaskInstanceCard
                v-for="(task, index) in incompleteTasks"
                :key="task.id"
                :task="task"
                :task-title="task.templateTitle"
                :show-border="index < incompleteTasks.length - 1"
                @complete="openCompleteDialog"
              />
            </div>
          </CardContent>
        </Card>

        <Card class="task-section-card completed-tasks">
          <CardHeader class="section-header flex flex-row items-center justify-between pb-2">
            <div class="flex items-center gap-2">
              <CheckCircle class="h-5 w-5 text-green-500" />
              <CardTitle class="text-base">已完成任务</CardTitle>
            </div>
            <Badge variant="outline" class="text-green-600">{{ completedTasks.length }}</Badge>
          </CardHeader>
          <CardContent class="p-0 task-content">
            <div class="task-list">
              <TaskInstanceCard
                v-for="(task, index) in completedTasks"
                :key="task.id"
                :task="task"
                :task-title="task.templateTitle"
                :show-border="index < completedTasks.length - 1"
                @undo="(id) => emit('undo-task', id)"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <TaskCompleteDialog
      v-if="dialogVisible && selectedTask"
      v-model="dialogVisible"
      :task-id="selectedTask.id"
      :task-title="selectedTask.templateTitle || selectedTask.statusText || '任务'"
      :instance-date="selectedTask.instanceDate"
      :goal-binding="undefined"
      @confirm="handleCompleteConfirm"
      @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isSameDay } from 'date-fns';
import TaskInstanceCard from './TaskInstanceCard.vue';
import TaskCompleteDialog from './dialogs/TaskCompleteDialog.vue';
import type { TaskInstanceViewModel } from './types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Progress,
} from '@dailyuse/ui-vue-shadcn';
import {
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Palmtree,
} from 'lucide-vue-next';

interface Props {
  taskInstances: TaskInstanceViewModel[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  taskInstances: () => [],
  loading: false,
});

const emit = defineEmits<{
  (e: 'refresh'): void;
  (
    e: 'complete-task',
    payload: { taskId: string; recordValue?: number; note?: string; duration?: number },
  ): void;
  (e: 'undo-task', taskId: string): void;
}>();

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const currentWeekStart = ref(new Date());
const dialogVisible = ref(false);
const selectedTask = ref<TaskInstanceViewModel | null>(null);

const loading = computed(() => props.loading);

const dayTasks = computed(() => {
  const date = new Date(selectedDate.value);
  return props.taskInstances.filter((task) => isSameDay(new Date(task.instanceDate), date));
});

const completedTasks = computed(() => dayTasks.value.filter((task) => task.isCompleted));
const incompleteTasks = computed(() => dayTasks.value.filter((task) => !task.isCompleted));
const completedCount = computed(() => completedTasks.value.length);
const totalCount = computed(() => dayTasks.value.length);

const headerTitle = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  if (selectedDate.value === today) return '今日任务';
  const date = new Date(selectedDate.value);
  return `${date.getMonth() + 1}月${date.getDate()}日任务`;
});

const headerSubtitle = computed(() => {
  const date = new Date(selectedDate.value);
  const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  return `${dayName} · ${date.toLocaleDateString('zh-CN')}`;
});

const weekDays = computed(() => {
  const days: Array<{ date: string; weekday: string }> = [];
  const monday = new Date(currentWeekStart.value);
  monday.setDate(currentWeekStart.value.getDate() - (currentWeekStart.value.getDay() || 7) + 1);
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    days.push({
      date: date.toISOString().split('T')[0],
      weekday: '日一二三四五六'[date.getDay()],
    });
  }
  return days;
});

const weekTitle = computed(() => {
  const monday = new Date(currentWeekStart.value);
  monday.setDate(currentWeekStart.value.getDate() - (currentWeekStart.value.getDay() || 7) + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getMonth() + 1}月${sunday.getDate()}日`;
});

const shiftWeek = (days: number) => {
  const updated = new Date(currentWeekStart.value);
  updated.setDate(updated.getDate() + days);
  currentWeekStart.value = updated;
};

const openCompleteDialog = (id: string) => {
  const task = props.taskInstances.find((item) => item.id === id);
  if (!task) return;
  selectedTask.value = task;
  dialogVisible.value = true;
};

const handleCompleteConfirm = (payload: {
  recordValue?: number;
  note?: string;
  duration?: number;
}) => {
  if (!selectedTask.value) return;
  emit('complete-task', {
    taskId: selectedTask.value.id,
    ...payload,
  });
  dialogVisible.value = false;
};
</script>
