<template>
  <div id="task-instance-management">
    <div class="task-header">
      <div class="header-info">
        <div class="title-section">
          <h2 class="header-title">{{ headerTitle }}</h2>
          <p class="header-subtitle">{{ headerSubtitle }}</p>
        </div>
        <div class="header-actions">
          <v-btn icon variant="text" size="small" @click="emit('refresh')" :loading="loading" class="refresh-btn">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-chip :color="completedCount === totalCount && totalCount > 0 ? 'success' : 'primary'" variant="elevated" size="large" class="progress-chip">
            <v-icon start>mdi-check-circle</v-icon>
            {{ completedCount }}/{{ totalCount }}
          </v-chip>
        </div>
      </div>

      <div v-if="totalCount > 0" class="progress-section">
        <v-progress-linear :model-value="(completedCount / totalCount) * 100" :color="completedCount === totalCount ? 'success' : 'primary'" height="10" rounded class="progress-bar" />
        <span class="progress-text">{{ Math.round((completedCount / totalCount) * 100) }}% 完成</span>
      </div>
    </div>

    <v-card class="week-selector-card" elevation="3">
      <v-card-text class="pa-4">
        <div class="week-selector-header">
          <v-btn icon variant="text" @click="shiftWeek(-7)" class="week-nav-btn"><v-icon>mdi-chevron-left</v-icon></v-btn>
          <span class="week-title">{{ weekTitle }}</span>
          <v-btn icon variant="text" @click="shiftWeek(7)" class="week-nav-btn"><v-icon>mdi-chevron-right</v-icon></v-btn>
        </div>

        <div class="week-selector">
          <v-btn
            v-for="day in weekDays"
            :key="day.date"
            :variant="day.date === selectedDate ? 'flat' : 'text'"
            :color="day.date === selectedDate ? 'primary' : 'default'"
            class="day-button"
            @click="selectedDate = day.date"
          >
            <div class="day-content">
              <span class="weekday">{{ day.weekday }}</span>
              <span class="date">{{ new Date(day.date).getDate() }}</span>
            </div>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <div class="task-sections">
      <div v-if="totalCount === 0" class="overlay-card">
        <div class="overlay-content">
          <v-icon color="success" size="80" class="mb-4 empty-icon">mdi-beach</v-icon>
          <h3 class="text-h5 mb-3">休息日</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">今天没有安排任务，好好休息吧！</p>
        </div>
      </div>

      <div class="task-lists-row" v-else>
        <v-card class="task-section-card incomplete-tasks" elevation="3">
          <v-card-title class="section-header">
            <div class="header-left"><v-icon color="warning" class="mr-2">mdi-clock-outline</v-icon><span>待完成任务</span></div>
            <v-chip color="warning" variant="tonal" size="small" class="mr-2">{{ incompleteTasks.length }}</v-chip>
          </v-card-title>
          <v-card-text class="pa-0 task-content">
            <v-list class="task-list">
              <TaskInstanceCard
                v-for="(task, index) in incompleteTasks"
                :key="task.id"
                :task="task"
                :task-title="task.templateTitle"
                :show-border="index < incompleteTasks.length - 1"
                @complete="openCompleteDialog"
              />
            </v-list>
          </v-card-text>
        </v-card>

        <v-card class="task-section-card completed-tasks" elevation="2">
          <v-card-title class="section-header">
            <div class="header-left"><v-icon color="success" class="mr-2">mdi-check-circle</v-icon><span>已完成任务</span></div>
            <v-chip color="success" variant="tonal" size="small">{{ completedTasks.length }}</v-chip>
          </v-card-title>
          <v-card-text class="pa-0 task-content">
            <v-list class="task-list">
              <TaskInstanceCard
                v-for="(task, index) in completedTasks"
                :key="task.id"
                :task="task"
                :task-title="task.templateTitle"
                :show-border="index < completedTasks.length - 1"
                @undo="(id) => emit('undo-task', id)"
              />
            </v-list>
          </v-card-text>
        </v-card>
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
  (e: 'complete-task', payload: { taskId: string; recordValue?: number; note?: string; duration?: number }): void;
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

const handleCompleteConfirm = (payload: { recordValue?: number; note?: string; duration?: number }) => {
  if (!selectedTask.value) return;
  emit('complete-task', {
    taskId: selectedTask.value.id,
    ...payload,
  });
  dialogVisible.value = false;
};
</script>
