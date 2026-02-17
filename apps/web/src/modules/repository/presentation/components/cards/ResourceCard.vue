<script setup lang="ts">
import { ResourceCard } from '@dailyuse/ui-vue-shadcn/repository';
import type { Resource } from '@dailyuse/contracts/repository';

const props = defineProps<{
  resource: Resource;
}>();

const emit = defineEmits<{
  view: [resource: Resource];
  edit: [resource: Resource];
  delete: [resource: Resource];
}>();
</script>

<template>
  <ResourceCard
    :resource="resource"
    @view="emit('view', $event)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
  />
</template>
