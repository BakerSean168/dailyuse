<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden" data-testid="goal-list-view">
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-medium text-foreground">{{ activeViewLabel }}</h1>
        <span class="text-xs text-muted-foreground">{{ filteredGoals.length }}</span>
      </div>

      <div class="flex items-center gap-2">
        <!-- 搜索：目标数为 0 时隐藏（§3-5 空集合搜索无意义）；宽档才显示（窄档收在下拉外，靠列表精简） -->
        <div v-if="goals.length > 0" class="relative mr-2 hidden w-64 @3xl/panel:block">
          <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            :placeholder="t('goal.list.searchGoals')"
            class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
            @input="search(searchQuery)"
          />
        </div>

        <!-- 主操作：新建目标（?dialog=goal URL 契约保留，§3-2） -->
        <Button
          size="sm"
          class="h-8"
          data-testid="goal-list-create-button"
          @click="$router.push({ name: 'goal-list', query: { dialog: 'goal' } })"
        >
          <Plus class="mr-1.5 h-4 w-4" />
          {{ t('goal.list.createGoal') }}
        </Button>

        <!-- 次操作：对比收进 ⋯ 菜单（§3-5 低频） -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8" data-testid="goal-list-more">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <DropdownMenuItem @click="router.push({ name: 'goal-comparison' })">
              <LayoutGrid class="mr-2 h-4 w-4" />
              {{ t('goal.list.compare') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <ScrollArea class="min-h-0 flex-1 p-6">
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
          >
            <template #action>
              <Button
                data-testid="create-goal-button"
                size="sm"
                @click="$router.push({ name: 'goal-list', query: { dialog: 'goal' } })"
              >
                <Plus class="mr-1.5 h-4 w-4" />
                {{ t('goal.list.createGoal') }}
              </Button>
            </template>
          </AppEmptyState>
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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LayoutGrid, MoreHorizontal, Plus, Search, Target } from 'lucide-vue-next';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  ScrollArea,
  Skeleton,
  useConfirm,
} from '@dailyuse/ui-vue-shadcn';
import { GoalCard } from '../components';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO, GoalSystemView } from '@dailyuse/contracts/goal';

const { t } = useI18n();
const router = useRouter();

const { goals, isLoading, fetchGoals, search, selectedFolderId, systemView, deleteGoal } =
  useGoal();
const searchQuery = ref('');

const systemViews = computed(() => [
  {
    id: 'active' as GoalSystemView,
    label: t('goal.systemFolders.active'),
  },
  {
    id: 'completed' as GoalSystemView,
    label: t('goal.systemFolders.completed'),
  },
  {
    id: 'expired' as GoalSystemView,
    label: t('goal.systemFolders.expired'),
  },
  {
    id: 'deleted' as GoalSystemView,
    label: t('goal.systemFolders.deleted'),
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
