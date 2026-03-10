<template>
  <Card class="w-full">
    <CardHeader class="space-y-2">
      <CardTitle class="flex items-center gap-2 text-base">
        <GitCompare class="h-4 w-4" />
        {{ t('goal.multiGoalSelector.title') }}
        <Badge variant="secondary">{{ selectedGoals.length }}/{{ maxGoals }}</Badge>
      </CardTitle>
      <CardDescription>{{
        t('goal.multiGoalSelector.subtitle', { min: minGoals, max: maxGoals })
      }}</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <div v-if="selectedGoals.length > 0" class="flex flex-wrap gap-2">
        <Badge
          v-for="goal in selectedGoals"
          :key="String(goal.id)"
          variant="outline"
          class="flex items-center gap-1 px-2 py-1"
        >
          <Target class="h-3 w-3" />
          {{ goal.name }}
          <button type="button" class="ml-1 rounded-sm hover:bg-muted" @click="removeGoal(goal.id)">
            <X class="h-3 w-3" />
          </button>
        </Badge>
      </div>

      <Alert v-if="selectedGoals.length < minGoals">
        <Info class="h-4 w-4" />
        <AlertTitle>{{ t('goal.multiGoalSelector.cannotStart') }}</AlertTitle>
        <AlertDescription>{{
          t('goal.multiGoalSelector.needMore', { n: minGoals })
        }}</AlertDescription>
      </Alert>

      <Alert v-else-if="selectedGoals.length >= maxGoals" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>{{ t('goal.multiGoalSelector.reachedMax') }}</AlertTitle>
        <AlertDescription>{{
          t('goal.multiGoalSelector.maxMessage', { n: maxGoals })
        }}</AlertDescription>
      </Alert>

      <div class="space-y-2">
        <Input
          v-model="searchQuery"
          :placeholder="t('goal.multiGoalSelector.searchPlaceholder')"
          :disabled="selectedGoals.length >= maxGoals"
        />

        <div class="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
          <button
            v-for="goal in availableGoals"
            :key="String(goal.id)"
            type="button"
            class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left hover:bg-muted/50"
            :disabled="isGoalSelected(goal.id) || selectedGoals.length >= maxGoals"
            @click="addGoal(goal.id)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ goal.name }}</p>
              <p class="text-xs text-muted-foreground">{{ getStatusText(goal.status) }}</p>
            </div>
            <Badge :class="getStatusBadgeClass(goal.status)">{{
              getStatusText(goal.status)
            }}</Badge>
          </button>

          <p
            v-if="availableGoals.length === 0"
            class="py-4 text-center text-sm text-muted-foreground"
          >
            {{ t('goal.multiGoalSelector.noGoals') }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="toggleFilter('IN_PROGRESS')">{{
          t('goal.multiGoalSelector.statusActive')
        }}</Button>
        <Button variant="outline" size="sm" @click="toggleFilter('COMPLETED')">{{
          t('goal.multiGoalSelector.statusCompleted')
        }}</Button>
        <Button variant="outline" size="sm" @click="toggleFilter('IMPORTANT')">{{
          t('goal.multiGoalSelector.importantGoals')
        }}</Button>
      </div>
    </CardContent>

    <CardFooter class="justify-end gap-2">
      <Button variant="ghost" @click="clearSelection">{{
        t('goal.multiGoalSelector.clearSelection')
      }}</Button>
      <Button :disabled="!canStartComparison" @click="startComparison">
        <Eye class="mr-1 h-4 w-4" />
        {{ t('goal.multiGoalSelector.startComparison') }}
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertCircle, Eye, GitCompare, Info, Target, X } from 'lucide-vue-next';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { Alert, AlertDescription, AlertTitle } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';

const props = withDefaults(
  defineProps<{
    goals?: GoalClientDTO[];
    minGoals?: number;
    maxGoals?: number;
  }>(),
  {
    goals: () => [],
    minGoals: 2,
    maxGoals: 4,
  },
);

const emit = defineEmits<{
  compare: [goals: GoalClientDTO[]];
  'update:selection': [goals: GoalClientDTO[]];
}>();

const selectedGoals = ref<GoalClientDTO[]>([]);
const searchQuery = ref('');
const selectedFilter = ref<'IN_PROGRESS' | 'COMPLETED' | 'IMPORTANT' | null>(null);

const { t } = useI18n();

const availableGoals = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase();

  return (props.goals ?? []).filter((goal) => {
    if (goal.deletedAt) return false;

    if (selectedFilter.value === 'IN_PROGRESS' && goal.status !== 'Active') return false;
    if (selectedFilter.value === 'COMPLETED' && goal.status !== 'Completed') return false;
    if (
      selectedFilter.value === 'IMPORTANT' &&
      goal.importance !== 'Vital' &&
      goal.importance !== 'Important'
    ) {
      return false;
    }

    if (!normalizedQuery) return true;
    return goal.name.toLowerCase().includes(normalizedQuery);
  });
});

const canStartComparison = computed(() => selectedGoals.value.length >= props.minGoals);

const isGoalSelected = (goalId: GoalClientDTO['id']) => {
  return selectedGoals.value.some((goal) => goal.id === goalId);
};

const addGoal = (goalId: GoalClientDTO['id']) => {
  const goal = (props.goals ?? []).find((item) => item.id === goalId);
  if (!goal || isGoalSelected(goalId) || selectedGoals.value.length >= props.maxGoals) return;

  selectedGoals.value = [...selectedGoals.value, goal];
  searchQuery.value = '';
  emit('update:selection', selectedGoals.value);
};

const removeGoal = (goalId: GoalClientDTO['id']) => {
  selectedGoals.value = selectedGoals.value.filter((goal) => goal.id !== goalId);
  emit('update:selection', selectedGoals.value);
};

const clearSelection = () => {
  selectedGoals.value = [];
  emit('update:selection', []);
};

const startComparison = () => {
  if (!canStartComparison.value) return;
  emit('compare', selectedGoals.value);
};

const toggleFilter = (filter: 'IN_PROGRESS' | 'COMPLETED' | 'IMPORTANT') => {
  selectedFilter.value = selectedFilter.value === filter ? null : filter;
};

const getStatusText = (status: GoalClientDTO['status']) => {
  const map: Record<string, string> = {
    Active: t('goal.multiGoalSelector.statusActive'),
    Completed: t('goal.multiGoalSelector.statusCompleted'),
    Archived: t('goal.multiGoalSelector.statusArchived'),
  };
  return map[status] ?? String(status);
};

const getStatusBadgeClass = (status: GoalClientDTO['status']) => {
  if (status === 'Completed') return 'bg-success/15 text-success border-success/40';
  if (status === 'Active') return 'bg-info/15 text-info border-info/40';
  if (status === 'Archived') return 'bg-warning/15 text-warning border-warning/40';
  return 'bg-muted text-muted-foreground';
};

defineExpose({
  selectedGoals,
  clearSelection,
});
</script>
