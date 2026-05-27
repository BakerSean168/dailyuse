<template>
  <div class="flex h-full min-h-0 w-full overflow-hidden bg-background">
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
            @click="openGoalDialog"
          >
            <Plus class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('goal.list.newFolder')"
            @click="openFolderDialog"
          >
            <FolderPlus class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea class="flex-1">
        <div class="flex flex-1 min-h-0 flex-col gap-2 p-2">
          <div class="space-y-1 pb-2 border-b border-border/60">
            <div
              v-for="view in visibleSystemViews"
              :key="view.id"
              class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                systemView === view.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              "
              @click="selectSystemView(view.id)"
            >
              <LayoutGrid class="h-4 w-4" />
              <span>{{ view.label }}</span>
              <Badge v-if="systemView === view.id" variant="secondary" class="ml-auto text-xs">{{
                view.count
              }}</Badge>
            </div>
          </div>

          <ActionableWrapper
            v-for="folder in goalFolders"
            :key="folder.id"
            :actions="getFolderActions(folder)"
            :show-more-button="false"
          >
            <div
              class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                selectedFolderId === folder.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              "
              @click="selectFolder(folder.id)"
            >
              <span
                class="h-2.5 w-2.5 rounded-full border border-border/60"
                :style="{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }"
              />
              <Folder class="h-4 w-4" :style="{ color: folder.color || undefined }" />
              <span class="truncate">{{ folder.name }}</span>
            </div>
          </ActionableWrapper>
        </div>
      </ScrollArea>

      <div class="border-t bg-sidebar p-2">
        <div
          class="flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-3 transition-colors hover:bg-muted"
          :class="currentFocusMode ? 'border-primary bg-primary/5' : 'border-dashed'"
          @click="currentFocusMode ? goFocus() : openFocusDialog()"
        >
          <div class="flex items-center gap-2">
            <Target class="h-4 w-4" />
            <span class="font-medium">{{ t('goal.focusMode.sidebarTitle') }}</span>
          </div>
          <template v-if="currentFocusMode">
            <div class="text-xs text-muted-foreground">
              {{ t('goal.focusMode.panel.remainingDays') }}: {{ remainingDays }} d
            </div>
            <div class="text-xs text-muted-foreground">
              {{ formatTime(currentFocusMode.startTime) }} -
              {{ formatTime(currentFocusMode.endTime) }}
            </div>
            <Progress :model-value="progressValue" class="h-2" />
          </template>
          <div v-else class="text-xs text-muted-foreground">
            {{ t('goal.focusMode.sidebarEmpty') }}
          </div>
        </div>
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <router-view />

      <GoalDialog
        v-model:open="goalDialogOpen"
        :mode="goalDialogMode"
        :goal="editingGoal"
        :default-folder-id="defaultGoalFolderId"
        @created="handleGoalCreated"
        @updated="handleGoalUpdated"
      />

      <GoalFolderDialog ref="folderDialogRef" @save="handleFolderSaved" />

      <ActivateFocusModeDialog
        v-model="focusDialogOpen"
        :goals="activeGoals"
        :on-activate="handleActivateFocusMode"
        @activated="handleFocusModeActivated"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Target, Plus, FolderPlus, LayoutGrid, Folder } from 'lucide-vue-next';
import { createLogger } from '@dailyuse/utils/logger';
import { Badge, Button, Progress, ScrollArea } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import { useGoal } from '../composables/useGoal';
import type {
  GoalClientDTO,
  GoalFolderClientDTO,
  GoalSystemView,
  ActivateFocusModeRequest,
} from '@dailyuse/contracts/goal';
import { GoalDialog, GoalFolderDialog, ActivateFocusModeDialog } from '../components';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const logger = createLogger('goal:layout');
const stringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
const {
  goalFolders,
  goals,
  currentFocusMode,
  selectedFolderId,
  systemView,
  setSelectedFolderId,
  setSystemView,
  fetchGoals,
  fetchGoal,
  fetchFolders,
  getCurrentFocusMode,
  activateFocusMode,
} = useGoal();

const goalDialogOpen = ref(false);
const goalDialogMode = ref<'create' | 'edit'>('create');
const editingGoal = ref<GoalClientDTO | null>(null);
const defaultGoalFolderId = ref<string | null>(null);
const folderDialogRef = ref<InstanceType<typeof GoalFolderDialog> | null>(null);
const focusDialogOpen = ref(false);

const visibleSystemViews = computed(() => [
  {
    id: 'active' as GoalSystemView,
    label: t('goal.systemFolders.active'),
    count: goals.value.length,
  },
  {
    id: 'completed' as GoalSystemView,
    label: t('goal.systemFolders.completed'),
    count: goals.value.filter((g) => !!g.archivedAt && !!g.completedAt && !g.deletedAt).length,
  },
  {
    id: 'expired' as GoalSystemView,
    label: t('goal.systemFolders.expired'),
    count: goals.value.filter((g) => !!g.archivedAt && !g.completedAt && !g.deletedAt).length,
  },
  {
    id: 'deleted' as GoalSystemView,
    label: t('goal.systemFolders.deleted'),
    count: goals.value.filter((g) => !!g.deletedAt).length,
  },
]);

