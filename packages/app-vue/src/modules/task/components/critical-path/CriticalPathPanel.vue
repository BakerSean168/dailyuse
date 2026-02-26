<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock class="h-5 w-5 text-primary" />
        <CardTitle>关键路径分析</CardTitle>
      </div>
      <Button size="sm" variant="ghost" @click="handleExport">
        <Download class="h-4 w-4 mr-2" />
        导出
      </Button>
    </CardHeader>

    <CardContent v-if="!result">
      <Alert>
        <AlertDescription class="text-sm">请添加任务依赖关系以计算关键路径。</AlertDescription>
      </Alert>
    </CardContent>

    <CardContent v-else>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-6 md:col-span-3">
          <Card class="bg-primary/10">
            <CardContent class="text-center py-4">
              <div class="text-3xl font-bold">{{ formatDuration(result.projectDuration) }}</div>
              <div class="text-xs text-muted-foreground mt-1">预计总工期</div>
            </CardContent>
          </Card>
        </div>

        <div class="col-span-6 md:col-span-3">
          <Card class="bg-destructive/10">
            <CardContent class="text-center py-4">
              <div class="text-3xl font-bold">{{ result.criticalTasks.length }}</div>
              <div class="text-xs text-muted-foreground mt-1">关键任务数</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card class="mt-4">
        <CardHeader class="bg-destructive/5 pb-2">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-destructive" />
            <CardTitle class="text-base font-medium"
              >关键路径任务 ({{ result.criticalTasks.length }})</CardTitle
            >
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <div class="space-y-0 divide-y">
            <div
              v-for="(task, index) in result.criticalTasks"
              :key="task.id"
              class="flex items-center gap-3 px-4 py-3"
            >
              <div
                class="flex items-center justify-center h-8 w-8 rounded-full bg-destructive text-destructive-foreground text-sm font-medium shrink-0"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium">{{ task.title }}</div>
                <div class="mt-1">
                  <Badge variant="default" class="text-xs">
                    工期: {{ formatDuration(task.estimatedMinutes || 0) }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { TaskForDAGViewModel } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Badge,
} from '@dailyuse/ui-vue-shadcn';
import { Clock, Download, AlertTriangle } from 'lucide-vue-next';

interface CriticalPathResultViewModel {
  projectDuration: number;
  criticalPath: string[];
  criticalTasks: TaskForDAGViewModel[];
  suggestions: Array<{ type: string; description: string; priority: string; impact: number }>;
}

interface Props {
  result: CriticalPathResultViewModel | null;
  allTasks: TaskForDAGViewModel[];
}

const props = defineProps<Props>();

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
};

const handleExport = () => {
  if (!props.result) return;
  const report = {
    ...props.result,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `critical-path-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>
