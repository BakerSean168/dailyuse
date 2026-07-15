<template>
  <div
    class="flex h-full min-h-0 w-full overflow-hidden bg-background"
    :class="isNarrow ? 'flex-col' : 'flex-row'"
  >
    <!-- 宽档（focus）：第二侧栏；窄档（split）：收敛为顶部下拉栏（V2 §6.1/§7） -->
    <GoalViewSwitcherBar
      v-if="isNarrow"
      :system-views="visibleSystemViews"
      :active-system-view="systemView"
      :folders="goalFolders"
      :selected-folder-id="selectedFolderId"
      :focus-mode="currentFocusMode"
      @create-goal="openGoalDialog"
      @create-folder="openFolderDialog"
      @select-system-view="selectSystemView"
      @select-folder="selectFolder"
      @open-focus="openFocusDialog"
      @go-focus="goFocus"
    />
    <GoalSidebar
      v-else
      :system-views="visibleSystemViews"
      :active-system-view="systemView"
      :folders="goalFolders"
      :selected-folder-id="selectedFolderId"
      :focus-mode="currentFocusMode"
      @create-goal="openGoalDialog"
      @create-folder="openFolderDialog"
      @create-goal-in-folder="openGoalDialogInFolder"
      @select-system-view="selectSystemView"
      @select-folder="selectFolder"
      @open-focus="openFocusDialog"
      @go-focus="goFocus"
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { createLogger } from '@dailyuse/utils/logger';
import { useGoal } from '../composables/useGoal';
import { usePanelWidth } from '../../../layouts/shell/usePanelWidth';
import type {
  GoalClientDTO,
  GoalSystemView,
  ActivateFocusModeRequest,
} from '@dailyuse/contracts/goal';
import { GoalDialog, GoalFolderDialog, ActivateFocusModeDialog } from '../components';
import GoalSidebar from '../components/GoalSidebar.vue';
import GoalViewSwitcherBar from '../components/GoalViewSwitcherBar.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const logger = createLogger('goal:layout');
// 面板两档（V2 §7）：窄档收侧栏为顶部下拉，宽档恢复完整侧栏。
const { isNarrow } = usePanelWidth();
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

function openGoalDialogInFolder(folderId: string) {
  goalDialogMode.value = 'create';
  editingGoal.value = null;
  defaultGoalFolderId.value = folderId;
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
