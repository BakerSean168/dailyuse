<template>
  <div id="task-template-management">
    <!-- 筛选和操作栏 -->
    <div class="template-controls">
      <!-- 状态筛选器 -->
      <div class="template-filters">
        <v-btn-toggle v-model="currentStatus" mandatory variant="outlined" divided class="filter-group">
          <v-btn v-for="status in statusFilters" :key="status.value" :value="status.value" class="filter-button"
            size="large">
            <v-icon :icon="status.icon" start />
            {{ status.label }}
            <v-chip size="small" :color="getStatusChipColor(status.value)" variant="elevated" class="ml-2">
              {{ getTemplateCountByStatus(status.value) }}
            </v-chip>
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- 操作按钮组 -->
      <div class="action-buttons">
        <!-- 查看依赖关系图按钮 -->
        <v-btn v-if="taskStore.getAllTaskTemplates.length > 0" data-testid="view-dependency-graph-button" color="info"
          variant="outlined" size="large" prepend-icon="mdi-graph-outline" @click="showDependencyDialog = true"
          class="view-dag-button">
          查看依赖关系图
        </v-btn>

        <!-- 删除所有模板按钮 -->
        <v-btn v-if="taskStore.getAllTaskTemplates.length > 0" data-testid="delete-all-templates-button" color="error"
          variant="outlined" size="large" prepend-icon="mdi-delete-sweep" @click="showDeleteAllDialog = true"
          class="delete-all-button">
          删除所有模板
        </v-btn>

        <!-- 创建按钮 -->
        <v-btn data-testid="create-task-template-button" color="primary" variant="elevated" size="large"
          prepend-icon="mdi-plus" @click="taskTemplateDialogRef?.openForCreation()" class="create-button">
          创建新模板
        </v-btn>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-grid">
      <!-- 空状态 -->
      <v-card v-if="filteredTemplates.length === 0" class="empty-state-card" elevation="2">
        <v-card-text class="text-center pa-8">
          <v-icon :color="getEmptyStateIconColor()" size="64" class="mb-4">
            {{ getEmptyStateIcon() }}
          </v-icon>
          <h3 class="text-h5 mb-2">
            {{ getEmptyStateText() }}
          </h3>
          <p class="text-body-1 text-medium-emphasis">
            {{ getEmptyStateDescription() }}
          </p>
          <v-btn v-if="currentStatus === TaskTemplateStatus.ACTIVE" data-testid="create-first-task-template-button" color="primary"
            variant="tonal" prepend-icon="mdi-plus" @click="taskTemplateDialogRef?.openForCreation()" class="mt-4">
            创建第一个模板
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- 使用 DraggableTaskCard 组件 (支持拖放创建依赖关系) -->
      <DraggableTaskCard v-for="template in filteredTemplates" :key="template.uuid" :template="template"
        :enable-drag="true" @dependency-created="handleDependencyCreated" @resume="handleResumeTemplate" />
    </div>

    <!-- 任务模板编辑对话框 -->
    <TaskTemplateDialog ref="taskTemplateDialogRef" />

    <!-- 依赖关系图对话框 -->
    <v-dialog v-model="showDependencyDialog" max-width="1400px" max-height="800px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h6">
            <v-icon>mdi-graph-outline</v-icon>
            任务依赖关系图
          </span>
          <v-btn icon variant="text" @click="showDependencyDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text style="height: 600px">
          <TaskDAGVisualization v-if="showDependencyDialog" :tasks="taskStore.getAllTaskTemplates"
            :dependencies="allDependencies" :compact="false" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDependencyDialog = false"> 关闭 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除所有模板确认对话框 -->
    <v-dialog v-model="showDeleteAllDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center bg-error">
          <v-icon color="white" class="mr-2">mdi-alert-circle</v-icon>
          <span class="text-white">确认删除所有模板</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert type="warning" variant="tonal" class="mb-4">
            <strong>此操作不可撤销！</strong>
          </v-alert>
          <p class="text-body-1 mb-4">
            您确定要删除所有 <strong>{{ taskStore.getAllTaskTemplates.length }}</strong> 个任务模板吗？
          </p>
          <p class="text-body-2 text-medium-emphasis">
            这将同时删除所有关联的任务实例和历史记录。
          </p>
          
          <!-- 确认输入 -->
          <v-text-field
            v-model="deleteConfirmText"
            label="请输入 'DELETE' 确认删除"
            placeholder="DELETE"
            variant="outlined"
            class="mt-4"
            :error="deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE'"
            :error-messages="deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE' ? '请输入正确的确认文字' : ''"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="isDeletingAll" @click="cancelDeleteAll">
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :disabled="deleteConfirmText !== 'DELETE' || isDeletingAll"
            :loading="isDeletingAll"
            @click="confirmDeleteAll"
          >
            <v-icon start>mdi-delete-forever</v-icon>
            确认删除全部
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import DraggableTaskCard from './cards/DraggableTaskCard.vue';
import TaskDAGVisualization from './dag/TaskDAGVisualization.vue';
import TaskTemplateDialog from './dialogs/TaskTemplateDialog.vue';
import { TaskTemplateStatus, TaskType, TaskInstanceStatus } from '@dailyuse/contracts/task';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import { TaskTemplate, TaskInstance } from '@dailyuse/task/domain-client';
// composables
import { getTaskDependencyApiClient } from '@dailyuse/task/infrastructure-client';
import { useTaskTemplate } from '../composables/useTaskTemplate';

