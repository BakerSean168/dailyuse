<!--
  TreeNodeItem - Recursive tree node component - shadcn/ui version
  Story 11.1: 统一的文件树节点组件
-->

<template>
  <div class="tree-node-item">
    <ActionableWrapper :actions="nodeActions" :show-more-button="false">
      <div
        class="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
        :class="{ 'bg-accent': isSelected }"
        @click="handleClick"
        @dblclick="handleDoubleClick"
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
        <span
          v-if="node.type === 'file' && showFileInfo"
          class="text-xs text-muted-foreground shrink-0"
        >
          <span v-if="node.size">{{ formatFileSize(node.size) }}</span>
          <span v-if="node.updatedAt" class="ml-2">{{ formatDate(node.updatedAt) }}</span>
        </span>
      </div>
    </ActionableWrapper>

    <!-- Children (recursive) -->
    <div v-if="node.type === 'folder' && isExpanded && node.children" class="ml-4">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :show-file-info="showFileInfo"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @open="$emit('open', $event)"
        @rename="$emit('rename', $event)"
        @delete="$emit('delete', $event)"
        @create-subfolder="$emit('create-subfolder', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  FileText,
  FileJson,
  FileCode,
  FileImage,
  File,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { TreeNode } from '@dailyuse/contracts/repository';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

const { t } = useI18n();

interface Props {
  node: TreeNode;
  level?: number;
  showFileInfo?: boolean;
  selectedId?: string | null;
  expandedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  showFileInfo: false,
  selectedId: null,
  expandedIds: () => [],
});

const emit = defineEmits<{
  select: [node: TreeNode];
  toggle: [node: TreeNode];
  open: [node: TreeNode];
  rename: [node: TreeNode];
  delete: [node: TreeNode];
  'create-subfolder': [node: TreeNode];
}>();

const isSelected = computed(() => props.selectedId === props.node.id);
const isExpanded = computed(
  () => props.node.type === 'folder' && props.expandedIds.includes(props.node.id),
);

const nodeActions = computed<MenuAction[]>(() => {
  if (props.node.type === 'folder') {
    return [
      {
        key: 'createSubfolder',
        label: menuLabel('createSubfolder'),
        icon: FolderPlus,
        handler: () => emit('create-subfolder', props.node),
      },
      {
        key: 'rename',
        label: menuLabel('rename'),
        icon: Pencil,
        handler: () => emit('rename', props.node),
      },
      {
        key: 'delete',
        label: menuLabel('delete'),
        icon: Trash2,
        destructive: true,
        separator: true,
        handler: () => emit('delete', props.node),
      },
    ];
  }

  return [
    {
      key: 'open',
      label: menuLabel('open'),
      icon: ExternalLink,
      handler: () => emit('open', props.node),
    },
    {
      key: 'rename',
      label: menuLabel('rename'),
      icon: Pencil,
      handler: () => emit('rename', props.node),
    },
    {
      key: 'delete',
      label: menuLabel('delete'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => emit('delete', props.node),
    },
  ];
});

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

  if (days === 0) return t('repository.treeNode.today');
  if (days === 1) return t('repository.treeNode.yesterday');
  if (days < 7) return t('repository.treeNode.daysAgo', { days });

  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
</script>
