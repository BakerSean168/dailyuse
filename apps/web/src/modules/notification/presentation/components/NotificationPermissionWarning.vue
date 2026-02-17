<template>
  <NotificationPermissionWarning
    :show-warning="showWarning"
    :status-message="statusMessage"
    :can-request-permission="canRequestPermission"
    @request-permission="handleRequestPermission"
    @dismiss="dismissWarning"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NotificationPermissionWarning } from '@dailyuse/ui-vue-shadcn';

// Simplified permission check (no longer relies on application layer service)
const notificationService = {
  async checkPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },
  async getPermissionDescription() {
    const p = Notification.permission;
    if (p === 'granted') return '通知权限已授予';
    if (p === 'denied') return '通知权限已被拒绝';
    return '通知权限未设置';
  },
  async requestPermission() {
    if ('Notification' in window) return Notification.requestPermission();
    return 'denied';
  },
};

const showWarning = ref(false);
const statusMessage = ref('');
const canRequestPermission = ref(false);

/**
 * 检查权限状态
 */
async function checkPermissionStatus() {
  const status = await notificationService.checkPermissionStatus();
  const description = await notificationService.getPermissionDescription();

  console.log('[NotificationPermissionWarning] 权限状态:', status);
  console.log('[NotificationPermissionWarning] 状态描述:', description);

  statusMessage.value = description;

  // 如果通知不可用，显示警告
  if (!status.supported || status.denied || !status.systemAvailable) {
    showWarning.value = true;
    canRequestPermission.value = status.permission === 'default';
  } else {
    showWarning.value = false;
  }
}

/**
 * 请求权限
 */
async function handleRequestPermission() {
  const result = await notificationService.requestPermission();
  console.log('[NotificationPermissionWarning] 权限请求结果:', result);

  // 重新检查状态
  await checkPermissionStatus();
}

/**
 * 关闭警告
 */
function dismissWarning() {
  showWarning.value = false;

  // 存储到 localStorage，避免重复提示
  localStorage.setItem('notification-permission-warning-dismissed', 'true');
}

onMounted(async () => {
  // 检查是否已经关闭过警告
  const dismissed = localStorage.getItem('notification-permission-warning-dismissed');
  if (dismissed === 'true') {
    return;
  }

  // 延迟检查，避免影响页面加载
  setTimeout(async () => {
    await checkPermissionStatus();
  }, 2000);
});
</script>
