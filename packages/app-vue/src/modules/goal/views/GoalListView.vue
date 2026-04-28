<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden" data-testid="goal-list-view">
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">{{ activeViewLabel }}</h1>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative mr-2 hidden w-64 lg:block">
          <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            :placeholder="t('goal.list.searchGoals')"
            class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
            @input="search(searchQuery)"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-2"
          @click="router.push({ name: 'goal-comparison' })"
        >
          <LayoutGrid class="h-4 w-4" />
          <span>{{ t('goal.list.compare') }}</span>
        </Button>
      </div>
    </header>

    <ScrollArea class="min-h-0 flex-1 p-6">
      <div class="mx-auto max-w-7xl">
        <div
          v-if="isLoading"
          class="flex h-[50vh] items-center justify-center text-muted-foreground"
        >
          {{ t('goal.list.loading') }}
        </div>

        <div
          v-else-if="filteredGoals.length > 0"
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          data-testid="goal-list"
        >
          <GoalCard
            v-for="goal in filteredGoals"
            :key="goal.id"
            :goal="goal"
            @view="handleViewGoal(goal)"
            @edit="handleEditGoal(goal)"
            @delete="handleDeleteGoal(goal.id)"
          />
        </div>

        <div
          v-else
          class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Target class="h-6 w-6 opacity-50" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">
            {{ t('goal.list.noGoalsFound') }}
          </h3>
          <p class="mb-6 text-sm">{{ t('goal.list.createToStart') }}</p>
          <Button
            data-testid="create-goal-button"
            @click="$router.push({ name: 'goal-list', query: { dialog: 'goal' } })"
          >
            <Plus class="mr-2 h-4 w-4" />
            {{ t('goal.list.createGoal') }}
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Target, Plus, LayoutGrid, Search } from 'lucide-vue-next';
import { Button, ScrollArea, Input, useConfirm } from '@dailyuse/ui-vue-shadcn';
import { GoalCard } from '../components';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO, GoalSystemView } from '@dailyuse/contracts/goal';

const { t } = useI18n();
const router = useRouter();

const {
  goals,
  isLoading,
  fetchGoals,
  search,
  selectedFolderId,
  systemView,
  setSelectedFolderId,
  setSystemView,
  deleteGoal,
} = useGoal();
const searchQuery = ref('');

const systemViews = computed(() => [
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

const activeViewLabel = computed(
  () =>
    systemViews.value.find((view) => view.id === systemView.value)?.label ??
    t('goal.systemFolders.active'),
);

const filteredGoals = computed(() => {
  let result = goals.value;
  if (selectedFolderId.value) result = result.filter((g) => g.folderId === selectedFolderId.value);
  return result;
});

function handleViewGoal(goal: GoalClientDTO) {
  router.push({ name: 'goal-detail', params: { id: goal.id } });
}

function handleEditGoal(goal: GoalClientDTO) {
  router.push({ name: 'goal-list', query: { dialog: 'goal', goalId: goal.id } });
}

async function handleDeleteGoal(id: string) {
  const confirmed = await useConfirm({
    title: t('goal.list.confirmDeleteTitle'),
    description: t('goal.list.confirmDelete'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) {
    return;
  }

  await deleteGoal(id);
}

onMounted(async () => {
  await fetchGoals();
});
</script>
