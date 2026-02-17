<script setup lang="ts">
import { ObsidianEditor } from '@dailyuse/ui-vue-shadcn/repository';

interface Props {
  resourceUuid: string;
}

defineProps<Props>();
</script>

<template>
  <ObsidianEditor
    :content="''"
    :file-name="''"
    :folder-path="''"
    :is-saving="false"
    :is-dirty="false"
    @save="() => {}"
    @paste-files="() => {}"
    @drop-files="() => {}"
  />
</template>
