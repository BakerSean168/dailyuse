<template>
  <FocusModeStatusBar
    :show="hasActiveFocusMode"
    :status="isExpired ? 'expired' : 'active'"
    :status-text="statusText"
    :detail-text="detailText"
    :remaining-days="remainingDays"
    :loading="isLoading"
    @extend="handleExtend"
    @close="handleDeactivate"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { FocusModeStatusBar } from '@dailyuse/ui-vue-shadcn';
import { useFocusMode } from '../composables/useFocusMode';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusModeStatusBar');

const {
  hasActiveFocusMode,
  activeFocusMode,
  isExpired,
  remainingDays,
  isLoading,
  fetchActiveFocusMode,
  deactivateFocusMode,
  extendFocusMode,
} = useFocusMode();

// ===== Computed Properties =====

const statusText = computed(() => {
  if (isExpired.value) return '专注模式已过期';
  return '专注模式已启用';
});

const detailText = computed(() => {
  if (!activeFocusMode.value) return '';
  
  const goalCount = activeFocusMode.value.focusedGoalUuids.length;
  const endDate = new Date(activeFocusMode.value.endTime).toLocaleDateString('zh-CN');
  
  return `${goalCount} 个目标 · 截止 ${endDate}`;
});

// ===== Lifecycle =====

onMounted(async () => {
  try {
    await fetchActiveFocusMode();
  } catch (err) {
    logger.error('Failed to fetch active focus mode on mount', err);
  }
});

// ===== Event Handlers =====

const handleExtend = () => {
  if (!activeFocusMode.value) return;

  const currentEndTime = activeFocusMode.value.endTime;
  const newEndTime = currentEndTime + 7 * 24 * 60 * 60 * 1000; // +7 days

  extendFocusMode(newEndTime)
    .then(() => {
      logger.info('Focus mode extended successfully');
    })
    .catch((err) => {
      logger.error('Failed to extend focus mode', err);
    });
};

const handleDeactivate = () => {
  if (!activeFocusMode.value) return;

  if (!confirm('确定要关闭专注模式吗？')) {
    return;
  }

  deactivateFocusMode()
    .then(() => {
      logger.info('Focus mode deactivated successfully');
    })
    .catch((err) => {
      logger.error('Failed to deactivate focus mode', err);
    });
};
</script>

