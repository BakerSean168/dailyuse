<template>
  <Card class="max-w-[600px] mx-auto">
    <CardHeader class="flex flex-row items-center justify-between p-4 space-y-0">
      <div class="flex items-center gap-2">
        <PieChart class="h-5 w-5 text-primary" />
        <CardTitle>进度分解详情</CardTitle>
      </div>
      <Button variant="ghost" size="icon" @click="$emit('close')">
        <X class="h-4 w-4" />
      </Button>
    </CardHeader>

    <Separator />

    <!-- Loading state -->
    <CardContent v-if="loading" class="text-center py-8">
      <Loader2 class="h-12 w-12 animate-spin text-primary mx-auto" />
      <p class="text-sm text-muted-foreground mt-2">加载中...</p>
    </CardContent>

    <!-- Error state -->
    <CardContent v-else-if="error" class="text-center py-8">
      <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-2" />
      <p class="text-destructive text-sm mb-4">{{ error }}</p>
      <Button variant="outline" size="sm" @click="$emit('retry')">
        重试
      </Button>
    </CardContent>

    <!-- Content -->
    <CardContent v-else-if="breakdown" class="p-4 space-y-4">
      <!-- Total Progress Card -->
      <Card variant="outline">
        <CardContent class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">目标总进度</span>
            <Badge :variant="getProgressVariant(breakdown.totalProgress)">
              {{ breakdown.totalProgress.toFixed(2) }}%
            </Badge>
          </div>
          <Progress 
            :model-value="breakdown.totalProgress" 
            :class="getProgressClass(breakdown.totalProgress)"
            class="h-3 mb-2"
          />
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>计算模式：加权平均</span>
            <span>最后更新：{{ formatTime(breakdown.lastUpdateTime) }}</span>
          </div>
        </CardContent>
      </Card>

      <!-- Key Results Contributions -->
      <div>
        <div class="flex items-center gap-1 text-sm font-medium mb-2">
          <BarChart3 class="h-4 w-4" />
          关键结果贡献度（{{ breakdown.krContributions.length }}项）
        </div>

        <div class="space-y-3">
          <div
            v-for="(kr, index) in breakdown.krContributions"
            :key="kr.keyResultUuid"
            class="border-b pb-3 last:border-b-0"
          >
            <div class="flex items-start gap-3">
              <div 
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                :class="getProgressBgClass(kr.progress)"
              >
                {{ index + 1 }}
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm mb-1">{{ kr.keyResultName }}</div>
                
                <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>进度：<strong>{{ kr.progress.toFixed(2) }}%</strong></span>
                  <span>权重：<strong>{{ kr.weight }}%</strong></span>
                  <span>贡献度：<strong class="text-primary">{{ kr.contribution.toFixed(2) }}%</strong></span>
                </div>
                
                <Progress 
                  :model-value="kr.progress" 
                  :class="getProgressClass(kr.progress)"
                  class="h-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Formula Explanation -->
      <Alert>
        <Calculator class="h-4 w-4" />
        <AlertTitle class="text-sm">计算公式</AlertTitle>
        <AlertDescription class="text-xs font-mono break-words">
          {{ getFormulaText() }}
        </AlertDescription>
      </Alert>
    </CardContent>

    <Separator v-if="breakdown" />

    <!-- Footer Actions -->
    <CardFooter v-if="breakdown" class="justify-end">
      <Button variant="ghost" size="sm" @click="$emit('close')">
        关闭
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge, type BadgeVariants } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { 
  PieChart, 
  X, 
  Loader2, 
  AlertCircle, 
  BarChart3,
  Calculator 
} from 'lucide-vue-next';
import { format } from 'date-fns';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';

interface Props {
  breakdown: ProgressBreakdown | null;
  loading?: boolean;
  error?: string | null;
}

const props = defineProps<Props>();

defineEmits<{
  close: [];
  retry: [];
}>();

function getProgressVariant(progress: number): BadgeVariants['variant'] {
  if (progress >= 70) return 'default';
  if (progress >= 50) return 'secondary';
  return 'destructive';
}

function getProgressClass(progress: number): string {
  if (progress >= 90) return '[&>div]:bg-green-600';
  if (progress >= 70) return '[&>div]:bg-blue-600';
  if (progress >= 50) return '[&>div]:bg-yellow-600';
  if (progress >= 30) return '[&>div]:bg-orange-600';
  return '[&>div]:bg-red-600';
}

function getProgressBgClass(progress: number): string {
  if (progress >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (progress >= 70) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (progress >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (progress >= 30) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm');
}

const getFormulaText = computed((): string => {
  if (!props.breakdown) return '';

  const parts = props.breakdown.krContributions.map(
    (kr) => `${kr.progress.toFixed(2)}% × ${kr.weight}%`
  );

  const totalWeight = props.breakdown.krContributions.reduce((sum, kr) => sum + kr.weight, 0);

  return `总进度 = (${parts.join(' + ')}) / ${totalWeight}% = ${props.breakdown.totalProgress.toFixed(2)}%`;
});
</script>
