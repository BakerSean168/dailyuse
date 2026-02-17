<template>
  <InAppNotification
    :notifications="visibleNotifications"
    @notification-click="handleNotificationClick"
    @close="closeNotification"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { InAppNotification, type NotificationItemType } from '@dailyuse/ui-vue-shadcn';
import { eventBus } from '@dailyuse/utils';

interface InAppNotificationData {
  notification: {
    uuid: string;
    title: string;
    content?: string;
    type?: string;
    importance?: string;
  };
  timestamp: string;
}

const visibleNotifications = ref<NotificationItemType[]>([]);
const maxNotifications = 5; // 最多同时显示的通知数量

/**
 * 显示应用内通知
 */
function showNotification(data: InAppNotificationData) {
  console.log('[InAppNotification] 显示应用内通知:', data);

  // 转换数据格式
  const notificationItem: NotificationItemType = {
    id: data.notification.uuid,
    title: data.notification.title,
    message: data.notification.content || data.notification.title,
    type: data.notification.type || 'REMINDER',
    priority: data.notification.importance?.toUpperCase() || 'NORMAL',
    duration: 5000, // 5秒后自动关闭
  };

  // 限制同时显示的通知数量
  if (visibleNotifications.value.length >= maxNotifications) {
    visibleNotifications.value.shift(); // 移除最旧的通知
  }

  visibleNotifications.value.push(notificationItem);

  // 自动关闭
  const duration = notificationItem.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notificationItem.id);
    }, duration);
  }
}

/**
 * 关闭通知
 */
function closeNotification(id: string) {
  const index = visibleNotifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    visibleNotifications.value.splice(index, 1);
  }
}

/**
 * 处理通知点击
 */
function handleNotificationClick(notification: NotificationItemType) {
  if (notification.onClick) {
    notification.onClick();
  }
  closeNotification(notification.id);
}

// 监听事件
onMounted(() => {
  console.log('[InAppNotification] 组件已挂载，开始监听应用内通知事件');
  eventBus.on('notification:in-app', showNotification);
});

onUnmounted(() => {
  eventBus.off('notification:in-app', showNotification);
});
</script>
