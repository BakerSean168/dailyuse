<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-lg font-semibold">多目标对比</h2>
      <Button variant="outline" size="sm" @click="showSelector = true">
        <GitCompare class="mr-1 h-4 w-4" /> 选择目标
      </Button>
    </div>

    <div v-if="selectedGoals.length === 0" class="flex flex-1 items-center justify-center">
      <div class="text-center space-y-2">
        <GitCompare class="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p class="text-muted-foreground">请选择至少两个目标进行对比</p>
        <Button @click="showSelector = true">选择目标</Button>
      </div>
    </div>

    <ScrollArea v-else class="flex-1">
      <div class="space-y-6">
        <!-- 对比概览 -->
        <div class="grid gap-4" :class="gridCols">
          <Card v-for="goal in selectedGoals" :key="goal.id">
            <CardHeader class="pb-2">
              <CardTitle class="text-base">{{ goal.name }}</CardTitle>
              <CardDescription>
                <Badge :variant="statusVariant(goal.status)">{{ goal.status }}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">优先级</span>
                <span class="font-medium">{{ goal.priority }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">重要性</span>
                <span class="font-medium">{{ goal.importance }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">标签</span>
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="tag in goal.tags" :key="tag" variant="secondary" class="text-xs">
                    {{ tag }}
                  </Badge>
                </div>
              </div>
              <div v-if="goal.startDate" class="flex justify-between">
                <span class="text-muted-foreground">开始日期</span>
                <span>{{ formatDate(goal.startDate) }}</span>
              </div>
              <div v-if="goal.targetDate" class="flex justify-between">
                <span class="text-muted-foreground">目标日期</span>
                <span>{{ formatDate(goal.targetDate) }}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- 对比统计面板 -->
        <ComparisonStatsPanel v-if="selectedGoals.length >= 2" :goals="selectedGoals" />
      </div>
    </ScrollArea>

    <!-- 目标选择器 -->
    <MultiGoalSelector
      v-model:open="showSelector"
      :goals="goals"
      :selected-ids="selectedIds"
      @update:selected-ids="handleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { GitCompare } from 'lucide-vue-next';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { ComparisonStatsPanel, MultiGoalSelector } from '../components';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

const { goals, fetchGoals } = useGoal();

const selectedIds = ref<string[]>([]);
const showSelector = ref(false);

const selectedGoals = computed<GoalClientDTO[]>(() =>
  goals.value.filter((g) => selectedIds.value.includes(g.id)),
);

const gridCols = computed(() => {
  const count = selectedGoals.value.length;
  if (count <= 2) return 'grid-cols-2';
  if (count <= 3) return 'grid-cols-3';
  return 'grid-cols-2 lg:grid-cols-4';
});

function statusVariant(status: string) {
  if (status === 'Active') return 'default' as const;
  if (status === 'Completed') return 'secondary' as const;
  return 'outline' as const;
}

function formatDate(d: string | number | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN');
}

function handleSelect(ids: string[]) {
  selectedIds.value = ids;
  showSelector.value = false;
}

onMounted(() => {
  fetchGoals();
});
</script>
