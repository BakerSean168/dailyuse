<template>
  <div id="task-template-management">
    <div class="template-controls">
      <div class="template-filters">
        <v-btn-toggle v-model="currentStatus" mandatory variant="outlined" divided class="filter-group">
          <v-btn
            v-for="status in statusFilters"
            :key="status.value"
            :value="status.value"
            class="filter-button"
            size="large"
          >
            <v-icon :icon="status.icon" start />
            {{ status.label }}
            <v-chip size="small" :color="getStatusChipColor(status.value)" variant="elevated" class="ml-2">
              {{ getTemplateCountByStatus(status.value) }}
            </v-chip>
          </v-btn>
        </v-btn-toggle>
      </div>

      <div class="action-buttons">
        <v-btn
          v-if="templates.length > 0"
          data-testid="view-dependency-graph-button"
          color="info"
          variant="outlined"
          size="large"
          prepend-icon="mdi-graph-outline"
          @click="showDependencyDialog = true"
          class="view-dag-button"
        >
          查看依赖关系图
        </v-btn>

        <v-btn
          v-if="templates.length > 0"
          data-testid="delete-all-templates-button"
          color="error"
          variant="outlined"
          size="large"
          prepend-icon="mdi-delete-sweep"
          @click="showDeleteAllDialog = true"
          class="delete-all-button"
        >
          删除所有模板
        </v-btn>

        <v-btn
          data-testid="create-task-template-button"
          color="primary"
          variant="elevated"
          size="large"
          prepend-icon="mdi-plus"
          @click="emit('create-template')"
          class="create-button"
        >
          创建新模板
        </v-btn>
      </div>
    </div>

    <div class="template-grid">
      <v-card v-if="filteredTemplates.length === 0" class="empty-state-card" elevation="2">
        <v-card-text class="text-center pa-8">
          <v-icon :color="getStatusChipColor(currentStatus)" size="64" class="mb-4">
            {{ getEmptyStateIcon() }}
          </v-icon>
          <h3 class="text-h5 mb-2">{{ getEmptyStateText() }}</h3>
          <v-btn v-if="currentStatus === 'ACTIVE'" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="emit('create-template')" class="mt-4">
            创建第一个模板
          </v-btn>
        </v-card-text>
      </v-card>

      <DraggableTaskCard
        v-for="template in filteredTemplates"
        :key="template.uuid"
        :template="template"
        :enable-drag="true"
        :on-create-dependency="handleCreateDependency"
        @edit="(id) => emit('edit-template', id)"
        @delete="(tpl) => emit('delete-template', tpl)"
        @resume="(tpl) => emit('resume-template', tpl)"
      />
    </div>

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
          <TaskDAGVisualization
            v-if="showDependencyDialog"
            :tasks="templates as any"
            :dependencies="dependencies"
            :compact="false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

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
          <p class="text-body-1 mb-4">您确定要删除所有 <strong>{{ templates.length }}</strong> 个任务模板吗？</p>
          <v-text-field
            v-model="deleteConfirmText"
            label="请输入 'DELETE' 确认删除"
            placeholder="DELETE"
            variant="outlined"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelDeleteAll">取消</v-btn>
          <v-btn color="error" variant="elevated" :disabled="deleteConfirmText !== 'DELETE'" @click="confirmDeleteAll">
            <v-icon start>mdi-delete-forever</v-icon>
            确认删除全部
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import DraggableTaskCard from './cards/DraggableTaskCard.vue';
import TaskDAGVisualization from './dag/TaskDAGVisualization.vue';
import type { TaskTemplateViewModel } from './types';

interface StatusFilter {
  label: string;
  value: string;
  icon: string;
}

interface Props {
  templates: TaskTemplateViewModel[];
  dependencies: TaskDependencyClientDTO[];
  statusFilters?: StatusFilter[];
  onCreateDependency?: (sourceUuid: string, targetUuid: string) => Promise<boolean> | boolean;
}

const props = withDefaults(defineProps<Props>(), {
  statusFilters: () => [
    { label: '进行中', value: 'ACTIVE', icon: 'mdi-play-circle' },
    { label: '已暂停', value: 'PAUSED', icon: 'mdi-pause-circle' },
    { label: '已归档', value: 'ARCHIVED', icon: 'mdi-archive' },
  ],
});

const emit = defineEmits<{
  (e: 'create-template'): void;
  (e: 'edit-template', templateUuid: string): void;
  (e: 'delete-template', template: TaskTemplateViewModel): void;
  (e: 'resume-template', template: TaskTemplateViewModel): void;
  (e: 'delete-all-templates'): void;
  (e: 'dependency-created', sourceUuid: string, targetUuid: string): void;
}>();

const currentStatus = ref('ACTIVE');
const showDeleteAllDialog = ref(false);
const deleteConfirmText = ref('');
const showDependencyDialog = ref(false);

const templates = computed(() => props.templates || []);

const filteredTemplates = computed(() => {
  return [...templates.value]
    .filter((template) => template.status === currentStatus.value)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
});

const getTemplateCountByStatus = (status: string) => {
  return templates.value.filter((template) => template.status === status).length;
};

const getStatusChipColor = (status: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PAUSED') return 'warning';
  if (status === 'ARCHIVED') return 'info';
  if (status === 'DELETED') return 'error';
  return 'default';
};

const getEmptyStateText = () => {
  if (currentStatus.value === 'ACTIVE') return '暂无进行中的模板';
  if (currentStatus.value === 'PAUSED') return '暂无暂停的模板';
  if (currentStatus.value === 'ARCHIVED') return '暂无归档的模板';
  return '暂无模板';
};

const getEmptyStateIcon = () => {
  return props.statusFilters.find((s) => s.value === currentStatus.value)?.icon || 'mdi-circle';
};

const handleCreateDependency = async (source: TaskTemplateViewModel, target: TaskTemplateViewModel) => {
  const created = await props.onCreateDependency?.(source.uuid, target.uuid);
  if (created !== false) {
    emit('dependency-created', source.uuid, target.uuid);
    return true;
  }
  return false;
};

const cancelDeleteAll = () => {
  showDeleteAllDialog.value = false;
  deleteConfirmText.value = '';
};

const confirmDeleteAll = () => {
  if (deleteConfirmText.value !== 'DELETE') return;
  emit('delete-all-templates');
  cancelDeleteAll();
};
</script>

<style scoped>
#task-template-management {
  padding: 1.5rem;
}

.template-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

.empty-state-card {
  grid-column: 1 / -1;
}
</style>
