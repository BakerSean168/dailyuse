<!--
  ComparisonStatsPanel.vue
  多目标对比统计面板 - 显示详细的对比指标
-->

<template>
  <Card class="overflow-hidden rounded-2xl">
    <CardHeader class="flex flex-row items-center gap-3 border-b bg-muted/30 p-6">
      <BarChart3 class="h-7 w-7 text-primary" />
      <CardTitle class="text-xl font-bold">{{ t('goal.comparison.statsTitle') }}</CardTitle>

      <div class="flex-1" />

      <!-- 视图切换 -->
      <div class="flex items-center rounded-lg border shadow-sm">
        <Button
          :variant="viewMode === 'table' ? 'default' : 'ghost'"
          size="sm"
          @click="viewMode = 'table'"
        >
          <Table class="mr-1.5 h-4 w-4" />
          {{ t('goal.comparison.tableTab') }}
        </Button>
        <Button
          :variant="viewMode === 'chart' ? 'default' : 'ghost'"
          size="sm"
          @click="viewMode = 'chart'"
        >
          <BarChart3 class="mr-1.5 h-4 w-4" />
          {{ t('goal.comparison.chartTab') }}
        </Button>
      </div>
    </CardHeader>

    <CardContent class="p-6">
      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b-2 border-primary/20 bg-muted/50">
              <th class="min-w-[150px] p-4 text-left font-bold">
                {{ t('goal.comparison.metricHeader') }}
              </th>
              <th v-for="goal in goals" :key="goal.id" class="min-w-[200px] text-left">
                <div class="flex items-center gap-3 p-2">
                  <div
                    class="h-3 w-3 shrink-0 rounded-full shadow-sm"
                    :style="{ backgroundColor: goal.color || '#2196F3' }"
                  />
                  <div>
                    <div class="font-semibold">{{ goal.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ getStatusText(goal) }}</div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- 关键结果数量 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <Target class="h-4 w-4 text-primary" />
                  {{ t('goal.comparison.krCount') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`kr-count-${goal.id}`" class="p-4">
                <Badge variant="secondary" class="px-3">
                  <Hash class="mr-1 h-3 w-3" />
                  {{ getKRCount(goal) }} {{ t('goal.comparison.unit') }}
                </Badge>
              </td>
            </tr>

            <!-- 整体进度 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <TrendingUp class="h-4 w-4 text-success" />
                  {{ t('goal.comparison.overallProgress') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`progress-${goal.id}`" class="p-4">
                <div class="min-w-[180px] space-y-2">
                  <Progress :model-value="getProgress(goal)" class="h-3" />
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">{{
                      t('goal.comparison.progress')
                    }}</span>
                    <span class="font-bold" :class="getProgressTextClass(getProgress(goal))">
                      {{ getProgress(goal) }}%
                    </span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- 权重总和 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <Weight class="h-4 w-4 text-warning" />
                  {{ t('goal.comparison.weightSum') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`weight-${goal.id}`" class="p-4">
                <Badge
                  :variant="getTotalWeight(goal) === 100 ? 'default' : 'destructive'"
                  class="px-3"
                >
                  <component
                    :is="getTotalWeight(goal) === 100 ? CheckCircle2 : AlertCircle"
                    class="mr-1 h-3 w-3"
                  />
                  {{ getTotalWeight(goal) }}%
                </Badge>
              </td>
            </tr>

            <!-- 平均权重 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <PieChart class="h-4 w-4 text-info" />
                  {{ t('goal.comparison.avgWeight') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`avg-weight-${goal.id}`" class="p-4">
                <span class="font-medium">{{ getAverageWeight(goal) }}%</span>
              </td>
            </tr>

            <!-- 状态 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <Flag class="h-4 w-4 text-muted-foreground" />
                  {{ t('goal.comparison.status') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`status-${goal.id}`" class="p-4">
                <Badge :variant="getStatusBadgeVariant(goal)" class="px-3">
                  {{ getStatusText(goal) }}
                </Badge>
              </td>
            </tr>

            <!-- 创建时间 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <CalendarPlus class="h-4 w-4 text-muted-foreground" />
                  {{ t('goal.comparison.createTime') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`created-${goal.id}`" class="p-4 text-sm">
                {{ formatProductDateTime(goal.createdAt) }}
              </td>
            </tr>

            <!-- 更新时间 -->
            <tr class="border-b border-border/50 transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <CalendarClock class="h-4 w-4 text-muted-foreground" />
                  {{ t('goal.comparison.lastUpdate') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`updated-${goal.id}`" class="p-4 text-sm">
                {{ formatProductDateTime(goal.updatedAt) }}
              </td>
            </tr>

            <!-- 时间跨度 -->
            <tr class="transition-colors hover:bg-muted/30">
              <td class="p-4 font-medium">
                <span class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-muted-foreground" />
                  {{ t('goal.comparison.activeDays') }}
                </span>
              </td>
              <td v-for="goal in goals" :key="`days-${goal.id}`" class="p-4">
                <Badge variant="outline" class="px-3">
                  <CalendarRange class="mr-1 h-3 w-3" />
                  {{ getActiveDays(goal) }} {{ t('goal.comparison.dayUnit') }}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 图表视图 -->
      <div v-else class="min-h-[300px] space-y-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- 关键结果数量对比 -->
          <div
            class="rounded-xl border bg-card p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="mb-3 text-sm font-bold">{{ t('goal.comparison.krCountCompare') }}</div>
            <div class="flex items-center justify-around">
              <div v-for="goal in goals" :key="`kr-chart-${goal.id}`" class="text-center">
                <div
                  class="stat-circle"
                  :style="{
                    backgroundColor: goal.color || '#2196F3',
                    width: `${Math.max(60, getKRCount(goal) * 10)}px`,
                    height: `${Math.max(60, getKRCount(goal) * 10)}px`,
                  }"
                >
                  <div class="text-[28px] font-bold text-white">{{ getKRCount(goal) }}</div>
                </div>
                <div class="mt-2 text-xs text-muted-foreground">{{ goal.name }}</div>
              </div>
            </div>
          </div>

          <!-- 进度对比 -->
          <div
            class="rounded-xl border bg-card p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="mb-3 text-sm font-bold">{{ t('goal.comparison.progressCompare') }}</div>
            <div v-for="goal in goals" :key="`progress-chart-${goal.id}`" class="mb-3 space-y-1">
              <div class="flex items-center">
                <div
                  class="mr-2 h-2 w-2 rounded-full"
                  :style="{ backgroundColor: goal.color || '#2196F3' }"
                />
                <span class="text-xs">{{ goal.name }}</span>
                <div class="flex-1" />
                <span class="text-xs font-bold">{{ getProgress(goal) }}%</span>
              </div>
              <Progress :model-value="getProgress(goal)" class="h-3" />
            </div>
          </div>

          <!-- 权重分布 -->
          <div
            class="col-span-full rounded-xl border bg-card p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="mb-3 text-sm font-bold">{{ t('goal.comparison.weightAnalysis') }}</div>
            <div
              class="grid gap-4"
              :style="{ gridTemplateColumns: `repeat(${goals.length}, 1fr)` }"
            >
              <div v-for="goal in goals" :key="`weight-dist-${goal.id}`">
                <div class="mb-2 text-center">
                  <Badge variant="secondary">{{ goal.name }}</Badge>
                </div>
                <div class="space-y-2 rounded-lg border bg-muted/30 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">{{
                      t('goal.comparison.weightSum2')
                    }}</span>
                    <Badge
                      :variant="getTotalWeight(goal) === 100 ? 'default' : 'destructive'"
                      class="text-xs"
                    >
                      {{ getTotalWeight(goal) }}%
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">{{
                      t('goal.comparison.weightAvg')
                    }}</span>
                    <span class="text-sm font-bold">{{ getAverageWeight(goal) }}%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">{{
                      t('goal.comparison.weightMax')
                    }}</span>
                    <span class="text-sm">{{ getMaxWeight(goal) }}%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">{{
                      t('goal.comparison.weightMin')
                    }}</span>
                    <span class="text-sm">{{ getMinWeight(goal) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 汇总洞察 -->
      <Separator class="my-6" />

      <div class="mt-4">
        <div class="mb-4 flex items-center gap-3">
          <Lightbulb class="h-7 w-7 text-warning" />
          <span class="text-lg font-bold">{{ t('goal.comparison.insights') }}</span>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <!-- 进度最快 -->
          <Card
            class="overflow-hidden border-success/40 bg-success/10/50 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-green-900 dark:bg-green-950/30"
          >
            <CardContent class="p-4">
              <div class="mb-3 flex items-center gap-3">
                <Trophy class="h-8 w-8 text-success" />
                <div>
                  <div class="text-xs text-muted-foreground">
                    {{ t('goal.comparison.fastestProgress') }}
                  </div>
                  <div class="mt-1 text-3xl font-bold text-success">
                    {{ getProgress(getHighestProgressGoal()!) }}%
                  </div>
                </div>
              </div>
              <Separator class="my-2" />
              <div class="mt-3 flex items-center">
                <div
                  class="mr-2 h-3 w-3 rounded-full shadow-sm"
                  :style="{ backgroundColor: getHighestProgressGoal()?.color || '#4CAF50' }"
                />
                <span class="font-medium">
                  {{ getHighestProgressGoal()?.name || '-' }}
                </span>
              </div>
            </CardContent>
          </Card>

          <!-- KR 数量最多 -->
          <Card
            class="overflow-hidden border-info/40 bg-info/10/50 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-blue-900 dark:bg-blue-950/30"
          >
            <CardContent class="p-4">
              <div class="mb-3 flex items-center gap-3">
                <ListOrdered class="h-8 w-8 text-primary" />
                <div>
                  <div class="text-xs text-muted-foreground">{{ t('goal.comparison.mostKR') }}</div>
                  <div class="mt-1 text-3xl font-bold text-primary">
                    {{ getKRCount(getMostKRsGoal()!) }}
                  </div>
                </div>
              </div>
              <Separator class="my-2" />
              <div class="mt-3 flex items-center">
                <div
                  class="mr-2 h-3 w-3 rounded-full shadow-sm"
                  :style="{ backgroundColor: getMostKRsGoal()?.color || '#2196F3' }"
                />
                <span class="font-medium">
                  {{ getMostKRsGoal()?.name || '-' }}
                </span>
              </div>
            </CardContent>
          </Card>

          <!-- 活跃时间最长 -->
          <Card
            class="overflow-hidden border-warning/40 bg-amber-50/50 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-amber-900 dark:bg-amber-950/30"
          >
            <CardContent class="p-4">
              <div class="mb-3 flex items-center gap-3">
                <CalendarClock class="h-8 w-8 text-warning" />
                <div>
                  <div class="text-xs text-muted-foreground">
                    {{ t('goal.comparison.longestActive') }}
                  </div>
                  <div class="mt-1 text-3xl font-bold text-warning">
                    {{ getActiveDays(getOldestGoal()!) }}{{ t('goal.comparison.dayUnit') }}
                  </div>
                </div>
              </div>
              <Separator class="my-2" />
              <div class="mt-3 flex items-center">
                <div
                  class="mr-2 h-3 w-3 rounded-full shadow-sm"
                  :style="{ backgroundColor: getOldestGoal()?.color || '#FF9800' }"
                />
                <span class="font-medium">
                  {{ getOldestGoal()?.name || '-' }}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import {
import { formatProductDate, formatProductDateTime } from '@/shared/utils/product-time';
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Progress,
  Separator,
} from '@dailyuse/ui-vue-shadcn';
import {
  BarChart3,
  Table,
  Target,
  Hash,
  TrendingUp,
  Weight,
  PieChart,
  Flag,
  CalendarPlus,
  CalendarClock,
  Clock,
  CalendarRange,
  Lightbulb,
  Trophy,
  ListOrdered,
  CheckCircle2,
  AlertCircle,
} from '@lucide/vue';

const props = defineProps<{
  goals: GoalClientDTO[];
}>();

// State
const { t, locale } = useI18n();
const viewMode = ref<'table' | 'chart'>('table');

// Helper Methods
const getKRCount = (goal: GoalClientDTO): number => {
  return goal?.keyResults?.length || 0;
};

const getProgress = (goal: GoalClientDTO): number => {
  const krs = goal?.keyResults;
  if (!krs || krs.length === 0) return 0;
  const totalWeight = krs.reduce((sum: number, kr: KeyResultClientDTO) => sum + (kr.weight ?? 1), 0);
  if (totalWeight === 0) return 0;
  const weightedProgress = krs.reduce((sum: number, kr: KeyResultClientDTO) => {
    const p = kr.progress;
    if (!p || !p.targetValue) return sum;
    const pct = Math.min(1, p.currentValue / p.targetValue);
    return sum + pct * (kr.weight ?? 1);
  }, 0);
  return Math.round((weightedProgress / totalWeight) * 100);
};

const getTotalWeight = (goal: GoalClientDTO): number => {
  if (!goal?.keyResults) return 0;
  return goal.keyResults.reduce((sum: number, kr: KeyResultClientDTO) => sum + (kr.weight || 0), 0);
};

const getAverageWeight = (goal: GoalClientDTO): number => {
  const count = getKRCount(goal);
  if (count === 0) return 0;
  return Math.round(getTotalWeight(goal) / count);
};

const getMaxWeight = (goal: GoalClientDTO): number => {
  if (!goal?.keyResults || goal.keyResults.length === 0) return 0;
  return Math.max(...goal.keyResults.map((kr: KeyResultClientDTO) => kr.weight || 0));
};

const getMinWeight = (goal: GoalClientDTO): number => {
  if (!goal?.keyResults || goal.keyResults.length === 0) return 0;
  return Math.min(...goal.keyResults.map((kr: KeyResultClientDTO) => kr.weight || 0));
};

const getActiveDays = (goal: GoalClientDTO): number => {
  if (!goal?.createdAt) return 0;
  const now = Date.now();
  const created = goal.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
};

const getStatusBadgeVariant = (goal: GoalClientDTO): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    Draft: 'outline',
    Active: 'default',
    Completed: 'secondary',
    Archived: 'outline',
  };
  return variantMap[goal.status] || 'outline';
};

const getStatusText = (goal: GoalClientDTO): string => {
  const textMap: Record<string, string> = {
    Draft: t('goal.comparison.statusDraft'),
    Active: t('goal.comparison.statusActive'),
    Completed: t('goal.comparison.statusCompleted'),
    Archived: t('goal.comparison.statusArchived'),
  };
  return textMap[goal.status] || goal.status;
};

const getProgressTextClass = (progress: number): string => {
  if (progress >= 80) return 'text-success';
  if (progress >= 50) return 'text-primary';
  if (progress >= 20) return 'text-warning';
  return 'text-destructive';
};

// Insights
const getHighestProgressGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((max, goal) => (getProgress(goal) > getProgress(max) ? goal : max));
};

const getMostKRsGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((max, goal) => (getKRCount(goal) > getKRCount(max) ? goal : max));
};

const getOldestGoal = () => {
  if (!props.goals || props.goals.length === 0) return null;
  return props.goals.reduce((oldest, goal) =>
    (goal.createdAt || 0) < (oldest.createdAt || 0) ? goal : oldest,
  );
};
</script>

<style scoped>
.stat-circle {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-circle:hover {
  transform: scale(1.1);
}
</style>
