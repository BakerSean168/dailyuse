<!--
  Task List View
  任务列表页面 - 支持列表视图和 DAG 依赖关系图视图
-->
<template>
  <v-container fluid class="task-list-view">
    <v-row>
      <v-col cols="12">
        <!-- 页面标题和操作栏 -->
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            任务管理
          </h1>

          <div class="d-flex gap-2">
            <!-- 视图切换 -->
            <v-btn-toggle v-model="viewMode" mandatory density="compact" variant="outlined">
              <v-btn value="list" size="small">
                <v-icon start>mdi-format-list-bulleted</v-icon>
                列表视图
              </v-btn>
              <v-btn value="dag" size="small">
                <v-icon start>mdi-graph-outline</v-icon>
                依赖图
              </v-btn>
            </v-btn-toggle>

            <!-- 创建任务 -->
            <v-btn color="primary" data-testid="create-task-button" @click="handleCreateTask">
              <v-icon start>mdi-plus</v-icon>
              创建任务
            </v-btn>
          </div>
        </div>

        <!-- 列表视图 -->
        <v-card v-if="viewMode === 'list'">
          <v-card-title>
            <div class="d-flex justify-space-between align-center w-100">
              <span>任务列表</span>

              <!-- 筛选和搜索 -->
              <div class="d-flex gap-2">
                <v-select v-model="filterStatus" :items="statusOptions" label="状态筛选" density="compact"
                  style="width: 150px" clearable />
                <v-select v-model="filterPriority" :items="priorityOptions" label="优先级" density="compact"
                  style="width: 150px" clearable />
                <v-text-field v-model="searchQuery" label="搜索任务" prepend-inner-icon="mdi-magnify" density="compact"
                  style="width: 200px" clearable />
              </div>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- 加载状态 -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="text-medium-emphasis mt-4">加载中...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="filteredTasks.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-clipboard-text-outline</v-icon>
              <p class="text-h6 text-medium-emphasis mt-4">
                {{
                  searchQuery || filterStatus || filterPriority
                    ? '没有找到匹配的任务'
                    : '还没有任务'
                }}
              </p>
              <v-btn v-if="!searchQuery && !filterStatus && !filterPriority" color="primary" variant="outlined"
                class="mt-4" @click="handleCreateTask">
                创建第一个任务
              </v-btn>
            </div>

            <!-- 任务列表 -->
            <v-list v-else>
              <v-list-item v-for="task in filteredTasks" :key="task.uuid" :title="task.title"
                :subtitle="task.description || undefined" @click="handleTaskClick(task)">
                <template #prepend>
                  <v-checkbox-btn :model-value="task.status === 'COMPLETED'" @click.stop="toggleTaskStatus(task)" />
                </template>

                <template #append>
                  <div class="d-flex align-center gap-2">
                    <!-- 优先级标签 -->
                    <v-chip v-if="task.priorityLevel" :color="getPriorityColor(task.priorityLevel)" size="small" variant="flat">
                      {{ task.priorityLevel }}
                    </v-chip>

                    <!-- 状态标签 -->
                    <v-chip :color="getStatusColor(task.status)" size="small" variant="flat">
                      {{ task.status }}
                    </v-chip>

                    <!-- 预估时长 -->
                    <v-chip v-if="task.estimatedMinutes" size="small" variant="outlined">
                      <v-icon start size="small">mdi-clock-outline</v-icon>
                      {{ formatDuration(task.estimatedMinutes) }}
                    </v-chip>

                    <!-- 截止日期 -->
                    <v-chip v-if="task.dueDate" size="small" variant="outlined"
                      :color="isOverdue(task.dueDate) ? 'error' : undefined">
                      <v-icon start size="small">mdi-calendar</v-icon>
                      {{ formatDate(task.dueDate) }}
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <!-- 分页 -->
          <v-card-actions v-if="filteredTasks.length > 0">
            <v-spacer />
            <div class="text-caption text-medium-emphasis mr-4">
              共 {{ filteredTasks.length }} 个任务
            </div>
          </v-card-actions>
        </v-card>

        <!-- DAG 视图 -->
        <TaskDAGVisualization v-else-if="viewMode === 'dag'" :tasks="tasks" :dependencies="dependencies"
          @node-click="handleTaskClick" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { TaskTemplateClientDTO, TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';
import { taskTemplateToDAG } from '@/modules/task/types/task-dag.types';
import TaskDAGVisualization from '@/modules/task/presentation/components/dag/TaskDAGVisualization.vue';
import {
  getTaskTemplateApiClient,
  getTaskDependencyApiClient,
} from '@dailyuse/task/infrastructure-client';
import { taskAutoStatusService } from '@/modules/task/application/services/TaskAutoStatusService';

// 类型别名
type TaskClientDTO = TaskForDAG;

const taskTemplateApiClient = getTaskTemplateApiClient();
const taskDependencyApiClient = getTaskDependencyApiClient();

const router = useRouter();

// State
const viewMode = ref<'list' | 'dag'>('list');
const loading = ref(false);
const tasks = ref<TaskClientDTO[]>([]);
const dependencies = ref<TaskDependencyClientDTO[]>([]);

// 筛选和搜索
const filterStatus = ref<string>();
const filterPriority = ref<string>();
const searchQuery = ref('');

// 选项
const statusOptions = [
  { title: '全部', value: undefined },
  { title: '待处理', value: 'PENDING' },
  { title: '进行中', value: 'IN_PROGRESS' },
  { title: '已完成', value: 'COMPLETED' },
  { title: '已取消', value: 'CANCELLED' },
];

const priorityOptions = [
  { title: '全部', value: undefined },
  { title: '紧急', value: 'CRITICAL' },
  { title: '高', value: 'HIGH' },
  { title: '中', value: 'MEDIUM' },
  { title: '低', value: 'LOW' },
];

// Computed
const filteredTasks = computed(() => {
  let result: TaskClientDTO[] = tasks.value;

  // 状态筛选
  if (filterStatus.value) {
    result = result.filter((task: TaskClientDTO) => task.status === filterStatus.value);
  }

  // 优先级筛选
  if (filterPriority.value) {
    result = result.filter((task: TaskClientDTO) => task.priorityLevel === filterPriority.value);
  }

  // 搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (task: TaskClientDTO) =>
        task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query),
    );
  }

  return result;
});

