<template>
  <GoalTasksCard
    :tasks="tasks"
    :is-loading="isLoading"
    :error="error"
    @pause-task="$emit('pause-task', $event)"
    @resume-task="$emit('resume-task', $event)"
    @delete-task="$emit('delete-task', $event)"
    @view-detail="$emit('view-detail', $event)"
  />
</template>

<script setup lang="ts">
import { GoalTasksCard } from '@dailyuse/ui-vue-shadcn';
import type { ScheduleTaskClient } from '@dailyuse/contracts/schedule';

defineProps<{
  tasks: ScheduleTaskClient[];
  isLoading?: boolean;
  error?: string | null;
}>();

defineEmits<{
  'pause-task': [taskUuid: string];
  'resume-task': [taskUuid: string];
  'delete-task': [taskUuid: string];
  'view-detail': [taskUuid: string];
}>();
</script>

