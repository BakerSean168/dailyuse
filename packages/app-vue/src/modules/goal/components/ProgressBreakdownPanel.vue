<template>
  <Card class="max-w-[600px] mx-auto">
    <CardHeader class="flex flex-row items-center justify-between p-4 space-y-0">
      <div class="flex items-center gap-2">
        <PieChart class="h-5 w-5 text-primary" />
        <CardTitle>{{ t('goal.progressBreakdown.title') }}</CardTitle>
      </div>
      <Button variant="ghost" size="icon" @click="$emit('close')">
        <X class="h-4 w-4" />
      </Button>
    </CardHeader>

    <Separator />

    <!-- Loading state -->
    <CardContent v-if="loading" class="text-center py-8">
      <Loader2 class="h-12 w-12 animate-spin text-primary mx-auto" />
      <p class="text-sm text-muted-foreground mt-2">{{ t('goal.progressBreakdown.loading') }}</p>
    </CardContent>

    <!-- Error state -->
    <CardContent v-else-if="error" class="text-center py-8">
      <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-2" />
      <p class="text-destructive text-sm mb-4">{{ error }}</p>
      <Button variant="outline" size="sm" @click="$emit('retry')">
        {{ t('goal.progressBreakdown.retry') }}
      </Button>
    </CardContent>

    <!-- Content -->
    <CardContent v-else-if="breakdown" class="p-4 space-y-4">
      <!-- Total Progress Card -->
      <Card variant="outline">
        <CardContent class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">{{
              t('goal.progressBreakdown.totalProgress')
            }}</span>
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
            <span>{{ t('goal.progressBreakdown.calcMode') }}</span>
            <span
              >{{ t('goal.progressBreakdown.lastUpdate')
              }}{{ formatTime(breakdown.lastUpdateTime) }}</span
            >
          </div>
        </CardContent>
      </Card>

      <!-- Key Results Contributions -->
      <div>
        <div class="flex items-center gap-1 text-sm font-medium mb-2">
          <BarChart3 class="h-4 w-4" />
          {{ t('goal.progressBreakdown.krContribution', { n: breakdown.krContributions.length }) }}
        </div>

        <div class="space-y-3">
          <div
            v-for="(kr, index) in breakdown.krContributions"
            :key="kr.keyResultId"
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
                  <span
                    >{{ t('goal.progressBreakdown.progress')
                    }}<strong>{{ kr.progress.toFixed(2) }}%</strong></span
                  >
                  <span
                    >{{ t('goal.progressBreakdown.weight') }}<strong>{{ kr.weight }}%</strong></span
                  >
                  <span
                    >{{ t('goal.progressBreakdown.contribution')
                    }}<strong class="text-primary">{{ kr.contribution.toFixed(2) }}%</strong></span
                  >
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
        <AlertTitle class="text-sm">{{ t('goal.progressBreakdown.calcFormula') }}</AlertTitle>
        <AlertDescription class="text-xs font-mono break-words">
          {{ getFormulaText }}
        </AlertDescription>
      </Alert>
    </CardContent>

    <Separator v-if="breakdown" />

    <!-- Footer Actions -->
    <CardFooter v-if="breakdown" class="justify-end">
      <Button variant="ghost" size="sm" @click="$emit('close')">
        {{ t('goal.progressBreakdown.close') }}
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge, type BadgeVariants } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { PieChart, X, Loader2, AlertCircle, BarChart3, Calculator } from 'lucide-vue-next';
import { format } from 'date-fns';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';

const props = defineProps<{
  breakdown: ProgressBreakdown | null;
  loading?: boolean;
  error?: string | null;
}>();

const { t } = useI18n();

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
  if (progress >= 50)
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (progress >= 30)
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm');
}

const getFormulaText = computed((): string => {
  if (!props.breakdown) return '';

  const parts = props.breakdown.krContributions.map(
    (kr) => `${kr.progress.toFixed(2)}% × ${kr.weight}%`,
  );

  const totalWeight = props.breakdown.krContributions.reduce((sum, kr) => sum + kr.weight, 0);

  return `总进度 = (${parts.join(' + ')}) / ${totalWeight}% = ${props.breakdown.totalProgress.toFixed(2)}%`;
});
</script>
