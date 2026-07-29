<template>
  <ScheduleTasksCard
    :tasks="tasks"
    :is-loading="isLoading"
    :error="error"
    :icon="Bell"
    color-scheme="info"
    title-key="schedule.reminderCard.title"
    subtitle-key="schedule.reminderCard.subtitle"
    empty-title-key="schedule.reminderCard.emptyTitle"
    @pause-task="(id) => emit('pause-task', id)"
    @resume-task="(id) => emit('resume-task', id)"
    @delete-task="(id) => emit('delete-task', id)"
    @view-detail="(id) => emit('view-detail', id)"
  />
</template>

<script setup lang="ts">
import { Bell } from '@lucide/vue';
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
