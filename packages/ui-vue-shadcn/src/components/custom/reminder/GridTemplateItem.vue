<template>
  <div
    class="relative rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    :class="[
      'p-4 flex flex-col items-center justify-center gap-2',
      isTemplateEnabled ? 'bg-card hover:bg-accent/50' : 'bg-muted opacity-60'
    ]"
    draggable="true"
    @click="$emit('click', item)"
    @contextmenu.prevent="handleRightClick"
    @dragstart="onDragStart"
  >
    <!-- Icon -->
    <div
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center',
        isTemplateEnabled ? 'bg-primary/10' : 'bg-muted'
      ]"
    >
      <Bell :class="['h-6 w-6', isTemplateEnabled ? 'text-primary' : 'text-muted-foreground']" />
    </div>

    <!-- Name -->
    <p :class="[
      'text-xs text-center line-clamp-2 font-medium',
      isTemplateEnabled ? 'text-foreground' : 'text-muted-foreground'
    ]">
      {{ item.name }}
    </p>

    <!-- Status Indicator -->
    <div
      v-if="!isTemplateEnabled"
      class="absolute top-2 right-2 w-2 h-2 rounded-full bg-muted-foreground"
    />

    <!-- Context Menu -->
    <div
      v-if="showContextMenu"
      ref="menuRef"
      class="fixed bg-background rounded-lg shadow-lg border min-w-[180px] z-[9999] animate-in fade-in-0 zoom-in-95"
      :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px` }"
      @click.stop
    >
      <div
        class="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
        @click="handleMoveTemplate"
      >
        <FolderInput class="h-4 w-4 mr-2" />
        Move to Group
      </div>
      <div
        class="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
        @click="handleEditTemplate"
      >
        <Pencil class="h-4 w-4 mr-2" />
        Edit Template
      </div>
      <div class="h-[1px] bg-border my-1" />
      <div
        class="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-destructive/10 text-destructive transition-colors"
        @click="handleDeleteTemplate"
      >
        <Trash2 class="h-4 w-4 mr-2" />
        Delete Template
      </div>
    </div>

    <!-- Context Menu Overlay -->
    <div
      v-if="showContextMenu"
      class="fixed inset-0 z-[9998] bg-transparent"
      @click="closeContextMenu"
      @contextmenu.prevent="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { Bell, FolderInput, Pencil, Trash2 } from 'lucide-vue-next';

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
  'click': [item: ReminderTemplate];
  'move': [item: ReminderTemplate];
  'edit': [item: ReminderTemplate];
  'delete': [item: ReminderTemplate];
}>();

const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const menuRef = ref<HTMLElement>();

const isTemplateEnabled = computed(() => props.item.effectiveEnabled);

// Support both injected callbacks and emits for flexibility
const onClickTemplate = inject<(item: ReminderTemplate) => void>('onClickTemplate', (item) => emit('click', item));
const onMoveTemplate = inject<(item: ReminderTemplate) => void>('onMoveTemplate', (item) => emit('move', item));
const onEditTemplate = inject<(item: ReminderTemplate) => void>('onEditTemplate', (item) => emit('edit', item));
const onDeleteTemplate = inject<(item: ReminderTemplate) => void>('onDeleteTemplate', (item) => emit('delete', item));

const onDragStart = (event: DragEvent) => {
  event.dataTransfer?.setData('application/json', JSON.stringify(props.item));
};

const handleRightClick = (event: MouseEvent) => {
  event.preventDefault();
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  showContextMenu.value = true;
};

const closeContextMenu = () => {
  showContextMenu.value = false;
};

const handleMoveTemplate = () => {
  closeContextMenu();
  onMoveTemplate(props.item);
};

const handleEditTemplate = () => {
  closeContextMenu();
  onEditTemplate(props.item);
};

const handleDeleteTemplate = () => {
  closeContextMenu();
  onDeleteTemplate(props.item);
};
</script>
