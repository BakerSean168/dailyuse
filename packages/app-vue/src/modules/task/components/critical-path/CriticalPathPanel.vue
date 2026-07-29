<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock class="h-5 w-5 text-primary" />
        <CardTitle>{{ t('task.criticalPath.title') }}</CardTitle>
      </div>
      <Button size="sm" variant="ghost" @click="handleExport">
        <Download class="h-4 w-4 mr-2" />
        {{ t('task.criticalPath.export') }}
      </Button>
    </CardHeader>

    <CardContent v-if="!result">
      <Alert>
        <AlertDescription class="text-sm">{{
          t('task.criticalPath.addDepsHint')
        }}</AlertDescription>
      </Alert>
    </CardContent>

    <CardContent v-else>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-6 md:col-span-3">
          <Card class="bg-primary/10">
            <CardContent class="text-center py-4">
              <div class="text-3xl font-bold">{{ formatDuration(result.projectDuration) }}</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ t('task.criticalPath.estimatedDuration') }}
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="col-span-6 md:col-span-3">
          <Card class="bg-destructive/10">
            <CardContent class="text-center py-4">
              <div class="text-3xl font-bold">{{ result.criticalTasks.length }}</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ t('task.criticalPath.criticalTaskCount') }}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card class="mt-4">
        <CardHeader class="bg-destructive/5 pb-2">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-destructive" />
            <CardTitle class="text-base font-medium"
              >{{ t('task.criticalPath.tasks') }} ({{ result.criticalTasks.length }})</CardTitle
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
                    {{ t('task.criticalPath.durationLabel') }}
                    {{ formatDuration(task.estimatedMinutes || 0) }}
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
import type { TaskForDAG } from '../../types/task-dag.types';
import { useI18n } from 'vue-i18n';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Badge,
} from '@memoflow/ui-vue-shadcn';
import { Clock, Download, AlertTriangle } from '@lucide/vue';
import { formatTaskDuration } from '../../utils/format-task-duration';

interface CriticalPathResultViewModel {
  projectDuration: number;
  criticalPath: string[];
  criticalTasks: TaskForDAG[];
  suggestions: Array<{ type: string; description: string; priority: string; impact: number }>;
}

const props = defineProps<{
  result: CriticalPathResultViewModel | null;
  allTasks: TaskForDAG[];
}>();

const { t, locale } = useI18n();

const formatDuration = (minutes: number): string => formatTaskDuration(minutes, locale.value);

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
