<script setup lang="ts">
import { ResourceEditor } from '@dailyuse/ui-vue-shadcn/repository';

const props = defineProps<{
  resourceUuid: string;
}>();
</script>

<template>
  <ResourceEditor
    :resource-uuid="resourceUuid"
    :resource-name="''"
    :content="''"
    :is-saving="false"
    :has-unsaved-changes="false"
    :word-count="0"
    @save-content="() => {}"
  />
</template>
