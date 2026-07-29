<template>
  <Card class="h-full flex flex-col shadow-md">
    <!-- Header -->
    <CardHeader
      class="flex flex-row items-center justify-between p-4 bg-gradient-to-br from-info/10 to-transparent"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
          <ChartBar class="h-7 w-7 text-info" />
        </div>
        <div>
          <CardTitle class="text-xl font-bold">{{ t('schedule.statistics.title') }}</CardTitle>
          <p class="text-xs text-muted-foreground">{{ t('schedule.statistics.subtitle') }}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('common.refresh')"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <RotateCw v-else class="h-4 w-4" />
      </Button>
    </CardHeader>

    <Separator />

    <CardContent class="p-4 flex-1">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 class="h-16 w-16 animate-spin text-primary" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>{{ t('schedule.statistics.error') }}</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
          <Button variant="outline" size="sm" class="mt-2" @click="$emit('refresh')">
            {{ t('schedule.statistics.retry') }}
          </Button>
        </Alert>
      </div>

      <!-- Statistics Content -->
      <div v-else-if="statistics" class="space-y-6 max-h-[600px] overflow-y-auto">
        <!-- Overall Statistics -->
        <div>
          <h4 class="text-sm font-semibold mb-3">{{ t('schedule.statistics.overallOverview') }}</h4>
          <div class="grid grid-cols-2 @2xl/panel:grid-cols-4 gap-3">
            <Card class="bg-primary/10 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-primary">{{ statistics.totalTasks }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.totalTasks') }}
                </div>
              </CardContent>
            </Card>
            <Card class="bg-success/10 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-success">
                  {{ statistics.activeTasks }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.activeTasks') }}
                </div>
              </CardContent>
            </Card>
            <Card class="bg-warning/10 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-warning">
                  {{ statistics.pausedTasks }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.pausedTasks') }}
                </div>
              </CardContent>
            </Card>
            <Card class="bg-destructive/10 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-destructive">
                  {{ statistics.failedTasks }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.failedTasks') }}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Execution Statistics -->
        <div>
          <h4 class="text-sm font-semibold mb-3">
            {{ t('schedule.statistics.executionOverview') }}
          </h4>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <Card variant="outline">
              <CardContent class="text-center p-4">
                <div class="text-xl font-bold">{{ statistics.totalExecutions }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.totalExecutions') }}
                </div>
              </CardContent>
            </Card>
            <Card variant="outline">
              <CardContent class="text-center p-4">
                <div class="text-xl font-bold text-success">
                  {{ statistics.successfulExecutions }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.successCount') }}
                </div>
              </CardContent>
            </Card>
            <Card variant="outline">
              <CardContent class="text-center p-4">
                <div class="text-xl font-bold text-destructive">
                  {{ statistics.failedExecutions }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t('schedule.statistics.failCount') }}
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Success Rate -->
          <Card variant="outline">
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ t('schedule.statistics.successRate') }}</span>
                <span class="text-lg font-bold text-success">{{ successRate }}%</span>
              </div>
              <Progress :model-value="successRate" class="h-2" />
            </CardContent>
          </Card>
        </div>

        <!-- Module Statistics -->
        <div v-if="moduleStatistics">
          <h4 class="text-sm font-semibold mb-3">
            {{ t('schedule.statistics.moduleDistribution') }}
          </h4>
          <div class="grid grid-cols-1 @2xl/panel:grid-cols-3 gap-3">
            <Card
              v-for="(stats, moduleName) in moduleStatistics"
              :key="moduleName"
              variant="outline"
              class="hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <CardContent class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <component
                    :is="getModuleIcon(moduleName as string)"
                    :class="['h-8 w-8', getModuleColorClass(moduleName as string)]"
                  />
                  <div>
                    <div class="text-sm font-semibold">
                      {{ getModuleName(moduleName as string) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ t('schedule.statistics.moduleTasks', { n: stats.totalTasks }) }}
                    </div>
                  </div>
                </div>

                <Separator class="my-2" />

                <div class="flex justify-between text-xs">
                  <span>{{ t('schedule.statistics.moduleActive', { n: stats.activeTasks }) }}</span>
                  <span>{{
                    t('schedule.statistics.moduleExecutions', { n: stats.totalExecutions })
                  }}</span>
                  <span>{{
                    t('schedule.statistics.moduleSuccessRate', { rate: stats.successRateFormatted })
                  }}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <ChartBarBig class="h-20 w-20 text-muted-foreground mx-auto mb-4" />
        <p class="text-lg text-muted-foreground">{{ t('schedule.statistics.emptyTitle') }}</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@memoflow/ui-vue-shadcn';
import { Button } from '@memoflow/ui-vue-shadcn';
import { Alert, AlertDescription, AlertTitle } from '@memoflow/ui-vue-shadcn';
import { Separator } from '@memoflow/ui-vue-shadcn';
import { Progress } from '@memoflow/ui-vue-shadcn';
import {
  ChartBar,
  ChartBarBig,
  RotateCw,
  Loader2,
  AlertCircle,
  BellRing,
  ListChecks,
  Target,
  BellDot,
  HelpCircle,
} from '@lucide/vue';
import type { SourceModule } from '@memoflow/contracts/schedule';

interface ScheduleStatisticsData {
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}

interface ModuleStatisticsData {
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successRate: number;
  successRateFormatted: string;
}

const props = defineProps<{
  statistics: ScheduleStatisticsData | null;
  moduleStatistics?: Record<SourceModule, ModuleStatisticsData> | null;
  isLoading?: boolean;
  error?: string | null;
}>();

defineEmits<{
  refresh: [];
}>();

const { t } = useI18n();

const successRate = computed(() => {
  if (!props.statistics || props.statistics.totalExecutions === 0) {
    return 0;
  }
  return Math.round(
    (props.statistics.successfulExecutions / props.statistics.totalExecutions) * 100,
  );
});

function getModuleName(module: string): string {
  const nameMap: Record<string, string> = {
    reminder: t('schedule.statistics.moduleNames.reminder'),
    task: t('schedule.statistics.moduleNames.task'),
    goal: t('schedule.statistics.moduleNames.goal'),
    notification: t('schedule.statistics.moduleNames.notification'),
  };
  return nameMap[module] || module;
}

function getModuleIcon(module: string): Component {
  const iconMap: Record<string, Component> = {
    reminder: BellRing,
    task: ListChecks,
    goal: Target,
    notification: BellDot,
  };
  return iconMap[module] || HelpCircle;
}

function getModuleColorClass(module: string): string {
  const colorMap: Record<string, string> = {
    reminder: 'text-primary',
    task: 'text-success',
    goal: 'text-warning',
    notification: 'text-info',
  };
  return colorMap[module] || 'text-muted-foreground';
}
</script>
