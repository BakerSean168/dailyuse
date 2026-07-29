<template>
  <ScheduleTasksCard
    :tasks="tasks"
    :is-loading="isLoading"
    :error="error"
    :icon="ListChecks"
    color-scheme="success"
    title-key="schedule.taskModuleCard.title"
    subtitle-key="schedule.taskModuleCard.subtitle"
    empty-title-key="schedule.taskModuleCard.emptyTitle"
    @pause-task="(id) => emit('pause-task', id)"
    @resume-task="(id) => emit('resume-task', id)"
    @delete-task="(id) => emit('delete-task', id)"
    @view-detail="(id) => emit('view-detail', id)"
  />
</template>

<script setup lang="ts">
import { ListChecks } from '@lucide/vue';
import type { ScheduleTaskClientDTO } from '@memoflow/contracts/schedule';
import ScheduleTasksCard from './ScheduleTasksCard.vue';

defineProps<{
  tasks: ScheduleTaskClientDTO[];
  isLoading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  'pause-task': [taskId: string];
  'resume-task': [taskId: string];
  'delete-task': [taskId: string];
  'view-detail': [taskId: string];
}>();
</script>
