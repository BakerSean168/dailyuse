<template>
  <ActionableWrapper :actions="menuActions" :show-more-button="false" wrapper-class="rounded-xl">
    <div
      class="relative rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      :class="[
        'p-4 flex flex-col items-center justify-center gap-2',
        isTemplateEnabled ? 'bg-card hover:bg-accent/50' : 'bg-muted opacity-60',
      ]"
      draggable="true"
      @click="$emit('click', item)"
      @dragstart="onDragStart"
    >
      <!-- Icon -->
      <div
        :class="[
          'w-12 h-12 rounded-full flex items-center justify-center',
          isTemplateEnabled ? 'bg-primary/10' : 'bg-muted',
        ]"
      >
        <Bell :class="['h-6 w-6', isTemplateEnabled ? 'text-primary' : 'text-muted-foreground']" />
      </div>

      <!-- Name -->
      <p
        :class="[
          'text-xs text-center line-clamp-2 font-medium',
          isTemplateEnabled ? 'text-foreground' : 'text-muted-foreground',
        ]"
      >
        {{ item.name }}
      </p>

      <!-- Status Indicator -->
      <div
        v-if="!isTemplateEnabled"
        class="absolute top-2 right-2 w-2 h-2 rounded-full bg-muted-foreground"
      />
    </div>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { Bell, FolderInput, Pencil, Trash2 } from 'lucide-vue-next';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

interface ReminderTemplate {
  id: string;
  name: string;
  effectiveEnabled: boolean;
}

interface Props {
  item: ReminderTemplate;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [item: ReminderTemplate];
  move: [item: ReminderTemplate];
  edit: [item: ReminderTemplate];
  delete: [item: ReminderTemplate];
}>();

const isTemplateEnabled = computed(() => props.item.effectiveEnabled);

// Support both injected callbacks and emits for flexibility
const onMoveTemplate = inject<(item: ReminderTemplate) => void>('onMoveTemplate', (item) =>
  emit('move', item),
);
const onEditTemplate = inject<(item: ReminderTemplate) => void>('onEditTemplate', (item) =>
  emit('edit', item),
);
const onDeleteTemplate = inject<(item: ReminderTemplate) => void>('onDeleteTemplate', (item) =>
  emit('delete', item),
);

const onDragStart = (event: DragEvent) => {
  event.dataTransfer?.setData('application/json', JSON.stringify(props.item));
};

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'move',
    label: menuLabel('moveToGroup'),
    icon: FolderInput,
    handler: () => onMoveTemplate(props.item),
  },
  {
    key: 'edit',
    label: menuLabel('editTemplate'),
    icon: Pencil,
    handler: () => onEditTemplate(props.item),
  },
  {
    key: 'delete',
    label: menuLabel('deleteTemplate'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => onDeleteTemplate(props.item),
  },
]);
</script>
