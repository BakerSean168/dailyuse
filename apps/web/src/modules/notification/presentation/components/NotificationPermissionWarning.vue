<template>
  <div v-if="showWarning" class="notification-permission-warning">
    <div class="warning-content">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <div class="warning-title">通知权限提示</div>
        <div class="warning-message">{{ statusMessage }}</div>
      </div>
      <div class="warning-actions">
        <button v-if="canRequestPermission" @click="handleRequestPermission" class="btn-primary">
          开启通知
        </button>
        <button @click="dismissWarning" class="btn-secondary">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

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

<style scoped>
.notification-permission-warning {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 500px;
  width: 90%;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fffbf0;
  border: 1px solid #faad14;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.warning-icon {
  flex-shrink: 0;
  font-size: 32px;
  line-height: 1;
}

.warning-text {
  flex: 1;
  min-width: 0;
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: #faad14;
  margin-bottom: 4px;
}

.warning-message {
  font-size: 14px;
  color: #8c8c8c;
  line-height: 1.5;
}

.warning-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #faad14;
  color: white;
}

.btn-primary:hover {
  background: #d48806;
}

.btn-secondary {
  background: transparent;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}
</style>
