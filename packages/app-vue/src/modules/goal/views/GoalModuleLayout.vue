<template>
  <div
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
    data-testid="goal-module-layout"
  >
    <GoalPageToolbar
      v-if="isListRoute"
      :system-views="visibleSystemViews"
      :active-system-view="systemView"
      :folders="goalFolders"
      :selected-folder-id="selectedFolderId"
      :focus-mode="currentFocusMode"
      :visible-goal-count="visibleGoalCount"
      :search-query="searchQuery"
      @create-goal="handleToolbarCreateGoal"
      @create-folder="openFolderDialog"
      @select-system-view="selectSystemView"
      @select-folder="selectFolder"
      @open-focus="openFocusDialog"
      @go-focus="goFocus"
      @compare="openComparison"
      @refresh="refreshGoalData"
      @search="handleSearch"
    />

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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { createLogger } from '@memoflow/utils/logger';
import { useGoal } from '../composables/useGoal';
import type {
  GoalClientDTO,
  GoalSystemView,
  ActivateFocusModeRequest,
} from '@memoflow/contracts/goal';
import { GoalDialog, GoalFolderDialog, ActivateFocusModeDialog } from '../components';
import GoalPageToolbar from '../components/GoalPageToolbar.vue';

const { t } = useI18n();
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
  search,
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
const searchQuery = ref('');

const isListRoute = computed(() => route.name === 'goal-list');

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

const visibleGoalCount = computed(() => {
  if (!selectedFolderId.value) return goals.value.length;
  return goals.value.filter((goal) => goal.folderId === selectedFolderId.value).length;
});

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
  defaultGoalFolderId.value = selectedFolderId.value;
  goalDialogOpen.value = true;
}

function handleToolbarCreateGoal() {
  void router.push({
    name: 'goal-list',
    query: { ...route.query, dialog: 'goal' },
  });
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
    openGoalDialog();
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

function openComparison() {
  router.push({ name: 'goal-comparison' });
}

async function refreshGoalData() {
  await Promise.all([fetchGoals(), fetchFolders(), getCurrentFocusMode()]);
}

function handleDatabaseTablesChanged(event: Event) {
  const detail = (event as CustomEvent<{ modules?: string[] }>).detail;
  if (!detail?.modules?.includes('goal')) {
    return;
  }

  void refreshGoalData();
}

function handleSearch(query: string) {
  searchQuery.value = query;
  search(query);
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
  window.addEventListener('db:tables-changed', handleDatabaseTablesChanged);
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

onUnmounted(() => {
  window.removeEventListener('db:tables-changed', handleDatabaseTablesChanged);
});

watch(
  () => [route.name, route.query.dialog, route.query.goalId],
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
