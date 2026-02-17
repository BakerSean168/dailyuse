<template>
  <NotificationItem
    :notification="notification"
    @click="$emit('click', $event)"
    @mark-read="$emit('mark-read', $event)"
    @delete="$emit('delete', $event)"
  />
</template>

<script setup lang="ts">
import { NotificationItem } from '@dailyuse/ui-vue-shadcn';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

interface Props {
  notification: NotificationClientDTO;
}

defineProps<Props>();

defineEmits<{
  click: [notification: NotificationClientDTO];
  'mark-read': [uuid: string];
  delete: [uuid: string];
}>();
</script>
