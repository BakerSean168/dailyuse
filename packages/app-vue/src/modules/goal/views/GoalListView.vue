<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden" data-testid="goal-list-view">
    <ScrollArea class="min-h-0 flex-1 p-4 @2xl/panel:p-6" data-testid="goal-list-scroll" data-scroll-host="goal-list">
      <div class="mx-auto max-w-7xl">
        <!-- 加载 = 卡片骨架 ×6（§0.3） -->
        <div
          v-if="isLoading"
          class="grid grid-cols-1 gap-4 @2xl/panel:grid-cols-2 @5xl/panel:grid-cols-3"
          data-testid="goal-list-skeleton"
        >
          <div v-for="i in 6" :key="i" class="space-y-3 rounded-lg border border-border/50 p-4">
            <Skeleton class="h-5 w-2/3" />
            <Skeleton class="h-2 w-full" />
            <Skeleton class="h-3 w-1/3" />
          </div>
        </div>

        <div
          v-else-if="filteredGoals.length > 0"
          class="grid grid-cols-1 gap-4 @2xl/panel:grid-cols-2 @5xl/panel:grid-cols-3"
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

        <!-- 分视图空态（§3-7）：进行中 = 行动引导；其余视图空是正常态，纯说明 -->
        <template v-else>
          <AppEmptyState
            v-if="systemView === 'active'"
            :icon="Target"
            :title="t('goal.list.noGoalsFound')"
            :description="t('goal.list.createToStart')"
            :secondary-label="t('goal.list.askAi')"
            testid="goals-empty-state"
            @secondary="router.push('/')"
          />
          <p
            v-else
            class="py-16 text-center text-sm text-muted-foreground"
            data-testid="goals-view-empty"
          >
            {{ t('goal.list.viewEmpty') }}
          </p>
        </template>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Target } from '@lucide/vue';
import { ScrollArea, Skeleton, useConfirm } from '@memoflow/ui-vue-shadcn';
import { GoalCard } from '../components';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO } from '@memoflow/contracts/goal';

const { t } = useI18n();
const router = useRouter();

const { goals, isLoading, selectedFolderId, systemView, deleteGoal } = useGoal();

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
</script>
