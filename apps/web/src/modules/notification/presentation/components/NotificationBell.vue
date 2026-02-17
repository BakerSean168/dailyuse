<template>
  <NotificationBell
    :unread-count="unreadCount"
    :loading="loading"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import { NotificationBell } from '@dailyuse/ui-vue-shadcn';

interface Props {
  unreadCount?: number;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  unreadCount: 0,
  loading: false,
});

defineEmits<{
  click: [];
}>();
</script>
