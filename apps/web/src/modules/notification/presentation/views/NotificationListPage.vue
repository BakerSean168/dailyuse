<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">通知中心</h2>
        <Badge v-if="hasUnread" variant="destructive">{{ unreadCount }} 未读</Badge>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="!hasUnread" @click="handleMarkAllRead">
          <CheckCheck class="mr-1 h-4 w-4" /> 全部已读
        </Button>
        <Button variant="outline" size="sm" @click="handleDismissAll">
          <Trash2 class="mr-1 h-4 w-4" /> 清空
        </Button>
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">加载中...</div>
    </div>

    <ScrollArea v-else class="flex-1">
      <div v-if="notifications.length === 0" class="flex flex-1 items-center justify-center py-16">
        <div class="text-center space-y-2">
          <Bell class="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p class="text-muted-foreground">暂无通知</p>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="flex items-start gap-3 rounded-lg border p-4 transition-colors"
          :class="n.isRead ? 'bg-background' : 'bg-muted/30 border-primary/20'"
        >
          <div
            class="mt-1 h-2 w-2 shrink-0 rounded-full"
            :class="n.isRead ? 'bg-transparent' : 'bg-primary'"
          />
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium">{{ n.title }}</p>
              <span class="text-xs text-muted-foreground">{{ formatDate(n.createdAt) }}</span>
            </div>
            <p v-if="n.body" class="text-sm text-muted-foreground">{{ n.body }}</p>
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="text-xs">{{ n.type }}</Badge>
              <Badge v-if="n.priority" variant="secondary" class="text-xs">{{ n.priority }}</Badge>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-if="!n.isRead"
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              @click="handleMarkRead(n.id)"
            >
              <Check class="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7 text-muted-foreground hover:text-destructive"
              @click="handleDismiss(n.id)"
            >
              <X class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.pageSize" class="mt-4 flex justify-center">
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1"
            @click="setPage(pagination.page - 1)"
          >
            上一页
          </Button>
          <span class="text-sm text-muted-foreground">
            第 {{ pagination.page }} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page * pagination.pageSize >= pagination.total"
            @click="setPage(pagination.page + 1)"
          >
            下一页
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-vue-next';
import { Button, Badge, ScrollArea } from '@dailyuse/ui-vue-shadcn';
import { useNotification } from '../composables/useNotification';

const {
  notifications, unreadCount, hasUnread, isLoading, pagination,
  fetchNotifications, markAsRead, markAllAsRead, dismiss, dismissAll, setPage,
} = useNotification();

function formatDate(d: string | number | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function handleMarkRead(id: string) {
  await markAsRead(id);
}

async function handleMarkAllRead() {
  await markAllAsRead();
  toast.success('全部标记为已读');
}

async function handleDismiss(id: string) {
  await dismiss(id);
}

async function handleDismissAll() {
  if (!window.confirm('确认清空所有通知？')) return;
  await dismissAll();
  toast.success('通知已清空');
}

onMounted(() => {
  fetchNotifications();
});
</script>