const taskDependencyApiClient = getTaskDependencyApiClient();


const taskStore = useTaskStore();
const currentStatus = ref<TaskTemplateStatus>(TaskTemplateStatus.ACTIVE); // 使用枚举类型
const showDeleteDialog = ref(false);
const showDeleteAllDialog = ref(false);
const deleteConfirmText = ref('');
const isDeletingAll = ref(false);
const selectedTemplate = ref<TaskTemplate | null>(null);
const showDependencyDialog = ref(false);
const allDependencies = ref<TaskDependencyClientDTO[]>([]);

// component refs
const taskTemplateDialogRef = ref<InstanceType<typeof TaskTemplateDialog> | null>(null);

// 状态筛选器配置 - 直接使用枚举值
const statusFilters = [
  { label: '进行中', value: TaskTemplateStatus.ACTIVE, icon: 'mdi-play-circle' },
  { label: '已暂停', value: TaskTemplateStatus.PAUSED, icon: 'mdi-pause-circle' },
  { label: '已归档', value: TaskTemplateStatus.ARCHIVED, icon: 'mdi-archive' },
];

// 计算属性
const filteredTemplates = computed(() => {
  const allTemplates = taskStore.getAllTaskTemplates;
  
  // 直接使用枚举值进行匹配，无需转换
  const filtered = allTemplates.filter((template) => {
    return template.status === currentStatus.value;
  });

  // Story 2.2: 按优先级排序 (如果有 priority 字段)
  // 后端已提供优先级字段，这里通过 priority 字段进行排序
  return filtered.sort((a, b) => {
    // 如果都有 priority 字段，按降序排列 (优先级越高越靠前)
    if (a.priority != null && b.priority != null) {
      return b.priority - a.priority;
    }
    // 如果只有一个有 priority，有 priority 的排在前面
    if (a.priority != null) return -1;
    if (b.priority != null) return 1;
    // 都没有 priority 则保持原顺序
    return 0;
  });
});

// 工具方法
const getTemplateCountByStatus = (status: TaskTemplateStatus) => {
  return taskStore.getAllTaskTemplates.filter((template) => template.status === status).length;
};

const getStatusChipColor = (status: TaskTemplateStatus) => {
  switch (status) {
    case TaskTemplateStatus.ACTIVE:
      return 'success';
    case TaskTemplateStatus.PAUSED:
      return 'warning';
    case TaskTemplateStatus.ARCHIVED:
      return 'info';
    case TaskTemplateStatus.DELETED:
      return 'error';
    default:
      return 'default';
  }
};

const getEmptyStateText = () => {
  switch (currentStatus.value) {
    case TaskTemplateStatus.ACTIVE:
      return '暂无进行中的模板';
    case TaskTemplateStatus.PAUSED:
      return '暂无暂停的模板';
    case TaskTemplateStatus.ARCHIVED:
      return '暂无归档的模板';
    case TaskTemplateStatus.DELETED:
      return '暂无已删除的模板';
    default:
      return '暂无模板';
  }
};

const getEmptyStateDescription = () => {
  switch (currentStatus.value) {
    case TaskTemplateStatus.ACTIVE:
      return '创建任务模板来安排你的日常工作，或者为目标的关键结果创建任务';
    case TaskTemplateStatus.PAUSED:
      return '暂停的模板可以随时恢复使用';
    case TaskTemplateStatus.ARCHIVED:
      return '过期的任务模板';
    case TaskTemplateStatus.DELETED:
      return '已删除的模板可以永久清除';
    default:
      return '';
  }
};

const getEmptyStateIcon = () => {
  return statusFilters.find((s) => s.value === currentStatus.value)?.icon || 'mdi-circle';
};

const getEmptyStateIconColor = () => {
  return getStatusChipColor(currentStatus.value);
};

