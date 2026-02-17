<script setup lang="ts">
import { RepoCard } from '@dailyuse/ui-vue-shadcn/repository';
import type { Repository } from '@dailyuse/contracts/repository';

const props = defineProps<{
  repository: Repository;
}>();

const emit = defineEmits<{
  'view-details': [repository: Repository];
  settings: [repository: Repository];
  edit: [repository: Repository];
  delete: [repository: Repository];
}>();
</script>

<template>
  <RepoCard
    :repository="repository"
    @view-details="emit('view-details', $event)"
    @settings="emit('settings', $event)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
  />
</template>
