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
      @context-menu="handleContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import FileTreePanel from './FileTreePanel.vue';
import type { TreeNode } from '@dailyuse/contracts/repository';

interface Props {
  nodes: TreeNode[];
  isLoading?: boolean;
  showFileInfo?: boolean;
  isAllExpanded?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  showFileInfo: false,
  isAllExpanded: false,
});

const emit = defineEmits<{
  refresh: [];
  'toggle-expand-all': [];
  'create-folder': [parentUuid?: string];
  'create-resource': [folderUuid?: string];
  'rename-folder': [node: TreeNode];
  'delete-folder': [node: TreeNode];
  'rename-resource': [node: TreeNode];
  'delete-resource': [node: TreeNode];
  'select-folder': [node: TreeNode | null];
  'open-resource': [node: TreeNode];
  'ai-generate-knowledge': [parentFolderUuid?: string];
}>();

function handleSelectNode(node: TreeNode) {
  if (node.type === 'folder') {
    emit('select-folder', node);
  }
}

function handleContextMenu(event: { node: TreeNode; mouseEvent: MouseEvent }) {
  const { node } = event;
  if (node.type === 'folder') {
    // Handle folder context menu
  } else {
    // Handle file context menu
  }
}
</script>
