<script setup lang="ts">
import { FilesPanel } from '@dailyuse/ui-vue-shadcn/repository';
import type { TreeNode } from '@dailyuse/contracts/repository';

interface Props {
  selectedRepository: string | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource', folderUuid?: string): void;
  (e: 'rename-folder', node: TreeNode): void;
  (e: 'delete-folder', node: TreeNode): void;
  (e: 'rename-resource', node: TreeNode): void;
  (e: 'delete-resource', node: TreeNode): void;
  (e: 'select-folder', node: TreeNode | null): void;
  (e: 'ai-generate-knowledge', parentFolderUuid?: string): void;
}>();

defineExpose({
  refresh: () => {},
});
</script>

<template>
  <FilesPanel
    :nodes="[]"
    :is-loading="false"
    @refresh="() => {}"
    @toggle-expand-all="() => {}"
    @create-folder="emit('create-folder', $event)"
    @create-resource="emit('create-resource', $event)"
    @rename-folder="emit('rename-folder', $event)"
    @delete-folder="emit('delete-folder', $event)"
    @rename-resource="emit('rename-resource', $event)"
    @delete-resource="emit('delete-resource', $event)"
    @select-folder="emit('select-folder', $event)"
    @open-resource="() => {}"
    @ai-generate-knowledge="emit('ai-generate-knowledge', $event)"
  />
</template>
