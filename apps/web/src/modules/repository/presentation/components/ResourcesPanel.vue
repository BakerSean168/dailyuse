<script setup lang="ts">
import { ResourcesPanel } from '@dailyuse/ui-vue-shadcn/repository';

interface Props {
  repositoryUuid: string | null;
}

defineProps<Props>();

defineExpose({
  refresh: () => {},
});
</script>

<template>
  <ResourcesPanel
    :repository-uuid="repositoryUuid"
    :resources="[]"
    :is-loading="false"
    @upload="() => {}"
    @refresh="() => {}"
    @preview="() => {}"
    @context-menu="() => {}"
  />
</template>
