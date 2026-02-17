<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[9999] bg-transparent"
    @click="$emit('close')"
    @contextmenu.prevent="$emit('close')"
  >
    <div
      ref="menuRef"
      class="fixed bg-background rounded-lg shadow-lg border min-w-[200px] max-w-[300px] overflow-hidden animate-in fade-in-0 zoom-in-95"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @click.stop
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        :class="[
          'flex items-center px-3 py-2 text-sm transition-colors',
          {
            'cursor-pointer hover:bg-accent': !item.divider && !item.disabled,
            'h-[1px] bg-border my-1 px-0 py-0': item.divider,
            'opacity-40 cursor-not-allowed': item.disabled,
            'text-destructive hover:bg-destructive/10': item.danger && !item.disabled,
          }
        ]"
        @click="handleItemClick(item)"
      >
        <template v-if="!item.divider">
          <component
            v-if="item.icon"
            :is="getIcon(item.icon)"
            :class="['h-4 w-4 mr-2', item.iconColor && `text-${item.iconColor}`]"
          />
          <span class="flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.shortcut" class="text-xs text-muted-foreground ml-auto">
            {{ item.shortcut }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import * as LucideIcons from 'lucide-vue-next';

interface MenuItem {
  label?: string;
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  action?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
}

interface Props {
  show?: boolean;
  x: number;
  y: number;
  items: MenuItem[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  select: [action: () => void];
  close: [];
}>();

const menuRef = ref<HTMLElement>();

const getIcon = (iconName: string) => {
  // Map common mdi icons to lucide icons
  const iconMap: Record<string, string> = {
    'mdi-pencil': 'Pencil',
    'mdi-delete': 'Trash2',
    'mdi-eye': 'Eye',
    'mdi-folder-move': 'FolderInput',
    'mdi-folder-remove': 'FolderMinus',
    'mdi-play': 'Play',
    'mdi-pause': 'Pause',
    'mdi-check': 'Check',
    'mdi-close': 'X',
  };

  const lucideName = iconMap[iconName] || iconName;
  return (LucideIcons as any)[lucideName] || LucideIcons.Circle;
};

const adjustMenuPosition = async () => {
  await nextTick();
  if (!menuRef.value) return;

  const menu = menuRef.value;
  const rect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let { x, y } = props;

  if (rect.right > viewportWidth) {
    x = viewportWidth - rect.width - 10;
  }
  if (rect.bottom > viewportHeight) {
    y = viewportHeight - rect.height - 10;
  }
  if (x < 0) x = 10;
  if (y < 0) y = 10;

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
};

const handleItemClick = (item: MenuItem) => {
  if (item.divider || item.disabled) return;
  
  if (item.action) {
    item.action();
    emit('select', item.action);
  }
  
  emit('close');
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  if (props.show) {
    adjustMenuPosition();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

watch(() => props.show, (newValue) => {
  if (newValue) {
    adjustMenuPosition();
  }
});
</script>
