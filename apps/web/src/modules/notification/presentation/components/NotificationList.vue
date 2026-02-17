<template>
  <NotificationList
    :notifications="notifications"
    :loading="loading"
    @notification-click="$emit('notification-click', $event)"
    @mark-read="$emit('mark-read', $event)"
    @delete="$emit('delete', $event)"
  />
</template>

<script setup lang="ts">
import { NotificationList } from '@dailyuse/ui-vue-shadcn';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

interface Props {
  notifications: NotificationClientDTO[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  'notification-click': [notification: NotificationClientDTO];
  'mark-read': [uuid: string];
  delete: [uuid: string];
}>();
</script>
