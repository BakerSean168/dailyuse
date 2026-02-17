/** * Draggable Task Card Wrapper * * Wraps TaskTemplateCard with drag-and-drop functionality. *
Provides visual feedback and dependency creation via drag-drop. * * @module DraggableTaskCard */
<template>
  <div
    data-testid="draggable-task-card"
    :data-task-uuid="template.uuid"
    :data-dragging="isDragging && draggedTaskUuid === template.uuid"
    :data-valid-drop="isValidDrop && dropTargetUuid === template.uuid"
    :data-invalid-drop="!isValidDrop && dropTargetUuid === template.uuid && isDragging"
    :class="{
      'draggable-task-card': true,
      'draggable-task-card--dragging': isDragging && draggedTaskUuid === template.uuid,
      'draggable-task-card--drag-over': isValidDrop && dropTargetUuid === template.uuid,
      'draggable-task-card--invalid-drop':
        !isValidDrop && dropTargetUuid === template.uuid && isDragging,
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
      <v-icon size="small" color="grey">mdi-drag-vertical</v-icon>
    </div>

    <!-- Drop Zone Indicator (when valid drop target) -->
    <div
      v-if="isValidDrop && dropTargetUuid === template.uuid"
      class="drop-zone-indicator"
      data-testid="drop-zone-valid"
    >
      <v-icon color="success" size="large">mdi-plus-circle</v-icon>
      <span class="drop-zone-text">松开创建依赖关系</span>
    </div>

    <!-- Invalid Drop Indicator -->
    <div
      v-else-if="!isValidDrop && dropTargetUuid === template.uuid && isDragging"
      class="drop-zone-indicator invalid"
      data-testid="drop-zone-invalid"
    >
      <v-icon color="error" size="large">mdi-close-circle</v-icon>
      <span class="drop-zone-text">无法创建依赖</span>
    </div>

    <!-- Original Task Card -->
    <TaskTemplateCard :template="template" @edit="handleEdit" @delete="handleDelete" @resume="handleResume" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaskTemplateCard from './TaskTemplateCard.vue';
import type { TaskTemplateViewModel } from '../types';


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
  edit: [templateUuid: string]; // Changed: TaskTemplateCard emits uuid string, not full DTO
  delete: [template: TaskTemplateViewModel];
  resume: [template: TaskTemplateViewModel];
  dependencyCreated: [sourceUuid: string, targetUuid: string];
}>();

// Event handlers for TaskTemplateCard
const handleEdit = (templateUuid: string) => {
  // Changed: accepts string, not DTO
  emit('edit', templateUuid);
};

const handleDelete = (template: TaskTemplateViewModel) => {
  emit('delete', template);
};

const handleResume = (template: TaskTemplateViewModel) => {
  emit('resume', template);
};

const isDragging = ref(false);
const draggedTaskUuid = ref<string | null>(null);
const dropTargetUuid = ref<string | null>(null);
const isValidDrop = ref(false);

const validateDrop = (source: TaskTemplateViewModel, target: TaskTemplateViewModel): boolean => {
  if (source.uuid === target.uuid) return false;
  if (props.canDrop) {
    return props.canDrop(source, target);
  }
  return true;
};

// Drag event handlers
const onDragStart = (event: DragEvent) => {
  if (!props.enableDrag) return;
  isDragging.value = true;
  draggedTaskUuid.value = props.template.uuid;

  // Set drag data for native drag-and-drop
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'task-template',
        uuid: props.template.uuid,
        title: props.template.title,
      }),
    );
  }
};

const onDragEnd = (event: DragEvent) => {
  isDragging.value = false;
  draggedTaskUuid.value = null;
  dropTargetUuid.value = null;
  isValidDrop.value = false;
};

const onDragOver = (event: DragEvent) => {
  if (!isDragging.value) return;
  if (draggedTaskUuid.value === props.template.uuid) return;

  const source: TaskTemplateViewModel = {
    ...props.template,
    uuid: draggedTaskUuid.value || props.template.uuid,
  };
  dropTargetUuid.value = props.template.uuid;
  isValidDrop.value = validateDrop(source, props.template);

  // Set drop effect based on validation
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = isValidDrop.value ? 'copy' : 'none';
  }
};

const onDragLeave = (event: DragEvent) => {
  dropTargetUuid.value = null;
  isValidDrop.value = false;
};

const onDrop = async (event: DragEvent) => {
  if (!isDragging.value || !draggedTaskUuid.value) return;
  if (draggedTaskUuid.value === props.template.uuid) return;

  const source: TaskTemplateViewModel = {
    ...props.template,
    uuid: draggedTaskUuid.value,
  };

  if (!validateDrop(source, props.template)) {
    return;
  }

  let created = true;
  if (props.onCreateDependency) {
    created = await props.onCreateDependency(source, props.template);
  }

  if (created) {
    emit('dependencyCreated', source.uuid, props.template.uuid);
  }

  isDragging.value = false;
  draggedTaskUuid.value = null;
  dropTargetUuid.value = null;
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
  border: 2px solid rgb(var(--v-theme-success));
  background-color: rgba(76, 175, 80, 0.08);
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.3);
  transform: scale(1.02);
}

/* Invalid drop target */
.draggable-task-card--invalid-drop {
  border: 2px solid rgb(var(--v-theme-error));
  background-color: rgba(244, 67, 54, 0.08);
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
  background: rgba(var(--v-theme-surface), 0.8);
  cursor: grab;
}

.draggable-task-card:hover .drag-handle {
  opacity: 0.7;
}

.drag-handle:hover {
  opacity: 1 !important;
  background: rgba(var(--v-theme-surface), 0.95);
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
  background: rgba(var(--v-theme-surface), 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.drop-zone-indicator.invalid {
  background: rgba(244, 67, 54, 0.95);
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

