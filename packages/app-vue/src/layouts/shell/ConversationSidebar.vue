<script setup lang="ts">
/**
 * ConversationSidebar (UI 重构 V2 壳)
 *
 * 左侧栏 = 纯 AI 会话列表（V2 §5 决策 #4，无 Projects 树、无业务对象）。
 * 结构：品牌 + 搜索 → 「新对话」→ 会话列表（按时间分组）→ 底部头像 + 帮助。
 *
 * S0 骨架：布局 + 交互 emit + 拖宽把手；会话数据由 AppShell 透传（S1 接
 * useAIChatView 的会话列表）。分组"今天/近 7 天/更早"的时区边界属 V2 §11
 * 待细化，S0 只按父组件给的已分组结构渲染。
 */
import { useI18n } from 'vue-i18n';
import { HelpCircle, Search, SquarePen } from 'lucide-vue-next';
import { APP_NAME_ZH } from '@dailyuse/assets';

interface ConversationEntry {
  id: string;
  title: string;
}

interface ConversationGroup {
  /** 分组 i18n key（如 'shell.conversation.today'）。 */
  labelKey: string;
  items: ConversationEntry[];
}

defineProps<{
  groups: ConversationGroup[];
  activeConversationId: string | null;
  userName?: string;
  /** 桌面端顶部留出拖拽/窗控空间的高度补偿（S1 决定，S0 预留 prop）。 */
  isDesktop?: boolean;
}>();

const emit = defineEmits<{
  (e: 'new-conversation'): void;
  (e: 'select-conversation', id: string): void;
  (e: 'open-search'): void;
  (e: 'open-settings'): void;
  (e: 'open-help'): void;
  (e: 'start-resize', event: MouseEvent): void;
}>();

const { t } = useI18n();
</script>

<template>
  <aside
    class="conversation-sidebar relative flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
  >
    <!-- 头：品牌 + 搜索 -->
    <div class="flex h-[50px] shrink-0 items-center justify-between px-4">
      <span class="truncate text-sm font-bold">{{ APP_NAME_ZH }}</span>
      <button
        type="button"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        :title="t('shell.search')"
        @click="emit('open-search')"
      >
        <Search class="h-4 w-4" />
      </button>
    </div>

    <!-- 新对话 -->
    <div class="shrink-0 px-2.5 py-2">
      <button
        type="button"
        data-testid="shell-new-conversation"
        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        @click="emit('new-conversation')"
      >
        <SquarePen class="h-4 w-4" />
        <span>{{ t('shell.newChat') }}</span>
      </button>
    </div>

    <!-- 会话列表（按时间分组） -->
    <nav class="flex-1 overflow-y-auto px-2 pb-4">
      <div v-for="group in groups" :key="group.labelKey" class="mb-3">
        <p
          class="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45"
        >
          {{ t(group.labelKey) }}
        </p>
        <button
          v-for="item in group.items"
          :key="item.id"
          type="button"
          class="flex w-full items-center rounded-md px-3 py-1.5 text-left text-[13px] transition-colors"
          :class="
            activeConversationId === item.id
              ? 'bg-sidebar-accent text-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
          "
          @click="emit('select-conversation', item.id)"
        >
          <span class="truncate">{{ item.title }}</span>
        </button>
      </div>
    </nav>

    <!-- 底：头像 + 帮助 -->
    <div
      class="flex h-[52px] shrink-0 items-center justify-between border-t border-sidebar-border/40 px-3.5"
    >
      <button
        type="button"
        data-testid="shell-open-settings"
        class="flex min-w-0 items-center gap-2.5 rounded p-1 transition-colors hover:bg-sidebar-accent"
        :title="t('nav.settings')"
        @click="emit('open-settings')"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
        >
          {{ (userName || '?').slice(0, 1).toUpperCase() }}
        </span>
        <span class="truncate text-xs font-semibold">{{ userName || t('shell.guest') }}</span>
      </button>
      <button
        type="button"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        :title="t('shell.help')"
        @click="emit('open-help')"
      >
        <HelpCircle class="h-4 w-4" />
      </button>
    </div>

    <!-- 拖宽把手 -->
    <div
      class="absolute right-0 top-0 h-full w-[3px] cursor-col-resize bg-transparent transition-colors hover:bg-primary/40"
      @mousedown="emit('start-resize', $event)"
    />
  </aside>
</template>
