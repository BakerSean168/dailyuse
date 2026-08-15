<template>
  <div class="flex max-h-80 flex-col" data-testid="notification-capsule-preview">
    <div class="mb-2 flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
      <p class="text-xs font-bold">{{ t('notification.drawer.title') }}</p>
      <Button
        v-if="hasUnread"
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-[11px]"
        data-testid="notification-capsule-mark-all-read"
        :disabled="isMarkingAll"
        @click="handleMarkAllRead"
      >
        {{ t('notification.action.markAllRead') }}
      </Button>
    </div>

    <div v-if="isLoading && recentItems.length === 0" class="space-y-2 py-2">
      <div v-for="i in 3" :key="i" class="space-y-1">
        <div class="h-3 w-3/4 rounded bg-muted animate-pulse" />
        <div class="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
      </div>
    </div>

    <div
      v-else-if="recentItems.length === 0"
      class="py-4 text-center text-[11px] text-muted-foreground"
      data-testid="notification-capsule-empty"
    >
      {{ t('notification.empty') }}
    </div>

    <ul
      v-else
      class="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5"
      data-testid="notification-capsule-list"
    >
      <li
        v-for="item in recentItems"
        :key="item.id"
        class="rounded-lg"
        :data-testid="`notification-capsule-item-${item.id}`"
        :data-read-state="item.isRead ? 'read' : 'unread'"
      >
        <button
          type="button"
          class="flex w-full items-start gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="item.title"
          @click="handleItemClick(item)"
        >
          <span
            v-if="!item.isRead"
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1" :class="item.isRead ? 'pl-3' : ''">
            <p
              class="truncate text-[11px] leading-4"
              :class="item.isRead ? 'text-muted-foreground' : 'font-semibold text-foreground'"
            >
              {{ item.title }}
            </p>
            <p class="mt-0.5 line-clamp-2 text-[10px] leading-3.5 text-muted-foreground">
              {{ item.content }}
            </p>
          </div>
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="mt-2 block w-full rounded-lg border border-border/60 bg-accent py-1.5 text-center text-xs font-medium transition-colors hover:bg-accent/80"
      data-testid="notification-capsule-view-all"
      @click="$emit('view-all')"
    >
      {{ t('notification.drawer.viewAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * NotificationCapsulePreview — 通知胶囊预览浮层（UI 重构 V2 §6.5 / §2.2）
 *
 * 承接 V1 铃铛弹层职责：最近 N 条 + 全部已读 + 查看全部（进入完整信箱面板）。
 * 数据走 Query Cache（pilot）：capsule 使用自己的 canonical list key（page 1 + 不同 limit），
 * 不再覆盖共享 list；unread 与 Shell/页面共享同一 key。组件不做 imperative mount refresh，
 * mutation 成功后由 invalidation 收敛。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { Button } from '@memoflow/ui-vue-shadcn';
import { useNotificationListQuery } from '../composables/useNotificationListQuery';
import { useNotificationUnreadQuery } from '../composables/useNotificationUnreadQuery';
import { useNotificationMutations } from '../composables/useNotificationMutations';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';

const RECENT_LIMIT = 5;

defineEmits<{
  'view-all': [];
}>();

const { t } = useI18n();
const { notifications, isLoading } = useNotificationListQuery({
  page: 1,
  limit: RECENT_LIMIT * 2,
});
const { hasUnread } = useNotificationUnreadQuery();
const { markAsRead, markAllAsRead } = useNotificationMutations();

const isMarkingAll = computed(() => markAllAsRead.isPending.value);

const recentItems = computed(() => {
  // 未读优先，其次按创建时间倒序；预览只展示最近 N 条
  const sorted = [...notifications.value].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0);
  });
  return sorted.slice(0, RECENT_LIMIT);
});

async function handleMarkAllRead() {
  if (!hasUnread.value || isMarkingAll.value) return;
  await markAllAsRead.mutateAsync();
  toast.success(t('notification.toast.allMarkedRead'));
}

async function handleItemClick(item: NotificationClientDTO) {
  if (!item.isRead) {
    await markAsRead.mutateAsync(item.id);
  }
}
</script>
