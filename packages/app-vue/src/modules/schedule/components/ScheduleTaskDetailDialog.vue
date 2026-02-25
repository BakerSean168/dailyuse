<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <CalendarClock class="h-6 w-6" />
          <div>
            <h2 class="text-xl font-bold">任务详情</h2>
            <p class="text-sm text-muted-foreground">Schedule Task Details</p>
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
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div>
              <p class="text-sm text-muted-foreground">任务名称</p>
              <p class="font-medium">{{ task.name }}</p>
            </div>
            <div v-if="task.description">
              <p class="text-sm text-muted-foreground">描述</p>
              <p>{{ task.description }}</p>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-sm text-muted-foreground mb-1">来源模块</p>
                <Badge>{{ task.sourceModule }}</Badge>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-1">任务状态</p>
                <Badge :variant="task.status === 'active' ? 'default' : 'secondary'">
                  {{ task.status }}
                </Badge>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-1">启用状态</p>
                <Badge :variant="task.enabled ? 'default' : 'destructive'">
                  {{ task.enabled ? '已启用' : '已禁用' }}
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
              执行信息
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">执行次数</p>
                <p class="font-medium">{{ task.execution.executionCount }} 次</p>
              </div>
              <div v-if="task.execution.nextRunAt">
                <p class="text-sm text-muted-foreground">下次执行</p>
                <p>{{ formatDateTime(task.execution.nextRunAt) }}</p>
              </div>
              <div v-if="task.execution.lastRunAt">
                <p class="text-sm text-muted-foreground">上次执行</p>
                <p>{{ formatDateTime(task.execution.lastRunAt) }}</p>
              </div>
              <div v-if="task.execution.consecutiveFailures > 0">
                <p class="text-sm text-muted-foreground">连续失败</p>
                <Badge variant="destructive">{{ task.execution.consecutiveFailures }} 次</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Schedule Config -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-5 w-5" />
              调度配置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-muted-foreground mb-1">Cron 表达式</p>
                <p class="font-mono text-sm">{{ task.schedule.cronExpression }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-1">时区</p>
                <p>{{ task.schedule.timezone }}</p>
              </div>
              <div v-if="task.schedule.startDate">
                <p class="text-sm text-muted-foreground mb-1">开始日期</p>
                <p>{{ formatDate(task.schedule.startDate) }}</p>
              </div>
              <div v-if="task.schedule.endDate">
                <p class="text-sm text-muted-foreground mb-1">结束日期</p>
                <p>{{ formatDate(task.schedule.endDate) }}</p>
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
                执行历史
              </CardTitle>
              <Button variant="outline" size="sm" @click="$emit('refresh-executions')" :disabled="loadingHistory">
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
              <p>暂无执行记录</p>
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
                      'bg-green-500': execution.status === 'success',
                      'bg-red-500': execution.status === 'failed',
                      'bg-yellow-500': execution.status === 'timeout',
                      'bg-gray-500': execution.status === 'pending',
                    }"
                  />
                  <div>
                    <p class="text-sm font-medium">{{ formatDateTime(execution.executionTime) }}</p>
                    <p v-if="execution.duration" class="text-xs text-muted-foreground">
                      耗时: {{ execution.duration }}ms
                    </p>
                    <p v-if="execution.error" class="text-xs text-destructive">{{ execution.error }}</p>
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
        <Button variant="outline" @click="$emit('update:show', false)">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@dailyuse/ui-vue-shadcn';
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
} from 'lucide-vue-next';

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

function formatDateTime(timestamp: number | string | null | undefined): string {
  if (!timestamp) return 'N/A';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return new Date(time).toLocaleString('zh-CN');
}

function formatDate(timestamp: number | string | null | undefined): string {
  if (!timestamp) return 'N/A';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return new Date(time).toLocaleDateString('zh-CN');
}
</script>
