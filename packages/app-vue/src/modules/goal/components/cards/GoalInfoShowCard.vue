<template>
  <Card
    class="group cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
    @click="handleOpenGoal"
  >
    <CardHeader class="pb-3">
      <CardTitle class="flex items-start justify-between gap-3 text-base">
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold">{{ goal.name }}</p>
          <div class="mt-2 flex items-center gap-2">
            <Badge variant="outline">{{ statusText }}</Badge>
            <Badge v-if="todayProgress > 0" class="bg-success/15 text-success hover:bg-success/15">
              +{{ Math.round(todayProgress) }}%
            </Badge>
          </div>
        </div>
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-3 pt-0">
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>{{ t('goal.cards.infoShow.completion') }}</span>
          <span class="font-medium text-foreground">{{ overallProgress }}%</span>
        </div>
        <Progress :model-value="overallProgress" />
      </div>

      <div class="space-y-2 rounded-md border bg-muted/20 p-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-muted-foreground">{{
            t('goal.cards.infoShow.keyResults')
          }}</span>
          <Badge variant="secondary">{{ keyResults.length }}</Badge>
        </div>

        <div class="grid gap-2 md:grid-cols-2">
          <KeyResultCard
            v-for="keyResult in keyResults"
            :key="String(keyResult.id)"
            :key-result="keyResult"
            :goal="goal"
            @navigate="(item) => emit('open-key-result', item)"
            @add-record="(item) => emit('add-key-result-record', item)"
            @delete="(item) => emit('delete-key-result', item)"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import KeyResultCard from './KeyResultCard.vue';
import { getGoalOverallProgress } from '../../utils/progress';

const props = defineProps<{
  goal: GoalClientDTO;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  'open-goal': [goal: GoalClientDTO];
  'open-key-result': [keyResult: KeyResultClientDTO];
  'add-key-result-record': [keyResult: KeyResultClientDTO];
  'delete-key-result': [keyResult: KeyResultClientDTO];
}>();

const keyResults = computed(() => props.goal.keyResults ?? []);

const overallProgress = computed(() => {
  return getGoalOverallProgress(props.goal);
});

const todayProgress = computed(() => 0);

const statusText = computed(() => {
  const map: Record<string, string> = {
    Active: t('goal.cards.goalStatus.active'),
    Completed: t('goal.cards.goalStatus.completed'),
    Archived: t('goal.cards.goalStatus.archived'),
  };
  return map[props.goal.status] ?? String(props.goal.status);
});

const handleOpenGoal = () => {
  emit('open-goal', props.goal);
};
</script>