// Methods
const loadTasks = async () => {
  loading.value = true;
  try {
    // 加载任务模板（用于 DAG 可视化）
    const templates = await taskTemplateApiClient.getTaskTemplates({
      status: 'ACTIVE',
      limit: 100,
    });

    // 转换为 DAG 格式
    if (templates && templates.length > 0) {
      tasks.value = templates.map((template: TaskTemplateClientDTO) =>
        taskTemplateToDAG(template),
      );
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
    // 降级到空数组
    tasks.value = [];
  } finally {
    loading.value = false;
  }
};

const loadDependencies = async () => {
  try {
    // 加载所有任务的依赖关系
    const allDependencies: TaskDependencyClientDTO[] = [];

    for (const task of tasks.value) {
      try {
        const deps = await taskDependencyApiClient.getDependencies(task.uuid);
        allDependencies.push(...deps);
      } catch (error) {
        console.error(`Failed to load dependencies for task ${task.uuid}:`, error);
        // 继续加载其他任务的依赖
      }
    }

    // 去重（基于 uuid）
    const uniqueDeps = Array.from(new Map(allDependencies.map((dep) => [dep.uuid, dep])).values());

    dependencies.value = uniqueDeps;
  } catch (error) {
    console.error('Failed to load dependencies:', error);
  }
};

const handleCreateTask = () => {
  router.push('/tasks/create');
};

const handleTaskClick = (task: TaskClientDTO) => {
  router.push(`/tasks/${task.uuid}`);
};

const toggleTaskStatus = async (task: TaskClientDTO) => {
  try {
    // TODO: 实现状态切换
    // 由于 TaskForDAG 可能来自 Template 或 Instance，需要判断
    console.log('Toggle task status:', task.uuid);

    // 临时直接修改本地状态
    const newStatus = task.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    task.status = newStatus;
  } catch (error) {
    console.error('Failed to toggle task status:', error);
  }
};

const getPriorityColor = (priority?: string): string => {
  const colors: Record<string, string> = {
    CRITICAL: 'error',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'success',
  };
  return colors[priority || 'MEDIUM'] || 'default';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'primary',
    PENDING: 'default',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 1 && diffDays < 7) return `${diffDays}天后`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const isOverdue = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

// Event subscriptions cleanup
let unsubscribeStatus: (() => void) | null = null;
let unsubscribeReady: (() => void) | null = null;
let unsubscribeBlocked: (() => void) | null = null;

// Setup event listeners for auto-status updates
const setupEventListeners = () => {
  // Subscribe to status change events
  unsubscribeStatus = taskAutoStatusService.onStatusChanged((event) => {
    console.log('[TaskListView] Task status changed:', event);

    // Update local task list
    const task = tasks.value.find((t) => t.uuid === event.taskUuid);
    if (task) {
      task.status = event.newStatus;
    }
  });

  // Subscribe to task ready events
  unsubscribeReady = taskAutoStatusService.onTaskReady((event) => {
    console.log('[TaskListView] Task ready:', event);

    // TODO: Show notification to user
    // 可以使用 Vuetify 的 Snackbar 或第三方通知库
    // Example: useNotification().success({
    //   title: '任务已就绪',
    //   message: `${event.title} 可以开始了`,
    // });
  });

  // Subscribe to task blocked events
  unsubscribeBlocked = taskAutoStatusService.onTaskBlocked((event) => {
    console.log('[TaskListView] Task blocked:', event);

    // TODO: Show notification to user
    // Example: useNotification().warning({
    //   title: '任务被阻塞',
    //   message: `等待 ${event.blockingTasks.length} 个前置任务完成`,
    // });
  });
};

// 切换到 DAG 视图时加载依赖
watch(
  () => viewMode.value,
  async (newMode) => {
    if (newMode === 'dag' && dependencies.value.length === 0 && tasks.value.length > 0) {
      await loadDependencies();
    }
  },
);

// Lifecycle
onMounted(async () => {
  await loadTasks();
  setupEventListeners();
});

onUnmounted(() => {
  // Cleanup event listeners
  if (unsubscribeStatus) unsubscribeStatus();
  if (unsubscribeReady) unsubscribeReady();
  if (unsubscribeBlocked) unsubscribeBlocked();
});
</script>

<style scoped>
.task-list-view {
  max-width: 1400px;
  margin: 0 auto;
}

.gap-2 {
  gap: 8px;
}
</style>

