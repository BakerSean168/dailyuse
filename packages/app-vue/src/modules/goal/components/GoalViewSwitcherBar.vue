<template>
  <div
    class="flex h-12 shrink-0 items-center gap-1 border-b bg-sidebar/60 px-2"
    data-testid="goal-view-switcher-bar"
  >
    <!-- 视图切换下拉：系统视图 + 文件夹（窄档形态的第二侧栏） -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 min-w-0 gap-1.5 px-2 font-medium"
          data-testid="goal-view-switcher-trigger"
        >
          <LayoutGrid class="h-4 w-4 shrink-0 text-primary" />
          <span class="truncate">{{ currentLabel }}</span>
          <span v-if="currentCount !== null" class="text-xs text-muted-foreground">
            {{ currentCount }}
          </span>
          <ChevronDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-56">
        <DropdownMenuItem
          v-for="view in systemViews"
          :key="view.id"
          :data-testid="`goal-system-view-${view.id}`"
          :class="activeSystemView === view.id && !selectedFolderId ? 'bg-accent' : ''"
          @click="$emit('select-system-view', view.id)"
        >
          <LayoutGrid class="mr-2 h-4 w-4" />
          <span class="flex-1 truncate">{{ view.label }}</span>
          <span class="text-xs text-muted-foreground">{{ view.count }}</span>
        </DropdownMenuItem>

        <template v-if="folders.length > 0">
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="folder in folders"
            :key="folder.id"
            :class="selectedFolderId === folder.id ? 'bg-accent' : ''"
            @click="$emit('select-folder', folder.id)"
          >
            <span
              class="mr-2 h-2.5 w-2.5 shrink-0 rounded-full border border-border/60"
              :style="{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }"
            />
            <span class="flex-1 truncate">{{ folder.name }}</span>
          </DropdownMenuItem>
        </template>

        <DropdownMenuSeparator />
        <DropdownMenuItem @click="$emit('create-folder')">
          <FolderPlus class="mr-2 h-4 w-4" />
          {{ t('goal.list.newFolder') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <div class="ml-auto flex items-center gap-1">
      <!-- 专注模式：未激活 = 弱化图标；激活 = 主色点 + 剩余天数 -->
      <Button
        variant="ghost"
        size="sm"
        class="h-8 gap-1.5 px-2"
        :class="focusMode ? 'text-primary' : 'text-muted-foreground'"
        :title="t('goal.focusMode.sidebarTitle')"
        data-testid="goal-focus-entry"
        @click="focusMode ? $emit('go-focus') : $emit('open-focus')"
      >
        <Crosshair class="h-4 w-4" />
        <span v-if="focusMode" class="text-xs font-medium">{{ remainingDays }}d</span>
      </Button>

      <!-- 主操作：新建目标（testid 契约随迁，e2e 快路径两档都可用） -->
      <Button
        size="sm"
        class="h-8"
        data-testid="create-goal-entry"
        @click="$emit('create-goal')"
      >
        <Plus class="mr-1 h-4 w-4" />
        {{ t('goal.list.newGoal') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GoalViewSwitcherBar — 目标模块第二侧栏的窄档形态（UI 重构 V2 §6.1 / §7）
 *
 * split 窄档下 GoalSidebar（w-64）在 320–750px 面板里放不下，收敛为
 * 一行顶栏：视图下拉（系统视图计数 + 文件夹色点）+ 专注入口 + 新建目标。
 * 与 GoalSidebar 同一套 props/emits 子集，由 GoalModuleLayout 按面板档位
 * 二选一渲染；`goal-system-view-*` / `goal-focus-entry` / `create-goal-entry`
 * testid 契约随迁（V2 §8-1）。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown, Crosshair, FolderPlus, LayoutGrid, Plus } from 'lucide-vue-next';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
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

defineEmits<{
  'create-goal': [];
  'create-folder': [];
  'select-system-view': [view: GoalSystemView];
  'select-folder': [folderId: string];
  'open-focus': [];
  'go-focus': [];
}>();

const { t } = useI18n();

const currentLabel = computed(() => {
  if (props.selectedFolderId) {
    return (
      props.folders.find((folder) => folder.id === props.selectedFolderId)?.name ??
      t('nav.goals')
    );
  }
  return (
    props.systemViews.find((view) => view.id === props.activeSystemView)?.label ??
    t('nav.goals')
  );
});

const currentCount = computed<number | null>(() => {
  if (props.selectedFolderId) return null;
  return (
    props.systemViews.find((view) => view.id === props.activeSystemView)?.count ?? null
  );
});

const remainingDays = computed(() => {
  const mode = props.focusMode;
  if (!mode) return 0;
  return Math.max(0, Math.ceil((mode.endTime - Date.now()) / (1000 * 60 * 60 * 24)));
});
</script>
