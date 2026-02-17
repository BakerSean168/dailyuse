<template>
  <div class="select-none">
    <!-- Node row -->
    <div
      class="flex items-center h-7 px-2 mx-1 rounded hover:bg-accent transition-colors cursor-pointer group"
      :class="{ 'bg-accent': isSelected }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="$emit('select', node)"
      @dblclick="$emit('dblclick', node)"
      @contextmenu.prevent.stop="$emit('contextmenu', $event, node)"
    >
      <!-- Expand/collapse arrow -->
      <button
        v-if="node.type === 'folder'"
        class="mr-0.5 p-0.5 hover:bg-accent rounded opacity-50 hover:opacity-100 transition-opacity"
        @click.stop="$emit('toggle', node)"
      >
        <ChevronRight
          class="h-3.5 w-3.5 transition-transform"
          :class="{ 'rotate-90': isExpanded }"
        />
      </button>
      <span v-else class="w-4 shrink-0" />

      <!-- Icon -->
      <component :is="nodeIcon" class="h-4 w-4 mr-2 shrink-0" :class="iconColorClass" />

      <!-- Name -->
      <span class="text-sm truncate flex-1" :title="node.name">
        {{ displayName }}
      </span>
    </div>

    <!-- Children -->
    <div v-if="node.type === 'folder' && isExpanded && node.children?.length">
      <FileTreeNode
        v-for="child in sortedChildren"
        :key="child.uuid"
        :node="child"
        :level="level + 1"
        :selected-uuid="selectedUuid"
        :expanded-uuids="expandedUuids"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @dblclick="$emit('dblclick', $event)"
        @contextmenu="$emit('contextmenu', $event, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  File,
  Image,
  FileCode,
  FileJson,
} from 'lucide-vue-next';
import type { TreeNode } from '@dailyuse/contracts/repository';

interface Props {
  node: TreeNode;
  level: number;
  selectedUuid: string | null;
  expandedUuids: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [node: TreeNode];
  toggle: [node: TreeNode];
  dblclick: [node: TreeNode];
  contextmenu: [event: MouseEvent, node: TreeNode];
}>();

const isSelected = computed(() => props.selectedUuid === props.node.uuid);
const isExpanded = computed(() => props.expandedUuids.includes(props.node.uuid));

const nodeIcon = computed(() => {
  if (props.node.type === 'folder') {
    return isExpanded.value ? FolderOpen : Folder;
  }

  const ext = props.node.extension?.toLowerCase();
  const iconMap: Record<string, any> = {
    md: FileText,
    markdown: FileText,
    txt: File,
    json: FileJson,
    js: FileCode,
    ts: FileCode,
    vue: FileCode,
    html: FileCode,
    css: FileCode,
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
  };

  return iconMap[ext || ''] || File;
});

const iconColorClass = computed(() => {
  if (props.node.type === 'folder') {
    return 'text-amber-500';
  }
  return 'text-blue-500';
});

const displayName = computed(() => {
  if (props.node.type === 'file' && props.node.name.endsWith('.md')) {
    return props.node.name.slice(0, -3);
  }
  return props.node.name;
});

const sortedChildren = computed(() => {
  if (!props.node.children) return [];

  return [...props.node.children].sort((a, b) => {
    // Folders first
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name, 'zh-CN');
  });
});
</script>