/**
 * Handle dependency created event from DraggableTaskCard
 * Refresh the dependencies list for DAG visualization
 */
const handleDependencyCreated = async (sourceUuid: string, targetUuid: string) => {
  console.log('✅ [TaskTemplateManagement] 依赖关系已创建:', {
    source: sourceUuid,
    target: targetUuid,
  });

  // Refresh dependencies list
  await loadAllDependencies();

  // Optionally show success message or open DAG dialog
  // showDependencyDialog.value = true;
};

/**
 * Load all task dependencies for DAG visualization
 */
const loadAllDependencies = async () => {
  try {
    // Get all template UUIDs
    const templateUuids = taskStore.getAllTaskTemplates.map((t) => t.uuid);

    // Load dependencies for each template
    const dependenciesPromises = templateUuids.map((uuid) =>
      taskDependencyApiClient.getDependencies(uuid),
    );

    const results = await Promise.all(dependenciesPromises);

    // Flatten and deduplicate dependencies
    const allDeps: TaskDependencyClientDTO[] = results.flat();
    const uniqueDeps = Array.from(
      new Map(allDeps.map((dep: TaskDependencyClientDTO) => [dep.uuid, dep])).values(),
    );

    allDependencies.value = uniqueDeps;

    console.log('📊 [TaskTemplateManagement] 加载依赖关系:', {
      totalTemplates: templateUuids.length,
      totalDependencies: uniqueDeps.length,
    });
  } catch (error) {
    console.error('❌ [TaskTemplateManagement] 加载依赖关系失败:', error);
  }
};

// Load dependencies on mount
loadAllDependencies();

// Use task template composable
const { activateTaskTemplate, deleteTaskTemplate } = useTaskTemplate();

/**
 * Handle resume template
 */
const handleResumeTemplate = async (template: TaskTemplate) => {
  try {
    console.log('🔄 [TaskTemplateManagement] 恢复模板:', template.title);
    
    // Call activate API
    await activateTaskTemplate(template.uuid);
    
    console.log('✅ [TaskTemplateManagement] 模板已恢复:', template.title);
  } catch (error) {
    console.error('❌ [TaskTemplateManagement] 恢复模板失败:', error);
  }
};

/**
 * Cancel delete all operation
 */
const cancelDeleteAll = () => {
  showDeleteAllDialog.value = false;
  deleteConfirmText.value = '';
};

/**
 * Confirm delete all templates
 */
const confirmDeleteAll = async () => {
  if (deleteConfirmText.value !== 'DELETE' || isDeletingAll.value) return;
  
  isDeletingAll.value = true;
  
  try {
    // 先复制一份 UUID 列表，避免在删除过程中数组变化导致跳过
    const templateUuids = taskStore.getAllTaskTemplates.map(t => t.uuid);
    console.log('🗑️ [TaskTemplateManagement] 开始删除所有模板, 共:', templateUuids.length);
    
    // Delete templates one by one using the copied UUID list
    for (const uuid of templateUuids) {
      await deleteTaskTemplate(uuid);
    }
    
    console.log('✅ [TaskTemplateManagement] 所有模板已删除');
    
    // Close dialog and reset
    showDeleteAllDialog.value = false;
    deleteConfirmText.value = '';
  } catch (error) {
    console.error('❌ [TaskTemplateManagement] 删除所有模板失败:', error);
  } finally {
    isDeletingAll.value = false;
  }
};

// const pauseTemplate = (template: TaskTemplate) => {
//     handlePauseTaskTemplate(template.uuid)
//         .then(() => {
//             console.log('模板已暂停:', template.title);
//         })
//         .catch((error: Error) => {
//             console.error('暂停模板失败:', error);
//         });
// }

// const resumeTemplate = (template: TaskTemplate) => {
//     handleResumeTaskTemplate(template.uuid)
//         .then(() => {
//             console.log('模板已恢复:', template.title);
//         })
//         .catch((error: Error) => {
//             console.error('恢复模板失败:', error);
//         });
// };
</script>

<style scoped>
#task-template-management {
  padding: 1.5rem;
}

/* 控制栏样式 */
.template-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

/* 操作按钮组样式 */
.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.delete-all-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.filter-group {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.create-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.view-dag-button {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 模板网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

/* 空状态样式 */
.empty-state-card {
  grid-column: 1 / -1;
  border-radius: 16px;
  background: linear-gradient(135deg,
      rgba(var(--v-theme-surface), 0.8),
      rgba(var(--v-theme-background), 0.95));
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .template-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  #task-template-management {
    padding: 1rem;
  }

  .template-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .template-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>

