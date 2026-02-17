<!--
  TreeNodeItem - Recursive tree node component - shadcn/ui version
  Story 11.1: 统一的文件树节点组件
-->

<template>
  <div class="tree-node-item">
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
      :class="{ 'bg-accent': isSelected }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- Expand/Collapse (folders only) -->
      <Button
        v-if="node.type === 'folder'"
        variant="ghost"
        size="icon"
        class="h-5 w-5 shrink-0"
        @click.stop="$emit('toggle', node)"
      >
        <ChevronRight class="h-4 w-4 transition-transform" :class="{ 'rotate-90': isExpanded }" />
      </Button>
      <span v-else class="w-5" />

      <!-- Icon -->
      <component :is="getNodeIcon()" :class="getIconClass()" class="w-4 h-4 shrink-0" />

      <!-- Name -->
      <span class="text-sm truncate flex-1" :title="node.path">{{ node.name }}</span>

      <!-- File Info (optional) -->
      <span v-if="node.type === 'file' && showFileInfo" class="text-xs text-muted-foreground shrink-0">
        <span v-if="node.size">{{ formatFileSize(node.size) }}</span>
        <span v-if="node.updatedAt" class="ml-2">{{ formatDate(node.updatedAt) }}</span>
      </span>
    </div>

    <!-- Children (recursive) -->
    <div v-if="node.type === 'folder' && isExpanded && node.children" class="ml-4">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.uuid"
        :node="child"
        :level="level + 1"
        :show-file-info="showFileInfo"
        :selected-uuid="selectedUuid"
        :expanded-uuids="expandedUuids"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @open="$emit('open', $event)"
        @context-menu="$emit('context-menu', $event)"
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
  FileJson,
  FileCode,
  FileImage,
  File,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import type { TreeNode } from '@dailyuse/contracts/repository';

interface Props {
  node: TreeNode;
  level?: number;
  showFileInfo?: boolean;
  selectedUuid?: string | null;
  expandedUuids?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  showFileInfo: false,
  selectedUuid: null,
  expandedUuids: () => [],
});

const emit = defineEmits<{
  select: [node: TreeNode];
  toggle: [node: TreeNode];
  open: [node: TreeNode];
  'context-menu': [event: { node: TreeNode; mouseEvent: MouseEvent }];
}>();

const isSelected = computed(() => props.selectedUuid === props.node.uuid);
const isExpanded = computed(() => props.node.type === 'folder' && props.expandedUuids.includes(props.node.uuid));

function getNodeIcon() {
  if (props.node.type === 'folder') {
    return isExpanded.value ? FolderOpen : Folder;
  }
  
  const ext = props.node.extension?.toLowerCase();
  const iconMap: Record<string, any> = {
    md: FileText,
    txt: FileText,
    json: FileJson,
    js: FileCode,
    ts: FileCode,
    vue: FileCode,
    html: FileCode,
    css: FileCode,
    png: FileImage,
    jpg: FileImage,
    jpeg: FileImage,
    gif: FileImage,
    svg: FileImage,
  };
  
  return iconMap[ext || ''] || File;
}

function getIconClass() {
  if (props.node.type === 'folder') {
    return isExpanded.value ? 'text-primary' : 'text-muted-foreground';
  }
  
  const ext = props.node.extension?.toLowerCase();
  const colorMap: Record<string, string> = {
    md: 'text-blue-500',
    json: 'text-yellow-500',
    js: 'text-yellow-500',
    ts: 'text-blue-500',
    vue: 'text-green-500',
    png: 'text-purple-500',
    jpg: 'text-purple-500',
  };
  
  return colorMap[ext || ''] || 'text-muted-foreground';
}

function handleClick() {
  emit('select', props.node);
}

function handleDoubleClick() {
  if (props.node.type === 'file') {
    emit('open', props.node);
  } else {
    emit('toggle', props.node);
  }
}

function handleContextMenu(event: MouseEvent) {
  emit('context-menu', { node: props.node, mouseEvent: event });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
</script>
