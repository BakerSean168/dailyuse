<script setup lang="ts">
/**
 * WindowHeader (UI 重构 V2 壳)
 *
 * 桌面式壳的顶栏（h-48px）。三段式：
 * - 左：侧栏折叠按钮 · 返回/前进
 * - 中：模块胶囊 ×5（图标 + 计数角标；点击出预览浮层，浮层内「进入」开面板）
 * - 右：日程"当前时段"胶囊 · [桌面端] 最小化/最大化/关闭
 *
 * 胶囊渲染 + 点击出预览浮层；goal/task/note/reminder/notification 均挂专用 Preview（§10）；
 * 桌面窗控复用既有 useDesktopWindowControls（apps/desktop 已落地 IPC）。
 * 交互逻辑不接业务数据，只 emit 给 AppShell。
 *
 * 契约：胶囊按钮 data-testid = `capsule-nav-{id}`（延续 main-nav-* 生成风格，
 * Playwright 锚定，V2 §8-1）。
 */
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Copy,
  Minus,
  PanelLeft,
  PanelLeftClose,
  Square,
  X,
} from '@lucide/vue';
import { MODULE_CAPSULES_KEY } from '../../di/keys';
import { defaultModuleCapsules } from '../../di/navigation';
import type { ModuleCapsule } from '../../di/types';
import NotificationCapsulePreview from '../../modules/notification/components/NotificationCapsulePreview.vue';
import GoalCapsulePreview from './previews/GoalCapsulePreview.vue';
import TaskCapsulePreview from './previews/TaskCapsulePreview.vue';
import NoteCapsulePreview from './previews/NoteCapsulePreview.vue';
import ReminderCapsulePreview from './previews/ReminderCapsulePreview.vue';

interface WindowControlsState {
  isMaximized: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  isClosable: boolean;
}

const props = defineProps<{
  /** workspace = 业务壳顶栏；settings = 独立设置场景（隐藏胶囊/日程）。 */
  mode?: 'workspace' | 'settings';
  /** 侧栏是否已折叠（控制折叠按钮图标）。 */
  sidebarCollapsed: boolean;
  /** 当前激活的模块 id（胶囊高亮）。 */
  activeModule: string | null;
  /** 未读通知数（notification 胶囊角标）。S1 由 AppShell 注入。 */
  unreadCount?: number;
  /** 其它模块角标（goal/task/note/reminder），由 AppShell 可选注入。 */
  badgeCounts?: Partial<Record<string, number>>;
  /** 日程"当前时段"文案；空则显示空态。S1 由 AppShell 注入。 */
  scheduleLabel?: string | null;
  /** 是否桌面环境（渲染窗控 + 拖拽区）。 */
  isDesktop?: boolean;
  /** macOS：原生交通灯占左上角——左侧留位、不渲染自绘窗控。 */
  isMac?: boolean;
  /** 桌面窗控状态（isDesktop 时由 AppShell 透传）。 */
  windowControls?: WindowControlsState;
}>();

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void;
  (e: 'go-back'): void;
  (e: 'go-forward'): void;
  (e: 'enter-module', id: string): void;
  (e: 'open-schedule'): void;
  (e: 'window-minimize'): void;
  (e: 'window-toggle-maximize'): void;
  (e: 'window-close'): void;
}>();

const { t } = useI18n();

const capsules = computed<ModuleCapsule[]>(
  () => inject(MODULE_CAPSULES_KEY, defaultModuleCapsules) ?? defaultModuleCapsules,
);

/** 当前展开预览浮层的胶囊 id。 */
const previewOpenId = ref<string | null>(null);
const headerRootEl = ref<HTMLElement | null>(null);

function capsuleTestId(id: string): string {
  return `capsule-nav-${id}`;
}

function togglePreview(id: string): void {
  previewOpenId.value = previewOpenId.value === id ? null : id;
}

function enterModule(id: string): void {
  previewOpenId.value = null;
  emit('enter-module', id);
}

function closePreview(): void {
  previewOpenId.value = null;
}

function badgeFor(capsule: ModuleCapsule): number {
  if (capsule.badgeSource === 'notification.unread') return props.unreadCount ?? 0;
  if (capsule.badgeSource && props.badgeCounts && capsule.badgeSource in props.badgeCounts) {
    return props.badgeCounts[capsule.badgeSource] ?? 0;
  }
  // fallback: module id key
  return props.badgeCounts?.[capsule.id] ?? 0;
}

function capsuleAccessibleLabel(capsule: ModuleCapsule): string {
  const name = t(capsule.title);
  const count = badgeFor(capsule);
  return count > 0 ? t('shell.moduleWithCount', { name, count }) : name;
}

