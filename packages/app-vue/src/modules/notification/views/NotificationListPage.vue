<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden" data-testid="notification-center">
    <!-- Phase 4：统一 ModuleHeader 约定（leading=计数，actions=mark-all-read，subnav=all/unread）。 -->
    <ModuleHeader data-testid="notification-page-toolbar">
      <template #leading>
        <p class="min-w-0 truncate text-xs text-muted-foreground" data-testid="notification-count">
          {{ t('notification.filter.all') }} · {{ notifications.length }}
        </p>
        <Badge
          v-if="unreadCount > 0"
          variant="destructive"
          class="shrink-0 text-xs"
          data-testid="notification-unread-badge"
        >
          {{ t('notification.filter.unreadBadge', { count: unreadCount }) }}
        </Badge>
      </template>
      <template #actions>
        <Button
          data-testid="mark-all-read-button"
          variant="outline"
          size="sm"
          class="h-8 shrink-0 px-2 @xl/panel:px-3"
          :aria-label="t('notification.action.markAllRead')"
          :disabled="!hasUnread"
          @click="handleMarkAllRead"
        >
          <CheckCheck class="h-4 w-4 @xl/panel:mr-1.5" />
          <span class="hidden @xl/panel:inline">{{ t('notification.action.markAllRead') }}</span>
        </Button>
      </template>
      <template #subnav>
        <div
          class="flex min-w-0 items-center gap-1"
          role="tablist"
          :aria-label="t('notification.title')"
        >
          <Button
            v-for="tab in filterTabs"
            :key="tab.value"
            :data-testid="`notification-filter-${tab.value}`"
            variant="ghost"
            size="sm"
            role="tab"
            :aria-selected="selectedFilter === tab.value"
            :class="[
              'h-8 px-2 text-muted-foreground hover:text-foreground @xl/panel:px-3',
              selectedFilter === tab.value ? 'bg-secondary font-medium text-foreground' : '',
            ]"
            @click="selectedFilter = tab.value"
          >
            {{ tab.label }}
          </Button>
        </div>
      </template>
    </ModuleHeader>

    <!-- 信箱是读列表：max-w-4xl（§11-3） -->
    <div class="min-h-0 flex-1 overflow-y-auto p-3" data-testid="notification-scroll-host" data-scroll-host="notification">
      <div class="mx-auto max-w-4xl">
        <!-- 加载 = 行骨架（§0.3 禁整页 spinner） -->
        <div v-if="isLoading" class="space-y-3 py-2" data-testid="notification-list-skeleton">
          <div v-for="i in 6" :key="i" class="flex items-start gap-3 px-2 py-2">
            <Skeleton class="mt-1 h-2 w-2 rounded-full" />
            <div class="flex-1 space-y-1.5">
              <Skeleton class="h-4 w-2/3" />
              <Skeleton class="h-3 w-1/3" />
            </div>
          </div>
        </div>

        <!-- 未读 Tab 空 = 已全部处理；全部空 = 空信箱（无按钮，§11-7） -->
        <template v-else-if="filteredNotifications.length === 0">
          <div
            v-if="selectedFilter === 'unread'"
            class="flex flex-col items-center gap-2 py-16 text-center"
            data-testid="notifications-unread-empty"
          >
            <CheckCheck class="h-8 w-8 text-success" />
            <p class="text-sm text-muted-foreground">{{ t('notification.allCaughtUp') }}</p>
          </div>
          <AppEmptyState
            v-else
            :icon="Bell"
            :title="t('notification.empty')"
            :description="t('notification.emptyDescription')"
            testid="notifications-empty-state"
          />
        </template>

        <div v-else data-testid="notifications-list">
          <NotificationList
            :notifications="filteredNotifications"
            :loading="isLoading"
            @mark-read="handleMarkRead"
            @delete="handleDelete"
            @notification-click="handleNotificationClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { Bell, CheckCheck } from '@lucide/vue';
import { Badge, Button, Skeleton } from '@memoflow/ui-vue-shadcn';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import ModuleHeader from '../../../components/shared/ModuleHeader.vue';
import NotificationList from '../components/NotificationList.vue';
import { useNotification } from '../composables/useNotification';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';

const {
  notifications,
  unreadCount,
  hasUnread,
  isLoading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  dismiss,
  refreshStats,
} = useNotification();

const { t } = useI18n();

// 过滤收敛为 全部/未读 两态（§11-5；「已读」不是信箱高频动作）
const selectedFilter = ref('all');

const filterTabs = computed(() => [
  { label: t('notification.filter.all'), value: 'all' },
  { label: t('notification.filter.unread'), value: 'unread' },
]);

const filteredNotifications = computed(() => {
  if (selectedFilter.value === 'unread') return notifications.value.filter((n) => !n.isRead);
  return notifications.value;
});

function handleNotificationClick(notification: NotificationClientDTO) {
  if (!notification.isRead) {
    markAsRead(notification.id);
  }
}

async function handleMarkRead(id: string) {
  await markAsRead(id);
}

async function handleMarkAllRead() {
  await markAllAsRead();
  toast.success(t('notification.toast.allMarkedRead'));
}

async function handleDelete(id: string) {
  await dismiss(id);
  toast.success(t('notification.toast.deleted'));
}

onMounted(async () => {
  await Promise.all([fetchNotifications(), refreshStats()]);
});
</script>
