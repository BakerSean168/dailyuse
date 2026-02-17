<script setup lang="ts">
import { FileExplorer } from '@dailyuse/ui-vue-shadcn/repository';
import type { FolderClient } from '@dailyuse/contracts/repository';

interface Props {
  selectedRepository?: string | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource'): void;
  (e: 'rename-folder', folder: FolderClient): void;
  (e: 'delete-folder', folder: FolderClient): void;
  (e: 'select-folder', folder: FolderClient | null): void;
}>();
</script>

<template>
  <FileExplorer
    :selected-repository="selectedRepository"
    :folders="[]"
    :is-loading="false"
    :error="null"
    @create-folder="emit('create-folder', $event)"
    @create-resource="emit('create-resource')"
    @rename-folder="emit('rename-folder', $event)"
    @delete-folder="emit('delete-folder', $event)"
    @select-folder="emit('select-folder', $event)"
    @add-bookmark="() => {}"
    @refresh="() => {}"
  />
</template>
