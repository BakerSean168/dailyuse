/** * Draggable Task Card Wrapper * * Wraps TaskTemplateCard with drag-and-drop functionality. *
Provides visual feedback and dependency creation via drag-drop. * * @module DraggableTaskCard */
<template>
  <div
    data-testid="draggable-task-card"
    :data-task-id="template.id"
    :data-dragging="isDragging && draggedTaskId === template.id"
    :data-valid-drop="isValidDrop && dropTargetId === template.id"
    :data-invalid-drop="!isValidDrop && dropTargetId === template.id && isDragging"
    :class="{
      'draggable-task-card': true,
      'draggable-task-card--dragging': isDragging && draggedTaskId === template.id,
      'draggable-task-card--drag-over': isValidDrop && dropTargetId === template.id,
      'draggable-task-card--invalid-drop':
        !isValidDrop && dropTargetId === template.id && isDragging,
    }"
    :draggable="enableDrag"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Drag Handle (visible on hover) -->
    <div v-if="enableDrag && !isDragging" class="drag-handle" data-testid="drag-handle">
      <GripVertical class="h-4 w-4 text-gray-400" />
    </div>

    <!-- Drop Zone Indicator (when valid drop target) -->
    <div
      v-if="isValidDrop && dropTargetId === template.id"
      class="drop-zone-indicator"
      data-testid="drop-zone-valid"
    >
      <PlusCircle class="h-8 w-8 text-green-500" />
      <span class="drop-zone-text">{{ t('task.draggableCard.releaseToDep') }}</span>
    </div>

    <!-- Invalid Drop Indicator -->
    <div
      v-else-if="!isValidDrop && dropTargetId === template.id && isDragging"
      class="drop-zone-indicator invalid"
      data-testid="drop-zone-invalid"
    >
      <XCircle class="h-8 w-8 text-red-500" />
      <span class="drop-zone-text">{{ t('task.draggableCard.cannotCreateDep') }}</span>
    </div>

    <!-- Original Task Card -->
    <TaskTemplateCard
      :template="template"
      @edit="handleEdit"
      @delete="handleDelete"
      @resume="handleResume"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GripVertical, PlusCircle, XCircle } from 'lucide-vue-next';
import TaskTemplateCard from './TaskTemplateCard.vue';
import type { TaskTemplateViewModel } from '../types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
interface Props {
  template: TaskTemplateViewModel;
  enableDrag?: boolean;
  canDrop?: (source: TaskTemplateViewModel, target: TaskTemplateViewModel) => boolean;
  onCreateDependency?: (
    source: TaskTemplateViewModel,
    target: TaskTemplateViewModel,
  ) => Promise<boolean> | boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enableDrag: true,
});

// Emits
const emit = defineEmits<{
  edit: [templateId: string]; // Changed: TaskTemplateCard emits id string, not full DTO
  delete: [template: TaskTemplateViewModel];
  resume: [template: TaskTemplateViewModel];
  dependencyCreated: [sourceId: string, targetId: string];
}>();

// Event handlers for TaskTemplateCard
const handleEdit = (templateId: string) => {
  // Changed: accepts string, not DTO
  emit('edit', templateId);
};

const handleDelete = (template: TaskTemplateViewModel) => {
  emit('delete', template);
};

const handleResume = (template: TaskTemplateViewModel) => {
  emit('resume', template);
};

const isDragging = ref(false);
const draggedTaskId = ref<string | null>(null);
const dropTargetId = ref<string | null>(null);
const isValidDrop = ref(false);

const validateDrop = (source: TaskTemplateViewModel, target: TaskTemplateViewModel): boolean => {
  if (source.id === target.id) return false;
  if (props.canDrop) {
    return props.canDrop(source, target);
  }
  return true;
};

// Drag event handlers
const onDragStart = (event: DragEvent) => {
  if (!props.enableDrag) return;
  isDragging.value = true;
  draggedTaskId.value = props.template.id;

  // Set drag data for native drag-and-drop
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'task-template',
        id: props.template.id,
        title: props.template.title,
      }),
    );
  }
};

const onDragEnd = (event: DragEvent) => {
  isDragging.value = false;
  draggedTaskId.value = null;
  dropTargetId.value = null;
  isValidDrop.value = false;
};

const onDragOver = (event: DragEvent) => {
  if (!isDragging.value) return;
  if (draggedTaskId.value === props.template.id) return;

  const source: TaskTemplateViewModel = {
    ...props.template,
    id: draggedTaskId.value || props.template.id,
  };
  dropTargetId.value = props.template.id;
  isValidDrop.value = validateDrop(source, props.template);

  // Set drop effect based on validation
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = isValidDrop.value ? 'copy' : 'none';
  }
};

const onDragLeave = (event: DragEvent) => {
  dropTargetId.value = null;
  isValidDrop.value = false;
};

const onDrop = async (event: DragEvent) => {
  if (!isDragging.value || !draggedTaskId.value) return;
  if (draggedTaskId.value === props.template.id) return;

  const source: TaskTemplateViewModel = {
    ...props.template,
    id: draggedTaskId.value,
  };

  if (!validateDrop(source, props.template)) {
    return;
  }

  let created = true;
  if (props.onCreateDependency) {
    created = await props.onCreateDependency(source, props.template);
  }

  if (created) {
    emit('dependencyCreated', source.id, props.template.id);
  }

  isDragging.value = false;
  draggedTaskId.value = null;
  dropTargetId.value = null;
  isValidDrop.value = false;
};
</script>

<style scoped>
.draggable-task-card {
  position: relative;
  transition: all 0.2s ease;
  cursor: grab;
}

.draggable-task-card:active {
  cursor: grabbing;
}

/* Dragging state */
.draggable-task-card--dragging {
  opacity: 0.5;
  transform: scale(1.02);
  cursor: grabbing;
}

/* Valid drop target */
.draggable-task-card--drag-over {
  border: 2px solid rgb(34 197 94);
  background-color: rgba(34, 197, 94, 0.08);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
  transform: scale(1.02);
}

/* Invalid drop target */
.draggable-task-card--invalid-drop {
  border: 2px solid rgb(239 68 68);
  background-color: rgba(239, 68, 68, 0.08);
  cursor: not-allowed;
}

/* Drag handle */
.drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 4px;
  border-radius: 4px;
  background: hsl(var(--background) / 0.8);
  cursor: grab;
}

.draggable-task-card:hover .drag-handle {
  opacity: 0.7;
}

.drag-handle:hover {
  opacity: 1 !important;
  background: hsl(var(--background) / 0.95);
}

/* Drop zone indicator */
.drop-zone-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: hsl(var(--background) / 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.drop-zone-indicator.invalid {
  background: rgba(239, 68, 68, 0.95);
  color: white;
}

.drop-zone-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.drop-zone-indicator.invalid .drop-zone-text {
  color: white;
}

/* Animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.draggable-task-card--drag-over,
.draggable-task-card--invalid-drop {
  animation: pulse 1s ease-in-out infinite;
}

/* Disable animations for dragging card */
.draggable-task-card--dragging * {
  transition: none !important;
  animation: none !important;
}
</style>
