<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <header class="flex items-center gap-3 border-b px-6 py-4">
      <div>
        <h1 class="text-lg font-semibold">{{ t('goal.route.focusMode') }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t('goal.focusMode.page.subtitle') }}
        </p>
      </div>
      <div class="ml-auto flex gap-2">
        <Button variant="outline" @click="refresh">{{ t('common.refresh') }}</Button>
        <Button @click="openActivate = true">{{ t('goal.focusMode.page.activate') }}</Button>
      </div>
    </header>

    <ScrollArea class="min-h-0 flex-1 p-6">
      <div class="mx-auto max-w-4xl space-y-6">
        <Card v-if="currentFocusMode">
          <CardHeader>
            <CardTitle>{{ t('goal.focusMode.page.currentTitle') }}</CardTitle>
            <CardDescription>
              {{ t('goal.focusMode.page.currentDescription') }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-2 text-sm">
            <div>
              {{
                t('goal.focusMode.page.goalCount', { n: currentFocusMode.focusedGoalIds.length })
              }}
            </div>
            <div>
              {{ t('goal.focusMode.page.startTime') }}: {{ formatTime(currentFocusMode.startTime) }}
            </div>
            <div>
              {{ t('goal.focusMode.page.endTime') }}: {{ formatTime(currentFocusMode.endTime) }}
            </div>
            <div>
              {{ t('goal.focusMode.page.hiddenMode') }}:
              {{ formatHiddenMode(currentFocusMode.hiddenGoalsMode) }}
            </div>
          </CardContent>
        </Card>

        <Card v-else>
          <CardContent class="py-10 text-center text-sm text-muted-foreground">
            {{ t('goal.focusMode.page.empty') }}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>

    <Dialog v-model:open="openActivate">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t('goal.focusMode.activateDialog.title') }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-3">
          <Label>{{ t('goal.focusMode.activateDialog.selectGoal') }}</Label>
          <div class="grid gap-2">
            <label
              v-for="goal in activeGoals"
              :key="goal.id"
              class="flex items-center gap-2 rounded border px-3 py-2"
            >
              <input
                v-model="selectedGoalIds"
                type="checkbox"
                :value="goal.id"
                :disabled="selectedGoalIds.length >= 3 && !selectedGoalIds.includes(goal.id)"
              />
              <span>{{ goal.name }}</span>
            </label>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('goal.focusMode.activateDialog.selectGoalHint') }}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="openActivate = false">{{ t('common.cancel') }}</Button>
          <Button
            :disabled="selectedGoalIds.length === 0 || selectedGoalIds.length > 3 || busy"
            @click="activate"
          >
            {{ t('goal.focusMode.activateDialog.activate') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createLogger } from '@dailyuse/utils';
import { useGoal } from '../composables/useGoal';
import type { FocusModeDTO } from '@dailyuse/contracts/goal';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';

const { t, locale } = useI18n();
const goal = useGoal();
const logger = createLogger('goal:focus-mode-legacy');
const stringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const openActivate = ref(false);
const busy = ref(false);
const selectedGoalIds = ref<string[]>([]);

const activeGoals = computed(() =>
  goal.goals.value.filter((item) => !item.archivedAt && !item.deletedAt && !!item.targetDate),
);
const currentFocusMode = ref<FocusModeDTO | null>(null);

const refresh = async () => {
  logger.info(
    `刷新开始 ${stringify({
      currentFocusMode: currentFocusMode.value,
    })}`,
  );
  await Promise.all([goal.fetchGoals(), goal.fetchFolders()]);
  const result = await goal.getCurrentFocusMode();
  logger.info(
    `刷新结果 ${stringify({
      ok: result.ok,
      data: result.ok ? result.data : result.error,
    })}`,
  );
  if (result.ok) {
    currentFocusMode.value = result.data ?? null;
  }
};

const formatTime = (value: number) =>
  new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatHiddenMode = (mode: FocusModeDTO['hiddenGoalsMode']) => {
  const labels: Record<FocusModeDTO['hiddenGoalsMode'], string> = {
    Hide: t('goal.focusMode.activateDialog.modeHide'),
    Dim: t('goal.focusMode.activateDialog.modeDim'),
    Collapse: t('goal.focusMode.activateDialog.modeFold'),
  };

  return labels[mode] ?? mode;
};

const activate = async () => {
  logger.info(
    `启用专注模式开始 ${stringify({
      selectedGoalIds: selectedGoalIds.value,
    })}`,
  );
  busy.value = true;
  try {
    const result = await goal.activateFocusMode({ focusedGoalIds: selectedGoalIds.value });
    logger.info(
      `启用专注模式结果 ${stringify({
        ok: result.ok,
        data: result.ok ? result.data : result.error,
      })}`,
    );
    if (result.ok) {
      currentFocusMode.value = result.data ?? null;
    }
    openActivate.value = false;
    selectedGoalIds.value = [];
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  logger.info(
    `页面挂载 ${stringify({
      currentFocusMode: currentFocusMode.value,
    })}`,
  );
  void refresh();
});
</script>
