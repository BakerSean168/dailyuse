<template>
  <Card
    class="relative overflow-hidden border transition hover:-translate-y-0.5 hover:shadow-md"
    :class="progressPercentage >= 100 ? 'border-green-500/50' : ''"
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
            <Badge variant="outline">权重 {{ keyResult.weight }}</Badge>
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

        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline" @click="$emit('add-record', keyResult)">
            <Plus class="mr-1 h-4 w-4" />
            添加记录
          </Button>
          <Button size="sm" variant="destructive" @click="$emit('delete', keyResult)">
            <Trash2 class="mr-1 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <p v-if="keyResult.description" class="text-sm text-muted-foreground">
        {{ keyResult.description }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, ExternalLink, Plus, Trash2 } from 'lucide-vue-next';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Progress } from '../../../ui/progress';

const props = defineProps<{
  keyResult: KeyResultClientDTO;
  goal?: GoalClientDTO;
}>();

defineEmits<{
  navigate: [keyResult: KeyResultClientDTO];
  'add-record': [keyResult: KeyResultClientDTO];
  delete: [keyResult: KeyResultClientDTO];
}>();

const progressPercentage = computed(() => {
  const target = props.keyResult.progress.targetValue || 0;
  const current = props.keyResult.progress.currentValue || 0;
  if (target <= 0) return 0;
  const value = (current / target) * 100;
  return Math.round(Math.min(100, Math.max(0, value)));
});
</script>
