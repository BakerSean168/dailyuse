<template>
  <div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background" data-testid="goal-module-layout">
    <GoalPageToolbar
      v-if="isListRoute"
      :system-views="views"
      :active-system-view="systemView"
      :visible-goal-count="goals.length"
      :search-query="searchQuery"
      @create-goal="openCreate"
      @select-system-view="setSystemView"
      @refresh="fetchGoals"
      @search="handleSearch"
    />
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <router-view />
      <GoalDialog
        v-model:open="dialogOpen"
        :mode="dialogMode"
        :goal="editingGoal"
        @dirty-change="goalDialogDirty = $event"
        @created="handleSaved"
        @updated="handleSaved"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { GoalClientDTO, GoalSystemView } from '@memoflow/contracts/goal';
import { GoalDialog } from '../components';
import GoalPageToolbar from '../components/GoalPageToolbar.vue';
import { useGoal } from '../composables/useGoal';
import { usePanelSurfaceStatus } from '../../../layouts/shell/usePanelSurfaceStatus';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const {
  goals,
  systemView,
  setSystemView,
  search,
  fetchGoals,
  getGoalAggregateView,
  isSaving,
} = useGoal();

const dialogOpen = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingGoal = ref<GoalClientDTO | null>(null);
const searchQuery = ref('');
const goalDialogDirty = ref(false);
const isListRoute = computed(() => route.name === 'goal-list');
const panelSurfaceStatus = computed<'clean' | 'dirty' | 'busy'>(() => {
  if (isSaving.value) return 'busy';
  return goalDialogDirty.value ? 'dirty' : 'clean';
});
usePanelSurfaceStatus(panelSurfaceStatus);

const views = computed(() => [
  { id: 'active' as GoalSystemView, label: t('goal.systemFolders.active'), count: goals.value.filter((g) => g.status === 'Active' && !g.archivedAt).length },
  { id: 'completed' as GoalSystemView, label: t('goal.systemFolders.completed'), count: goals.value.filter((g) => g.status === 'Completed').length },
  { id: 'abandoned' as GoalSystemView, label: 'Abandoned', count: goals.value.filter((g) => g.status === 'Abandoned').length },
  { id: 'archived' as GoalSystemView, label: 'Archived', count: goals.value.filter((g) => !!g.archivedAt).length },
  { id: 'all' as GoalSystemView, label: 'All', count: goals.value.length },
]);

function openCreate() {
  void router.push({ name: 'goal-list', query: { dialog: 'goal' } });
}

function handleSearch(query: string) {
  searchQuery.value = query;
  search(query);
}

async function syncDialogFromRoute() {
  if (route.name !== 'goal-list' || route.query.dialog !== 'goal') {
    dialogOpen.value = false;
    editingGoal.value = null;
    goalDialogDirty.value = false;
    return;
  }
  const goalId = typeof route.query.goalId === 'string' ? route.query.goalId : null;
  if (!goalId) {
    dialogMode.value = 'create';
    editingGoal.value = null;
    dialogOpen.value = true;
    return;
  }
  dialogMode.value = 'edit';
  const cached = goals.value.find((goal) => String(goal.id) === goalId) ?? null;
  const aggregate = cached ? null : await getGoalAggregateView(goalId);
  editingGoal.value = cached ?? (aggregate ? { ...aggregate.goal, keyResults: aggregate.keyResults, reviews: aggregate.reviews } : null);
  dialogOpen.value = editingGoal.value !== null;
  if (!editingGoal.value) await router.replace({ name: 'goal-list' });
}

async function handleSaved() {
  goalDialogDirty.value = false;
  await fetchGoals();
  await router.replace({ name: 'goal-list' });
}

function handleDatabaseTablesChanged(event: Event) {
  const detail = (event as CustomEvent<{ modules?: string[] }>).detail;
  if (detail?.modules?.includes('goal')) void fetchGoals();
}

watch(() => route.fullPath, () => void syncDialogFromRoute(), { immediate: true });
onMounted(() => {
  window.addEventListener('db:tables-changed', handleDatabaseTablesChanged);
  void fetchGoals();
});
onUnmounted(() => window.removeEventListener('db:tables-changed', handleDatabaseTablesChanged));
</script>
