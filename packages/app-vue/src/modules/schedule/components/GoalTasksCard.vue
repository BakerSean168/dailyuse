<template>
  <ScheduleTasksCard
    :tasks="tasks"
    :is-loading="isLoading"
    :error="error"
    :icon="Target"
    color-scheme="warning"
    title-key="schedule.goalCard.title"
    subtitle-key="schedule.goalCard.subtitle"
    empty-title-key="schedule.goalCard.emptyTitle"
    @pause-task="(id) => emit('pause-task', id)"
    @resume-task="(id) => emit('resume-task', id)"
    @delete-task="(id) => emit('delete-task', id)"
    @view-detail="(id) => emit('view-detail', id)"
  />
</template>

<script setup lang="ts">
import { Target } from '@lucide/vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
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
