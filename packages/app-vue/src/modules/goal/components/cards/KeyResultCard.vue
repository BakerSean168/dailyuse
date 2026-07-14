<template>
  <ActionableWrapper :actions="menuActions">
    <Card
      class="relative overflow-hidden border transition hover:-translate-y-0.5 hover:shadow-md"
      :class="progressPercentage >= 100 ? 'border-success/50' : ''"
    >
      <div
        class="absolute inset-y-0 left-0 z-0 opacity-10 transition-all"
        :style="{ width: `${progressPercentage}%`, background: 'hsl(var(--primary))' }"
      />

      <CardHeader class="relative z-10 pb-2">
        <CardTitle class="flex items-start justify-between gap-3 text-base">
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ keyResult.title }}</p>
            <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline"
                >{{ t('goal.cards.keyResultCard.weight') }} {{ keyResult.weight }}</Badge
              >
              <span>{{ progressPercentage }}%</span>
            </div>
          </div>

          <Button variant="ghost" size="icon" @click="$emit('navigate', keyResult)">
            <ExternalLink class="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent class="relative z-10 space-y-3 pt-0">
        <Progress :model-value="progressPercentage" />

        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <Badge>{{ keyResult.progress.currentValue }}</Badge>
            <ArrowRight class="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{{ keyResult.progress.targetValue }}</Badge>
          </div>

          <!-- Keep "Add Record" as a visible primary action -->
          <Button size="sm" variant="outline" @click="$emit('add-record', keyResult)">
            <Plus class="mr-1 h-4 w-4" />
            {{ t('goal.cards.keyResultCard.addRecord') }}
          </Button>
        </div>

        <p
          v-if="keyResult.description"
          class="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]"
        >
          {{ keyResult.description }}
        </p>
        <div v-else class="min-h-[2.5rem]" />
      </CardContent>
    </Card>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight, ExternalLink, Plus, ListPlus, Trash2 } from '@lucide/vue';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../../components/shared';
import type { MenuAction } from '../../../../components/shared';
import { getKeyResultProgressPercentage } from '../../utils/progress';

const { t } = useI18n();

const props = defineProps<{
  keyResult: KeyResultClientDTO;
  goal?: GoalClientDTO;
}>();

const emit = defineEmits<{
  navigate: [keyResult: KeyResultClientDTO];
  'add-record': [keyResult: KeyResultClientDTO];
  delete: [keyResult: KeyResultClientDTO];
}>();

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'add-record',
    label: menuLabel('addRecord'),
    icon: ListPlus,
    handler: () => emit('add-record', props.keyResult),
  },
  {
    key: 'navigate',
    label: menuLabel('viewDetails'),
    icon: ExternalLink,
    handler: () => emit('navigate', props.keyResult),
  },
  {
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => emit('delete', props.keyResult),
  },
]);

const progressPercentage = computed(() => {
  return getKeyResultProgressPercentage(props.keyResult.progress);
});
</script>
