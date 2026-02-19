<template>
  <Card class="h-full flex flex-col shadow-md">
    <!-- Header -->
    <CardHeader class="flex flex-row items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
          <ChartBar class="h-7 w-7 text-info" />
        </div>
        <div>
          <CardTitle class="text-xl font-bold">调度统计</CardTitle>
          <p class="text-xs text-muted-foreground">Schedule Statistics Overview</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
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
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
          <Button variant="outline" size="sm" class="mt-2" @click="$emit('refresh')">
            重试
          </Button>
        </Alert>
      </div>

      <!-- Statistics Content -->
      <div v-else-if="statistics" class="space-y-6 max-h-[600px] overflow-y-auto">
        <!-- Overall Statistics -->
        <div>
          <h4 class="text-sm font-semibold mb-3">总体概览</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card class="bg-primary/10 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-primary">{{ statistics.totalTasks }}</div>
                <div class="text-xs text-muted-foreground">总任务数</div>
              </CardContent>
            </Card>
            <Card class="bg-green-50 dark:bg-green-950/20 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-green-600 dark:text-green-400">{{ statistics.activeTasks }}</div>
                <div class="text-xs text-muted-foreground">活跃任务</div>
              </CardContent>
            </Card>
            <Card class="bg-orange-50 dark:bg-orange-950/20 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">{{ statistics.pausedTasks }}</div>
                <div class="text-xs text-muted-foreground">暂停任务</div>
              </CardContent>
            </Card>
            <Card class="bg-red-50 dark:bg-red-950/20 hover:-translate-y-0.5 transition-transform">
              <CardContent class="text-center p-4">
                <div class="text-3xl font-bold text-red-600 dark:text-red-400">{{ statistics.failedTasks }}</div>
                <div class="text-xs text-muted-foreground">失败任务</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Execution Statistics -->
        <div>
          <h4 class="text-sm font-semibold mb-3">执行情况</h4>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <Card variant="outline">
              <CardContent class="text-center p-4">
                <div class="text-xl font-bold">{{ statistics.totalExecutions }}</div>
                <div class="text-xs text-muted-foreground">总执行次数</div>
              </CardContent>
            </Card>
            <Card variant="outline">
              <CardContent class="text-center p-4">
                <div class="text-xl font-bold text-green-600 dark:text-green-400">
                  {{ statistics.successfulExecutions }}
                </div>
                <div class="text-xs text-muted-foreground">成功次数</div>
              </CardContent>
            </Card>
            <Card variant="outline">
              <CardContent class="text-center p-4">
                <div class="text-xl font-bold text-red-600 dark:text-red-400">
                  {{ statistics.failedExecutions }}
                </div>
                <div class="text-xs text-muted-foreground">失败次数</div>
              </CardContent>
            </Card>
          </div>

          <!-- Success Rate -->
          <Card variant="outline">
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">成功率</span>
                <span class="text-lg font-bold text-green-600 dark:text-green-400">{{ successRate }}%</span>
              </div>
              <Progress :model-value="successRate" class="h-2" />
            </CardContent>
          </Card>
        </div>

        <!-- Module Statistics -->
        <div v-if="moduleStatistics">
          <h4 class="text-sm font-semibold mb-3">模块分布</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card
              v-for="(stats, moduleName) in moduleStatistics"
              :key="moduleName"
              variant="outline"
              class="hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <CardContent class="p-4">
                <div class="flex items-center gap-2 mb-3">
                  <component :is="getModuleIcon(moduleName as string)" :class="['h-8 w-8', getModuleColorClass(moduleName as string)]" />
                  <div>
                    <div class="text-sm font-semibold">
                      {{ getModuleName(moduleName as string) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ stats.totalTasks }} 个任务
                    </div>
                  </div>
                </div>

                <Separator class="my-2" />

                <div class="flex justify-between text-xs">
                  <span>活跃: {{ stats.activeTasks }}</span>
                  <span>执行: {{ stats.totalExecutions }}</span>
                  <span>成功率: {{ stats.successRateFormatted }}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <ChartBarBig class="h-20 w-20 text-muted-foreground mx-auto mb-4" />
        <p class="text-lg text-muted-foreground">暂无统计数据</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { Progress } from '../../ui/progress';
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
} from 'lucide-vue-next';
import { SourceModule } from '@dailyuse/contracts/schedule';

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
    reminder: '提醒模块',
    task: '任务模块',
    goal: '目标模块',
    notification: '通知模块',
  };
  return nameMap[module] || module;
}

function getModuleIcon(module: string): any {
  const iconMap: Record<string, any> = {
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
    task: 'text-green-600 dark:text-green-400',
    goal: 'text-orange-600 dark:text-orange-400',
    notification: 'text-blue-600 dark:text-blue-400',
  };
  return colorMap[module] || 'text-gray-600';
}
</script>