function onDocumentPointerDown(event: MouseEvent): void {
  if (!previewOpenId.value) return;
  const target = event.target as Node | null;
  if (target && headerRootEl.value?.contains(target)) return;
  closePreview();
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closePreview();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<template>
  <header
    ref="headerRootEl"
    class="window-header flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 text-xs"
    :class="[isDesktop ? 'window-header--drag' : '', isMac ? 'pl-20' : '']"
  >
    <!-- 左：侧栏折叠 + 前进后退 -->
    <div class="flex shrink-0 items-center gap-2 no-drag">
      <button
        v-if="props.mode !== 'settings'"
        type="button"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :title="sidebarCollapsed ? t('common.expand') : t('common.collapse')"
        :aria-label="sidebarCollapsed ? t('common.expand') : t('common.collapse')"
        @click="emit('toggle-sidebar')"
      >
        <PanelLeftClose v-if="!sidebarCollapsed" class="h-4 w-4" />
        <PanelLeft v-else class="h-4 w-4" />
      </button>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          :title="t('shell.back')"
          :aria-label="t('shell.back')"
          @click="emit('go-back')"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          :title="t('shell.forward')"
          :aria-label="t('shell.forward')"
          @click="emit('go-forward')"
        >
          <ArrowRight class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- 中：模块胶囊 ×5（设置场景隐藏） -->
    <nav
      v-if="props.mode !== 'settings'"
      class="flex items-center gap-1.5 no-drag" :aria-label="t('shell.moduleNav')">
      <div v-for="capsule in capsules" :key="capsule.id" class="relative">
        <button
          type="button"
          :data-testid="capsuleTestId(capsule.id)"
          class="flex items-center gap-1.5 rounded-full border px-2 py-1.5 font-medium transition-all"
          :class="
            activeModule === capsule.id || previewOpenId === capsule.id
              ? 'border-border bg-accent text-foreground shadow-sm'
              : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
          "
          :title="t(capsule.title)"
          :aria-label="capsuleAccessibleLabel(capsule)"
          @click="togglePreview(capsule.id)"
        >
          <component :is="capsule.icon" class="h-3.5 w-3.5" />
          <span
            v-if="badgeFor(capsule) > 0"
            class="rounded-full bg-primary/15 px-1.5 text-[9px] font-bold text-primary"
            :data-testid="`capsule-badge-${capsule.id}`"
          >
            {{ badgeFor(capsule) }}
          </span>
        </button>

        <!-- 预览浮层：各模块 Preview 懒挂载；Escape / 外部点击关闭 -->
        <div
          v-if="previewOpenId === capsule.id"
          class="absolute left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-popover p-3.5 text-popover-foreground shadow-2xl"
          role="dialog"
          :aria-label="t(capsule.title)"
          :data-testid="`capsule-preview-${capsule.id}`"
        >
          <NotificationCapsulePreview
            v-if="capsule.id === 'notification'"
            @view-all="enterModule(capsule.id)"
          />
          <GoalCapsulePreview
            v-else-if="capsule.id === 'goal'"
            @view-all="enterModule(capsule.id)"
            @select="enterModule(capsule.id)"
          />
          <TaskCapsulePreview
            v-else-if="capsule.id === 'task'"
            @view-all="enterModule(capsule.id)"
            @select="enterModule(capsule.id)"
          />
          <NoteCapsulePreview
            v-else-if="capsule.id === 'note'"
            @view-all="enterModule(capsule.id)"
            @select="enterModule(capsule.id)"
          />
          <ReminderCapsulePreview
            v-else-if="capsule.id === 'reminder'"
            @view-all="enterModule(capsule.id)"
            @select="enterModule(capsule.id)"
          />
          <template v-else>
            <p class="mb-2 border-b border-border/40 pb-1 text-xs font-bold">
              {{ t(capsule.title) }}
            </p>
            <p class="py-2 text-[11px] text-muted-foreground">
              {{ t('shell.previewPlaceholder') }}
            </p>
            <button
              type="button"
              class="mt-2 block w-full rounded-lg border border-border/60 bg-accent py-1.5 text-center text-xs font-medium transition-colors hover:bg-accent/80"
              :data-testid="`capsule-preview-enter-${capsule.id}`"
              @click="enterModule(capsule.id)"
            >
              {{ t('shell.enterModule') }}
            </button>
          </template>
        </div>
      </div>
    </nav>

    <!-- 右：日程胶囊 + 桌面窗控 -->
    <div class="flex shrink-0 items-center gap-3 no-drag">
      <button
        v-if="props.mode !== 'settings'"
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        :title="t('shell.openSchedule')"
        :aria-label="t('shell.openSchedule')"
        @click="emit('open-schedule')"
      >
        <Calendar class="h-3 w-3" />
        <span>{{ scheduleLabel || t('shell.schedule.empty') }}</span>
      </button>

      <div v-if="isDesktop && !isMac" class="flex items-center gap-1">
        <button
          type="button"
          class="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :disabled="windowControls && !windowControls.isMinimizable"
          :title="t('shell.window.minimize')"
          :aria-label="t('shell.window.minimize')"
          @click="emit('window-minimize')"
        >
          <Minus class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :disabled="windowControls && !windowControls.isMaximizable"
          :title="t('shell.window.maximize')"
          :aria-label="t('shell.window.maximize')"
          @click="emit('window-toggle-maximize')"
        >
          <Copy v-if="windowControls?.isMaximized" class="h-3 w-3" />
          <Square v-else class="h-3 w-3" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          :disabled="windowControls && !windowControls.isClosable"
          :title="t('shell.window.close')"
          :aria-label="t('shell.window.close')"
          @click="emit('window-close')"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.window-header--drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
</style>
