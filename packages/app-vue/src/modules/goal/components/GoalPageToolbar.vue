<template>
  <header
    class="z-10 flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur-sm @2xl/panel:flex-nowrap @2xl/panel:px-6"
    data-testid="goal-page-toolbar"
  >
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 min-w-0 max-w-52 gap-1.5 px-2 font-medium"
          data-testid="goal-view-selector"
        >
          <LayoutGrid class="h-4 w-4 shrink-0 text-primary" />
          <span class="truncate">{{ currentLabel }}</span>
          <span class="shrink-0 text-xs text-muted-foreground">{{ visibleGoalCount }}</span>
          <ChevronDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-60">
        <DropdownMenuItem
          v-for="view in systemViews"
          :key="view.id"
          :data-testid="`goal-system-view-${view.id}`"
          :class="activeSystemView === view.id && !selectedFolderId ? 'bg-accent' : ''"
          @click="emit('select-system-view', view.id)"
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
            :data-testid="`goal-folder-${folder.id}`"
            :class="selectedFolderId === folder.id ? 'bg-accent' : ''"
            @click="emit('select-folder', folder.id)"
          >
            <span
              class="mr-2 h-2.5 w-2.5 shrink-0 rounded-full border border-border/60"
              :style="{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }"
            />
            <span class="flex-1 truncate">{{ folder.name }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>

    <div
      class="group/search relative ml-auto h-8 w-8 shrink-0 transition-[width] focus-within:w-40 @xl/panel:w-40 @3xl/panel:w-56"
      data-testid="goal-toolbar-search"
    >
      <Search
        class="pointer-events-none absolute left-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        :model-value="searchQuery"
        :aria-label="t('goal.list.searchGoals')"
        :placeholder="t('goal.list.searchGoals')"
        class="h-8 w-full cursor-pointer border-transparent bg-secondary/50 pl-8 pr-2 text-transparent placeholder:text-transparent focus:cursor-text focus:text-foreground focus:placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background @xl/panel:cursor-text @xl/panel:text-foreground @xl/panel:placeholder:text-muted-foreground"
        data-testid="goal-search-input"
        @update:model-value="handleSearch"
      />
    </div>

    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 shrink-0"
      :title="t('common.refresh')"
      :aria-label="t('common.refresh')"
      data-testid="goal-refresh-entry"
      @click="emit('refresh')"
    >
      <RefreshCw class="h-4 w-4" />
    </Button>

    <Button
      variant="ghost"
      size="sm"
      class="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground"
      :class="focusMode ? 'text-primary' : ''"
      :title="t('goal.focusMode.sidebarTitle')"
      :aria-label="t('goal.focusMode.sidebarTitle')"
      data-testid="goal-focus-entry"
      @click="handleFocus"
    >
      <Crosshair class="h-4 w-4" />
      <span class="hidden @3xl/panel:inline">{{ t('goal.focusMode.sidebarTitle') }}</span>
      <span v-if="focusMode" class="text-xs font-medium">
        {{ t('goal.focusMode.remainingDaysShort', { days: remainingDays }) }}
      </span>
    </Button>

    <Button
      size="sm"
      class="h-8 shrink-0 px-2 @xl/panel:px-3"
      :aria-label="t('goal.list.newGoal')"
      data-primary-action="create-goal"
      data-testid="create-goal-entry"
      @click="emit('create-goal')"
    >
      <Plus class="h-4 w-4 @xl/panel:mr-1.5" />
      <span class="hidden @xl/panel:inline">{{ t('goal.list.newGoal') }}</span>
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 shrink-0"
          :aria-label="t('common.more')"
          data-testid="goal-toolbar-more"
        >
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem @click="emit('create-folder')">
          <FolderPlus class="mr-2 h-4 w-4" />
          {{ t('goal.list.newFolder') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('compare')">
          <GitCompare class="mr-2 h-4 w-4" />
          {{ t('goal.list.compare') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ChevronDown,
  Crosshair,
  FolderPlus,
  GitCompare,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from '@lucide/vue';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@dailyuse/ui-vue-shadcn';
import type { FocusModeDTO, GoalFolderClientDTO, GoalSystemView } from '@dailyuse/contracts/goal';

const props = defineProps<{
  systemViews: Array<{ id: GoalSystemView; label: string; count: number }>;
  activeSystemView: GoalSystemView;
  folders: GoalFolderClientDTO[];
  selectedFolderId: string | null;
  focusMode: FocusModeDTO | null;
  visibleGoalCount: number;
  searchQuery: string;
}>();

const emit = defineEmits<{
  'create-goal': [];
  'create-folder': [];
  'select-system-view': [view: GoalSystemView];
  'select-folder': [folderId: string];
  'open-focus': [];
  'go-focus': [];
  compare: [];
  refresh: [];
  search: [query: string];
}>();

const { t } = useI18n();

const currentLabel = computed(() => {
  if (props.selectedFolderId) {
    return (
      props.folders.find((folder) => folder.id === props.selectedFolderId)?.name ??
      t('goal.systemFolders.active')
    );
  }

  return (
    props.systemViews.find((view) => view.id === props.activeSystemView)?.label ??
    t('goal.systemFolders.active')
  );
});

const remainingDays = computed(() => {
  const mode = props.focusMode;
  if (!mode) return 0;
  return Math.max(0, Math.ceil((mode.endTime - Date.now()) / (1000 * 60 * 60 * 24)));
});

function handleSearch(value: string | number) {
  emit('search', String(value));
}

function handleFocus() {
  if (props.focusMode) {
    emit('go-focus');
    return;
  }
  emit('open-focus');
}
</script>
