<script setup lang="ts">
import { AIKnowledgeGeneratorDialog } from '@dailyuse/ui-vue-shadcn/repository';

interface Props {
  modelValue: boolean;
  repositoryUuid: string | null;
  parentFolderUuid?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'generated', data: { folderUuid?: string; resourceUuid: string }): void;
}>();
</script>

<template>
  <AIKnowledgeGeneratorDialog
    :open="modelValue"
    :repository-name="'知识库'"
    :parent-folder-name="''"
    @update:open="emit('update:modelValue', $event)"
    @generate="() => {}"
    @open-document="() => {}"
  />
</template>
