<template>
  <v-dialog :model-value="modelValue" max-width="800" persistent @update:model-value="(v) => emit('update:modelValue', v)">
    <v-card class="template-selection-dialog">
      <v-card-title class="dialog-header">
        <v-icon color="primary" class="mr-2">mdi-view-grid-plus</v-icon>
        选择任务模板
      </v-card-title>

      <v-card-text class="template-grid">
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular color="primary" indeterminate size="48" class="mb-4" />
          <p class="text-body-1">正在加载模板...</p>
        </div>

        <div v-else-if="templates.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey" class="mb-4">mdi-folder-open-outline</v-icon>
          <p class="text-body-1 text-medium-emphasis">暂无可用模板</p>
        </div>

        <v-card
          v-else
          v-for="template in templates"
          :key="template.id"
          class="template-type-card"
          :class="{ selected: selectedId === template.id }"
          elevation="2"
          hover
          @click="selectedId = template.id"
        >
          <v-card-text class="text-center pa-4">
            <v-avatar color="primary" size="64" class="mb-3">
              <v-icon size="32" color="white">mdi-file-document-outline</v-icon>
            </v-avatar>
            <h3 class="text-h6 mb-2">{{ template.title }}</h3>
            <p class="text-body-2 text-medium-emphasis">{{ template.description || '无描述' }}</p>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn variant="text" @click="emit('cancel')">取消</v-btn>
        <v-btn color="primary" variant="elevated" :disabled="!selectedId" @click="confirmSelection">
          使用模板
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TaskTemplateViewModel } from '../types';

interface Props {
  modelValue: boolean;
  templates: TaskTemplateViewModel[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', templateId: string): void;
  (e: 'cancel'): void;
}>();

const selectedId = ref('');

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      selectedId.value = '';
    }
  },
);

const confirmSelection = () => {
  if (!selectedId.value) return;
  emit('confirm', selectedId.value);
};
</script>

<style scoped>
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

.template-type-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}
</style>
