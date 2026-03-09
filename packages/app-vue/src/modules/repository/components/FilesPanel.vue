<!--
  FilesPanel - File panel wrapper - shadcn/ui version
-->

<template>
  <div class="h-full">
    <FileTreePanel
      :nodes="nodes"
      :is-loading="isLoading"
      :show-file-info="showFileInfo"
      :is-all-expanded="isAllExpanded"
      @refresh="$emit('refresh')"
      @toggle-expand-all="$emit('toggle-expand-all')"
      @create-folder="$emit('create-folder', $event)"
      @create-resource="$emit('create-resource', $event)"
      @select-node="handleSelectNode"
      @open-file="$emit('open-resource', $event)"
      @rename-node="handleRenameNode"
      @delete-node="handleDeleteNode"
      @create-subfolder="$emit('create-folder', $event.id)"
    />
  </div>
</template>

<script setup lang="ts">
import FileTreePanel from './FileTreePanel.vue';
import type { TreeNode } from '@dailyuse/contracts/repository';

withDefaults(
  defineProps<{
    nodes: TreeNode[];
    isLoading?: boolean;
    showFileInfo?: boolean;
    isAllExpanded?: boolean;
  }>(),
  {
    isLoading: false,
    showFileInfo: false,
    isAllExpanded: false,
  },
);

const emit = defineEmits<{
  refresh: [];
  'toggle-expand-all': [];
  'create-folder': [parentId?: string];
  'create-resource': [folderId?: string];
  'rename-folder': [node: TreeNode];
  'delete-folder': [node: TreeNode];
  'rename-resource': [node: TreeNode];
  'delete-resource': [node: TreeNode];
  'select-folder': [node: TreeNode | null];
  'open-resource': [node: TreeNode];
  'ai-generate-knowledge': [parentFolderId?: string];
}>();

function handleSelectNode(node: TreeNode) {
  if (node.type === 'folder') {
    emit('select-folder', node);
  }
}

function handleRenameNode(node: TreeNode) {
  if (node.type === 'folder') {
    emit('rename-folder', node);
  } else {
    emit('rename-resource', node);
  }
}

function handleDeleteNode(node: TreeNode) {
  if (node.type === 'folder') {
    emit('delete-folder', node);
  } else {
    emit('delete-resource', node);
  }
}
</script>
