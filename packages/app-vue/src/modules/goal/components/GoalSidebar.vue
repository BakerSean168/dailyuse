<template>
  <aside class="hidden min-h-0 w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
    <div class="flex h-14 items-center border-b p-4">
      <div class="flex items-center gap-2 font-semibold">
        <Target class="h-5 w-5 text-primary" />
        <span>{{ t('nav.goals') }}</span>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="t('goal.list.newGoal')"
          data-testid="create-goal-entry"
          @click="$emit('create-goal')"
        >
          <Plus class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="t('goal.list.newFolder')"
          @click="$emit('create-folder')"
        >
          <FolderPlus class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <ScrollArea class="flex-1">
      <div class="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <!-- 系统视图：计数常显（§3-3 计数即状态总览） -->
        <div class="space-y-1 border-b border-border/60 pb-2">
          <LinearSidebarItem
            v-for="view in systemViews"
            :key="view.id"
            :label="view.label"
            :count="view.count"
            :active="activeSystemView === view.id && !selectedFolderId"
            :data-testid="`goal-system-view-${view.id}`"
            @click="$emit('select-system-view', view.id)"
          >
            <template #icon>
              <LayoutGrid class="h-4 w-4" />
            </template>
          </LinearSidebarItem>
        </div>

        <!-- 文件夹 -->
        <ActionableWrapper
          v-for="folder in folders"
          :key="folder.id"
          :actions="folderActions(folder)"
          :show-more-button="false"
        >
          <LinearSidebarItem
            :label="folder.name"
            :active="selectedFolderId === folder.id"
            @click="$emit('select-folder', folder.id)"
          >
            <template #icon>
              <span
                class="h-2.5 w-2.5 rounded-full border border-border/60"
                :style="{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }"
              />
            </template>
          </LinearSidebarItem>
        </ActionableWrapper>
      </div>
    </ScrollArea>

    <!-- 专注模式：未激活时缩为一行按钮，激活时展开为卡片（§3-5） -->
    <div class="border-t bg-sidebar p-2">
      <button
        v-if="!focusMode"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        data-testid="goal-focus-entry"
        @click="$emit('open-focus')"
      >
        <Crosshair class="h-4 w-4" />
        <span>{{ t('goal.focusMode.sidebarTitle') }}</span>
      </button>
      <div
        v-else
        class="flex cursor-pointer flex-col gap-1 rounded-lg border border-primary bg-primary/5 px-3 py-3 transition-colors hover:bg-muted"
        data-testid="goal-focus-active-card"
        @click="$emit('go-focus')"
      >
        <div class="flex items-center gap-2">
          <Crosshair class="h-4 w-4" />
          <span class="font-medium">{{ t('goal.focusMode.sidebarTitle') }}</span>
        </div>
        <div class="text-xs text-muted-foreground">
          {{ t('goal.focusMode.panel.remainingDays') }}: {{ remainingDays }} d
        </div>
        <div class="text-xs text-muted-foreground">
          {{ formatTime(focusMode.startTime) }} - {{ formatTime(focusMode.endTime) }}
        </div>
        <Progress :model-value="progressValue" class="h-2" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * GoalSidebar — 目标模块第二侧栏（UI_PAGE_REDESIGN_PLAN §3-10 从 GoalModuleLayout 抽出）
 *
 * 系统视图（计数徽章常显）+ 文件夹（色点 + 右键/悬浮菜单）+ 专注模式入口。
 * 专注未激活 = 一行虚线按钮；激活 = 展开卡片（剩余天数 + 进度）。
 * 布局容器不持数据：状态由 layout 传入，动作以事件上抛（dialog 都留在 layout）。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Crosshair, FolderPlus, LayoutGrid, Plus, Target } from '@lucide/vue';
import {
  Button,
  LinearSidebarItem,
  Progress,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type {
  FocusModeDTO,
  GoalFolderClientDTO,
  GoalSystemView,
} from '@dailyuse/contracts/goal';

const props = defineProps<{
  systemViews: Array<{ id: GoalSystemView; label: string; count: number }>;
  activeSystemView: GoalSystemView;
  folders: GoalFolderClientDTO[];
  selectedFolderId: string | null;
  focusMode: FocusModeDTO | null;
}>();

const emit = defineEmits<{
  'create-goal': [];
  'create-folder': [];
  'create-goal-in-folder': [folderId: string];
  'select-system-view': [view: GoalSystemView];
  'select-folder': [folderId: string];
  'open-focus': [];
  'go-focus': [];
}>();

const { t, locale } = useI18n();

const progressValue = computed(() => {
  const mode = props.focusMode;
  if (!mode) return 0;
  const total = mode.endTime - mode.startTime;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - mode.startTime) / total) * 100)));
});

const remainingDays = computed(() => {
  const mode = props.focusMode;
  if (!mode) return 0;
  return Math.max(0, Math.ceil((mode.endTime - Date.now()) / (1000 * 60 * 60 * 24)));
});

function formatTime(value: number): string {
  return new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function folderActions(folder: GoalFolderClientDTO): MenuAction[] {
  return [
    {
      key: 'createGoal',
      label: menuLabel('createGoal'),
      icon: Plus,
      handler: () => emit('create-goal-in-folder', folder.id),
    },
  ];
}
</script>
