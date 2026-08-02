<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <header class="flex flex-wrap items-center gap-3 border-b px-4 py-4 @lg/panel:px-6">
      <div class="min-w-0 flex-1">
        <h1 class="text-lg font-semibold">{{ t('goal.focusMode.routeTitle') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('goal.focusMode.routeSubtitle') }}</p>
      </div>

      <div class="ml-auto flex flex-wrap gap-2">
        <Button variant="outline" @click="refresh">{{ t('common.refresh') }}</Button>
        <Button variant="destructive" @click="handleDeactivate" :disabled="!currentFocusMode">
          {{ t('goal.focusMode.routeExit') }}
        </Button>
      </div>
    </header>

    <ScrollArea class="min-h-0 flex-1 p-6">
      <div class="mx-auto max-w-5xl space-y-6">
        <Card v-if="currentFocusMode">
          <CardHeader>
            <CardTitle>{{ t('goal.focusMode.routeCurrentTitle') }}</CardTitle>
            <CardDescription>{{ t('goal.focusMode.routeCurrentDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4 @lg/panel:grid-cols-2 @3xl/panel:grid-cols-4">
            <div>
              <div class="text-xs text-muted-foreground">
                {{ t('goal.focusMode.panel.remainingDays') }}
              </div>
              <div class="text-2xl font-semibold">{{ remainingDays }} d</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">
                {{ t('goal.focusMode.panel.startTime') }}
              </div>
              <div class="text-sm">{{ formatProductDateTime(currentFocusMode.startTime) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">
                {{ t('goal.focusMode.panel.endTime') }}
              </div>
              <div class="text-sm">{{ formatProductDateTime(currentFocusMode.endTime) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">
                {{ t('goal.focusMode.panel.hiddenMode') }}
              </div>
              <div class="text-sm">{{ formatHiddenMode(currentFocusMode.hiddenGoalsMode) }}</div>
            </div>
          </CardContent>
          <CardContent>
            <Progress :model-value="progressValue" class="h-2" />
          </CardContent>
        </Card>

        <Card v-else>
          <CardContent class="py-10 text-center text-sm text-muted-foreground">
            {{ t('goal.focusMode.panel.empty') }}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.focusMode.routeGoalsTitle') }}</CardTitle>
            <CardDescription>{{ t('goal.focusMode.routeGoalsDescription') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              v-if="focusGoalCards.length"
              class="grid gap-4 @2xl/panel:grid-cols-2 @5xl/panel:grid-cols-3"
            >
              <GoalCard
                v-for="goal in focusGoalCards"
                :key="goal.id"
                :goal="goal"
                @view="goToGoal(goal.id)"
                @edit="goToGoal(goal.id)"
                @delete="goToGoal(goal.id)"
              />
            </div>
            <div v-else class="py-8 text-center text-sm text-muted-foreground">
              {{ t('goal.focusMode.routeNoGoals') }}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
/** Soft residual 1237: absolute product dateTime (not dashboard relative). */
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { FocusModeDTO } from '@memoflow/contracts/goal';
import { formatProductDateTime } from '../../../shared/utils/product-time';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  ScrollArea,
} from '@memoflow/ui-vue-shadcn';
import { GoalCard } from '../components';
import { useGoal } from '../composables/useGoal';

const { t } = useI18n();
const router = useRouter();
const { goals, currentFocusMode, fetchGoals, getCurrentFocusMode, deactivateFocusMode } = useGoal();
const focusGoalCards = computed(() => {
  const focusedIds = new Set(currentFocusMode.value?.focusedGoalIds ?? []);
  return goals.value.filter((goal) => focusedIds.has(goal.id));
});

const progressValue = computed(() => {
  const mode = currentFocusMode.value;
  if (!mode) return 0;
  const total = mode.endTime - mode.startTime;
  const elapsed = Date.now() - mode.startTime;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
});

const remainingDays = computed(() => {
  const mode = currentFocusMode.value;
  if (!mode) return 0;
  return Math.max(0, Math.ceil((mode.endTime - Date.now()) / (1000 * 60 * 60 * 24)));
});

function formatHiddenMode(mode: FocusModeDTO['hiddenGoalsMode'] | string): string {
  const labels: Record<string, string> = {
    Hide: t('goal.focusMode.activateDialog.modeHide'),
    Dim: t('goal.focusMode.activateDialog.modeDim'),
    Collapse: t('goal.focusMode.activateDialog.modeFold'),
  };
  return labels[mode] ?? String(mode);
}

function goToGoal(id: string) {
  router.push({ name: 'goal-detail', params: { id } });
}

async function refresh() {
  await Promise.all([getCurrentFocusMode(), fetchGoals()]);
}

async function handleDeactivate() {
  await deactivateFocusMode();
  router.push({ name: 'goal-list' });
}

onMounted(() => {
  void refresh();
});
</script>
