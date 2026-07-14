<template>
  <div class="h-full" data-testid="notification-center">
    <ListPageShell :title="t('notification.title')" :description="countLabel">
      <template #actions>
        <Badge v-if="unreadCount > 0" variant="destructive" class="text-xs">
          {{ t('notification.filter.unreadBadge', { count: unreadCount }) }}
        </Badge>
        <Button
          data-testid="mark-all-read-button"
          variant="outline"
          size="sm"
          class="h-8"
          :disabled="!hasUnread"
          @click="handleMarkAllRead"
        >
          <CheckCheck class="mr-2 h-4 w-4" />
          {{ t('notification.action.markAllRead') }}
        </Button>
      </template>

      <template #filter>
        <FilterBar>
          <template #tabs>
            <div class="flex items-center gap-1">
              <Button
                v-for="tab in filterTabs"
                :key="tab.value"
                :data-testid="`notification-filter-${tab.value}`"
                variant="ghost"
                size="sm"
                :class="[
                  'h-7 px-3 text-muted-foreground hover:text-foreground',
                  selectedFilter === tab.value ? 'bg-secondary font-medium text-foreground' : '',
                ]"
                @click="selectedFilter = tab.value"
              >
                {{ tab.label }}
              </Button>
            </div>
          </template>
        </FilterBar>
      </template>

      <!-- 信箱是读列表：max-w-4xl（§11-3） -->
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
    </ListPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { Bell, CheckCheck } from '@lucide/vue';
import { Badge, Button, Skeleton } from '@dailyuse/ui-vue-shadcn';
import ListPageShell from '../../../components/shared/ListPageShell.vue';
import FilterBar from '../../../components/shared/FilterBar.vue';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import NotificationList from '../components/NotificationList.vue';
import { useNotification } from '../composables/useNotification';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

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

const countLabel = computed(() =>
  unreadCount.value > 0
    ? t('notification.filter.unreadBadge', { count: unreadCount.value })
    : t('notification.emptyDescription'),
);

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