const activeGoals = computed(() =>
  goals.value.filter((goal) => !goal.archivedAt && !goal.deletedAt && !!goal.targetDate),
);

const progressValue = computed(() => {
  const mode = currentFocusMode.value;
  if (!mode) return 0;
  const total = mode.endTime - mode.startTime;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - mode.startTime) / total) * 100)));
});

const remainingDays = computed(() => {
  const mode = currentFocusMode.value;
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

function selectSystemView(view: GoalSystemView) {
  setSelectedFolderId(null);
  setSystemView(view);
}

function selectFolder(folderId: string) {
  setSelectedFolderId(folderId);
  setSystemView('active');
}

function openGoalDialog() {
  goalDialogMode.value = 'create';
  editingGoal.value = null;
  defaultGoalFolderId.value = null;
  goalDialogOpen.value = true;
}

async function clearGoalDialogQuery() {
  if (route.name !== 'goal-list') {
    return;
  }

  const nextQuery = { ...route.query };
  delete nextQuery.dialog;
  delete nextQuery.goalId;

  await router.replace({
    name: 'goal-list',
    query: nextQuery,
  });
}

async function syncGoalDialogFromRoute() {
  if (route.name !== 'goal-list') {
    goalDialogOpen.value = false;
    editingGoal.value = null;
    defaultGoalFolderId.value = null;
    return;
  }

  const dialog = typeof route.query.dialog === 'string' ? route.query.dialog : null;
  const goalId = typeof route.query.goalId === 'string' ? route.query.goalId : null;

  if (dialog !== 'goal') {
    goalDialogOpen.value = false;
    editingGoal.value = null;
    defaultGoalFolderId.value = null;
    return;
  }

  if (!goalId) {
    goalDialogMode.value = 'create';
    editingGoal.value = null;
    defaultGoalFolderId.value = null;
    goalDialogOpen.value = true;
    return;
  }

  goalDialogMode.value = 'edit';
  defaultGoalFolderId.value = null;

  const cachedGoal = goals.value.find((goal) => goal.id === goalId) ?? null;
  if (cachedGoal) {
    editingGoal.value = cachedGoal;
    goalDialogOpen.value = true;
    return;
  }

  const fetchedGoal = await fetchGoal(goalId);
  if (!fetchedGoal) {
    await clearGoalDialogQuery();
    return;
  }

  editingGoal.value = fetchedGoal;
  goalDialogOpen.value = true;
}

function openFolderDialog() {
  folderDialogRef.value?.openForCreate();
}

function openFocusDialog() {
  if (currentFocusMode.value) {
    router.push({ name: 'goal-focus' });
    return;
  }
  focusDialogOpen.value = true;
}

function goFocus() {
  router.push({ name: 'goal-focus' });
}

function getFolderActions(folder: GoalFolderClientDTO): MenuAction[] {
  return [
    {
      key: 'createGoal',
      label: menuLabel('createGoal'),
      icon: Plus,
      handler: () => {
        defaultGoalFolderId.value = folder.id;
        openGoalDialog();
      },
    },
  ];
}

function handleGoalCreated() {
  goalDialogOpen.value = false;
  defaultGoalFolderId.value = null;
  fetchGoals();
}

function handleGoalUpdated() {
  goalDialogOpen.value = false;
  defaultGoalFolderId.value = null;
  fetchGoals();
}

function handleFolderSaved() {
  fetchFolders();
}

async function handleActivateFocusMode(request: ActivateFocusModeRequest) {
  logger.info(`处理启用专注模式开始 ${stringify(request)}`);
  const result = await activateFocusMode(request);
  logger.info(
    `处理启用专注模式结果 ${stringify({
      ok: result.ok,
      data: result.ok ? result.data : result,
    })}`,
  );
  if (result.ok) {
    focusDialogOpen.value = false;
    await getCurrentFocusMode();
    logger.info(
      `启用后刷新结果 ${stringify({
        currentFocusMode: currentFocusMode.value,
      })}`,
    );
    router.push({ name: 'goal-focus' });
    return result.data;
  }

  throw new Error('Failed to activate focus mode');
}

function handleFocusModeActivated() {
  logger.info('专注模式已激活');
  focusDialogOpen.value = false;
  void getCurrentFocusMode();
  router.push({ name: 'goal-focus' });
}

onMounted(async () => {
  logger.info(
    `页面挂载 ${stringify({
      systemView: systemView.value,
      selectedFolderId: selectedFolderId.value,
      currentFocusMode: currentFocusMode.value,
    })}`,
  );
  await Promise.all([fetchGoals(), fetchFolders(), getCurrentFocusMode()]);
  logger.info(
    `初始加载完成 ${stringify({
      currentFocusMode: currentFocusMode.value,
      goals: goals.value.length,
      folders: goalFolders.value.length,
    })}`,
  );
});

watch(
  () => [route.name, route.query.dialog, route.query.goalId, goals.value.length],
  () => {
    void syncGoalDialogFromRoute();
  },
  { immediate: true },
);

watch(goalDialogOpen, (open) => {
  if (!open && route.name === 'goal-list' && route.query.dialog === 'goal') {
    void clearGoalDialogQuery();
  }
});
</script>
