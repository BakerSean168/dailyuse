<script setup lang="ts">
import { FileTreePanel } from '@dailyuse/ui-vue-shadcn/repository';
import type { TreeNode } from '@dailyuse/contracts/repository';

interface Props {
  repositoryUuid: string | null;
  showFileInfo?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'create-folder': [];
  'create-resource': [];
  'rename-folder': [uuid: string];
  'delete-folder': [uuid: string];
  'rename-resource': [uuid: string];
  'delete-resource': [uuid: string];
  'select-node': [node: TreeNode];
  'open-file': [node: TreeNode];
}>();
</script>

<template>
  <FileTreePanel
    :nodes="[]"
    :is-loading="false"
    :show-file-info="showFileInfo"
    :is-all-expanded="false"
    @refresh="() => {}"
    @toggle-expand-all="() => {}"
    @create-folder="emit('create-folder')"
    @create-resource="emit('create-resource')"
    @select-node="emit('select-node', $event)"
    @open-file="emit('open-file', $event)"
    @context-menu="() => {}"
  />
</template>
