<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <CalendarClock class="h-6 w-6" />
          <div>
            <h2 class="text-xl font-bold">{{ t('schedule.detailDialog.title') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('schedule.detailDialog.subtitle') }}</p>
          </div>
        </DialogTitle>
      </DialogHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <Loader2 class="h-12 w-12 animate-spin text-primary" />
      </div>

      <!-- Error -->
      <Alert v-else-if="error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- Task Details -->
      <div v-else-if="task" class="space-y-6">
        <!-- Basic Info -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Info class="h-5 w-5" />
              {{ t('schedule.detailDialog.basicInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div>
              <p class="text-sm text-muted-foreground">{{ t('schedule.detailDialog.taskName') }}</p>
              <p class="font-medium">{{ task.name }}</p>
            </div>
            <div v-if="task.description">
              <p class="text-sm text-muted-foreground">
                {{ t('schedule.detailDialog.description') }}
              </p>
              <p>{{ task.description }}</p>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.sourceModule') }}
                </p>
                <Badge>{{ task.sourceModule }}</Badge>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.taskStatus') }}
                </p>
                <Badge :variant="task.status === 'active' ? 'default' : 'secondary'">
                  {{ task.status }}
                </Badge>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.enabledStatus') }}
                </p>
                <Badge :variant="task.enabled ? 'default' : 'destructive'">
                  {{
                    task.enabled
                      ? t('schedule.detailDialog.enabled')
                      : t('schedule.detailDialog.disabled')
                  }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Execution Info -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              {{ t('schedule.detailDialog.executionInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">
                  {{ t('schedule.detailDialog.executionCount') }}
                </p>
                <p class="font-medium">
                  {{
                    t('schedule.detailDialog.executionCountValue', {
                      n: task.execution.executionCount,
                    })
                  }}
                </p>
              </div>
              <div v-if="task.execution.nextRunAt">
                <p class="text-sm text-muted-foreground">
                  {{ t('schedule.detailDialog.nextExecution') }}
                </p>
                <p>{{ formatScheduleDateTime(task.execution.nextRunAt) }}</p>
              </div>
              <div v-if="task.execution.lastRunAt">
                <p class="text-sm text-muted-foreground">
                  {{ t('schedule.detailDialog.lastExecution') }}
                </p>
                <p>{{ formatScheduleDateTime(task.execution.lastRunAt) }}</p>
              </div>
              <div v-if="task.execution.consecutiveFailures > 0">
                <p class="text-sm text-muted-foreground">
                  {{ t('schedule.detailDialog.consecutiveFailures') }}
                </p>
                <Badge variant="destructive">{{
                  t('schedule.detailDialog.consecutiveFailuresValue', {
                    n: task.execution.consecutiveFailures,
                  })
                }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Schedule Config -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-5 w-5" />
              {{ t('schedule.detailDialog.scheduleConfig') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 @2xl/panel:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.cronExpression') }}
                </p>
                <p class="font-mono text-sm">{{ task.schedule.cronExpression }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.timezone') }}
                </p>
                <p>{{ task.schedule.timezone }}</p>
              </div>
              <div v-if="task.schedule.startDate">
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.startDate') }}
                </p>
                <p>{{ formatScheduleDate(task.schedule.startDate) }}</p>
              </div>
              <div v-if="task.schedule.endDate">
                <p class="text-sm text-muted-foreground mb-1">
                  {{ t('schedule.detailDialog.endDate') }}
                </p>
                <p>{{ formatScheduleDate(task.schedule.endDate) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Execution History -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center gap-2">
                <History class="h-5 w-5" />
                {{ t('schedule.detailDialog.executionHistory') }}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                @click="$emit('refresh-executions')"
                :disabled="loadingHistory"
              >
                <Loader2 v-if="loadingHistory" class="h-4 w-4 animate-spin" />
                <RefreshCw v-else class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loadingHistory" class="flex justify-center py-8">
              <Loader2 class="h-8 w-8 animate-spin" />
            </div>
            <div v-else-if="executions.length === 0" class="text-center py-8 text-muted-foreground">
              <CalendarOff class="mx-auto h-12 w-12 mb-2" />
              <p>{{ t('schedule.detailDialog.noExecutionRecords') }}</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="execution in executions"
                :key="execution.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-success': execution.status === 'success',
                      'bg-destructive': execution.status === 'failed',
                      'bg-warning': execution.status === 'timeout',
                      'bg-muted-foreground': execution.status === 'pending',
                    }"
                  />
                  <div>
                    <p class="text-sm font-medium">{{ formatScheduleDateTime(execution.executionTime) }}</p>
                    <p v-if="execution.duration" class="text-xs text-muted-foreground">
                      {{ t('schedule.detailDialog.executionDuration', { n: execution.duration }) }}
                    </p>
                    <p v-if="execution.error" class="text-xs text-destructive">
                      {{ execution.error }}
                    </p>
                  </div>
                </div>
                <Badge :variant="execution.status === 'success' ? 'default' : 'destructive'">
                  {{ execution.status }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:show', false)">{{
          t('common.close')
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import {
  CalendarClock,
  Info,
  Clock,
  Settings,
  History,
  RefreshCw,
  Loader2,
  AlertCircle,
  CalendarOff,
} from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { emptyKind, formatProductDate, formatProductDateTime } from '../../../shared/utils/product-time';

interface ScheduleTask {
  id: string;
  name: string;
  description?: string | null;
  sourceModule: string;
  status: string;
  enabled: boolean;
  execution: {
    executionCount: number;
    nextRunAt?: number;
    lastRunAt?: number;
    lastExecutionStatus?: string;
    consecutiveFailures: number;
  };
  schedule: {
    cronExpression: string;
    timezone: string;
    startDate?: number;
    endDate?: number;
  };
  [key: string]: unknown;
}

interface Execution {
  id: string;
  executionTime: number;
  status: string;
  duration?: number;
  error?: string;
}

interface Props {
  show: boolean;
  task?: ScheduleTask | null;
  executions?: Execution[];
  loading?: boolean;
  loadingHistory?: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'refresh-executions'): void;
}

withDefaults(defineProps<Props>(), {
  task: null,
  executions: () => [],
  loading: false,
  loadingHistory: false,
  error: null,
});

defineEmits<Emits>();

const { t } = useI18n();

function formatScheduleDateTime(timestamp: number | string | null | undefined): string {
  return formatProductDateTime(timestamp, emptyKind('na'));
}

function formatScheduleDate(timestamp: number | string | null | undefined): string {
  return formatProductDate(timestamp, emptyKind('na'));
}
</script>
