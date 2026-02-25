<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">通知中心</h1>
        <Separator orientation="vertical" class="h-4" />
        <div class="flex items-center gap-1">
          <Button
            v-for="tab in filterTabs"
            :key="tab.value"
            variant="ghost"
            size="sm"
            :class="[
              'h-7 px-2 text-muted-foreground hover:text-foreground',
              selectedFilter === tab.value ? 'bg-secondary font-medium text-foreground' : '',
            ]"
            @click="selectedFilter = tab.value"
          >
            {{ tab.label }}
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Badge v-if="unreadCount > 0" variant="destructive" class="text-xs">
          {{ unreadCount }} 未读
        </Badge>
        <Button variant="outline" size="sm" class="h-8" :disabled="!hasUnread" @click="handleMarkAllRead">
          <CheckCheck class="mr-2 h-4 w-4" />
          全部已读
        </Button>
      </div>
    </header>

    <!-- Content -->
    <ScrollArea class="flex-1">
      <div class="mx-auto max-w-3xl">
        <div
          v-if="isLoading"
          class="flex h-[50vh] items-center justify-center text-muted-foreground"
        >
          加载中...
        </div>

        <div v-else-if="filteredNotifications.length === 0" class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Bell class="h-6 w-6 opacity-50" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">暂无通知</h3>
          <p class="text-sm">所有通知将在这里显示</p>
        </div>

        <div v-else>
          <NotificationList
            :notifications="filteredNotifications"
            :loading="isLoading"
            @mark-read="handleMarkRead"
            @delete="handleDelete"
            @notification-click="handleNotificationClick"
          />
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { Bell, CheckCheck } from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Separator } from '@dailyuse/ui-vue-shadcn';
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

const selectedFilter = ref('all');

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' },
];

const filteredNotifications = computed(() => {
  if (selectedFilter.value === 'unread') return notifications.value.filter((n) => !n.isRead);
  if (selectedFilter.value === 'read') return notifications.value.filter((n) => n.isRead);
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
  toast.success('已全部标记为已读');
}

async function handleDelete(id: string) {
  await dismiss(id);
  toast.success('通知已删除');
}

onMounted(async () => {
  await Promise.all([fetchNotifications(), refreshStats()]);
});
</script>
