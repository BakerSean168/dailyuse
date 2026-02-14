<!--
  TODO: 此组件已废弃 - MetaTemplate 功能已移除
  此对话框用于选择元模板（MetaTemplate）来创建任务模板
  由于元模板功能已被移除，此组件应该被删除或重构为其他用途
  
  建议：
  1. 如果需要模板选择功能，重构为选择现有 TaskTemplate 作为模板
  2. 或者直接删除此文件，使用 TaskTemplateDialog 直接创建任务
-->
<template>
  <v-dialog :model-value="visible" max-width="800" persistent>
    <v-card class="template-selection-dialog">
      <v-card-title class="dialog-header">
        <v-icon color="primary" class="mr-2">mdi-view-grid-plus</v-icon>
        选择任务模板类型
      </v-card-title>

      <v-card-text class="template-grid">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular color="primary" indeterminate size="48" class="mb-4" />
          <p class="text-body-1">正在加载模板...</p>
        </div>

        <!-- 无数据状态 -->
        <div v-else-if="metaTemplates.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey" class="mb-4">mdi-folder-open-outline</v-icon>
          <p class="text-body-1 text-medium-emphasis">暂无可用模板</p>
          <v-btn color="primary" variant="text" @click="loadMetaTemplates"> 重新加载 </v-btn>
        </div>

        <!-- 模板列表 -->
        <v-card v-else v-for="metaTemplate in metaTemplates" :key="metaTemplate.uuid" class="template-type-card"
          :class="{ selected: selectedmetaTemplateUuid === metaTemplate.uuid }" elevation="2" hover
          @click="selectMetaTemplate(metaTemplate.uuid)">
          <v-card-text class="text-center pa-4">
            <v-avatar :color="getMetaTemplateColor(metaTemplate.name)" size="64" class="mb-3">
              <v-icon size="32" color="white">
                {{ getMetaTemplateIcon(metaTemplate.name) }}
              </v-icon>
            </v-avatar>

            <h3 class="text-h6 mb-2">{{ metaTemplate.name }}</h3>
            <p class="text-body-2 text-medium-emphasis">
              {{ metaTemplate.description }}
            </p>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn variant="text" @click="handleCancel"> 取消 </v-btn>
        <v-btn color="primary" variant="elevated" :disabled="!selectedmetaTemplateUuid" @click="confirmSelection">
          继续创建
        </v-btn>
      </v-card-actions>
    </v-card>
    <TaskTemplateDialog ref="taskTemplateDialogRef" />
  </v-dialog>
</template>

<script setup lang="ts">
// @ts-nocheck
// TODO: MetaTemplate 功能已移除，此组件应被删除或完全重构
import { ref, watch, onMounted } from 'vue';
import { useTaskStore } from '@/modules/task/presentation/stores/taskStore';
// components
import TaskTemplateDialog from './TaskTemplateDialog.vue';

const taskStore = useTaskStore();
const visible = ref(false);
const selectedmetaTemplateUuid = ref<string>('');
const loading = ref(false);

// component refs
const taskTemplateDialogRef = ref<InstanceType<typeof TaskTemplateDialog> | null>(null);

// TaskMetaTemplate 功能已移除，此组件可能需要重构或移除

const selectMetaTemplate = (metaTemplateUuid: string) => {
  selectedmetaTemplateUuid.value = metaTemplateUuid;
};

const confirmSelection = () => {
  if (selectedmetaTemplateUuid.value) {
    taskTemplateDialogRef?.value?.openForCreationWithMetaTemplateUuid(
      selectedmetaTemplateUuid.value,
    );
    visible.value = false;
  }
};

const getMetaTemplateColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    general: 'grey',
    habit: 'green',
    work: 'blue',
    event: 'orange',
    deadline: 'red',
    meeting: 'purple',
  };
  return colorMap[category] || 'grey';
};

const getMetaTemplateIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    general: 'mdi-file-outline',
    habit: 'mdi-repeat',
    work: 'mdi-briefcase',
    event: 'mdi-calendar-star',
    deadline: 'mdi-clock-alert',
    meeting: 'mdi-account-group',
  };
  return iconMap[category] || 'mdi-file-outline';
};

// 重置选择当对话框关闭时
watch(
  () => visible,
  (newVal) => {
    if (!newVal) {
      selectedmetaTemplateUuid.value = '';
    }
  },
);

const handleCancel = () => {
  closeDialog();
};

// 工具函数
const openDialog = () => {
  visible.value = true;
};

const closeDialog = () => {
  visible.value = false;
  selectedmetaTemplateUuid.value = '';
};

defineExpose({
  openDialog,
});
</script>

<style scoped>
.template-selection-dialog {
  border-radius: 16px;
}

.dialog-header {
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.1),
      rgba(var(--v-theme-secondary), 0.05));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.template-type-card {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.template-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-type-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.template-features {
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.dialog-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
</style>
