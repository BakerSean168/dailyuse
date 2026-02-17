<template>
  <NotificationDrawer
    :model-value="modelValue"
    :unread-count="unreadCount"
    @update:model-value="$emit('update:modelValue', $event)"
    @mark-all-read="$emit('mark-all-read')"
    @view-all="handleViewAll"
  >
    <NotificationList
      :notifications="notifications"
      :loading="loading"
      @notification-click="handleNotificationClick"
      @mark-read="$emit('mark-read', $event)"
      @delete="$emit('delete', $event)"
    />
  </NotificationDrawer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { NotificationDrawer } from '@dailyuse/ui-vue-shadcn';
import NotificationList from './NotificationList.vue';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

interface Props {
  modelValue: boolean;
  notifications: NotificationClientDTO[];
  loading?: boolean;
  unreadCount?: number;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  unreadCount: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'notification-click': [notification: NotificationClientDTO];
  'mark-read': [uuid: string];
  delete: [uuid: string];
  'mark-all-read': [];
}>();

const router = useRouter();

const handleViewAll = () => {
  router.push('/notifications');
};

const handleNotificationClick = (notification: NotificationClientDTO) => {
  emit('notification-click', notification);
  emit('update:modelValue', false);
};
</script>
