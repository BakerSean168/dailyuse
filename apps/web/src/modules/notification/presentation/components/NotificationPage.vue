<template>
  <NotificationPage>
    <NotificationList
      :notifications="notifications"
      :loading="loading"
    />
  </NotificationPage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { NotificationPage } from '@dailyuse/ui-vue-shadcn';
import NotificationList from './NotificationList.vue';
import { useNotification } from '../composables/useNotification';

const { notifications, loading, loadNotifications } = useNotification();

onMounted(() => {
  loadNotifications();
});
</script>
