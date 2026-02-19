<template>
  <Card class="relative w-full cursor-pointer" @click="refreshContent">
    <CardHeader class="pb-2">
      <CardTitle class="flex items-center justify-between text-base">
        <div class="flex items-center gap-2">
          <component :is="isShowingMotive ? Flag : Lightbulb" class="h-4 w-4 text-primary" />
          {{ isShowingMotive ? '目标动机' : '可行性分析' }}
        </div>
        <Button variant="ghost" size="icon" @click.stop="refreshContent">
          <RefreshCw class="h-4 w-4" />
        </Button>
      </CardTitle>
      <CardDescription>点击卡片可随机切换内容</CardDescription>
    </CardHeader>

    <CardContent class="space-y-3">
      <p v-if="currentContent" class="rounded-md border bg-muted/40 px-3 py-3 text-sm leading-6 italic">
        {{ currentContent }}
      </p>
      <div v-else class="flex items-center justify-center rounded-md border border-dashed py-6 text-sm text-muted-foreground">
        暂无内容
      </div>

      <div v-if="currentGoal" class="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">来源目标</Badge>
        <span class="truncate">{{ currentGoal.name }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Flag, Lightbulb, RefreshCw } from 'lucide-vue-next';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card';

interface Props {
  goals?: GoalClientDTO[];
}

const props = withDefaults(defineProps<Props>(), {
  goals: () => [],
});

const isShowingMotive = ref(true);
const currentContent = ref('');
const currentGoal = ref<GoalClientDTO | null>(null);

const refreshContent = () => {
  const goals = props.goals ?? [];
  if (!goals.length) {
    currentGoal.value = null;
    currentContent.value = '';
    return;
  }

  isShowingMotive.value = Math.random() > 0.5;

  const validGoals = goals.filter((goal) => {
    const text = isShowingMotive.value ? goal.motivation : goal.feasibilityAnalysis;
    return Boolean(text && text.trim());
  });

  if (!validGoals.length) {
    currentGoal.value = null;
    currentContent.value = '';
    return;
  }

  const selected = validGoals[Math.floor(Math.random() * validGoals.length)];
  currentGoal.value = selected;
  currentContent.value = (isShowingMotive.value ? selected.motivation : selected.feasibilityAnalysis) ?? '';
};

onMounted(() => {
  refreshContent();
});
</script>
