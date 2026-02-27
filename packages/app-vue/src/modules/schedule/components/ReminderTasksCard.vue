<template>
  <Card class="h-full flex flex-col">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4">
      <div class="flex items-center">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 mr-3"
        >
          <Bell class="h-5 w-5" />
        </div>
        <div>
          <CardTitle class="text-lg font-bold">提醒模块任务</CardTitle>
          <p class="text-xs text-muted-foreground">Reminder Module Tasks</p>
        </div>
      </div>
      <Badge :variant="getStatusVariant()" class="font-medium"> {{ tasks.length }} 个任务 </Badge>
    </CardHeader>

    <Separator />

    <CardContent class="p-4 flex-1">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <Loader2 class="h-12 w-12 animate-spin text-blue-600" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="py-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </div>

      <!-- Task list -->
      <div v-else-if="tasks.length > 0" class="task-list max-h-[400px] overflow-y-auto">
        <ActionableWrapper
          v-for="task in tasks"
          :key="task.id"
          :actions="getTaskActions(task)"
          :show-more-button="true"
          dropdown-align="end"
          more-button-position="top-right"
        >
          <div
            class="flex items-center gap-3 py-3 border-b last:border-b-0"
            :class="{ 'opacity-70': task.status === 'Paused' }"
          >
            <component
              :is="getTaskStatusIcon(task.status)"
              :class="getTaskStatusColorClass(task.status)"
              class="h-5 w-5 shrink-0"
            />

            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm">{{ task.name }}</div>
              <div class="text-xs text-muted-foreground truncate">
                {{ task.description || '暂无描述' }}
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <Badge :variant="getBadgeVariant(task.status)" class="text-[10px] h-5">
                {{ getTaskStatusText(task.status) }}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="emit('view-detail', task.id)"
              >
                <Eye class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ActionableWrapper>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <Bell class="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <p class="text-sm text-muted-foreground">暂无提醒模块任务</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Badge, type BadgeVariants } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import {
  Bell,
  Loader2,
  AlertCircle,
  Eye,
  Pause,
  Play,
  Trash2,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-vue-next';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

interface Props {
  tasks: ScheduleTaskClientDTO[];
  isLoading?: boolean;
  error?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'pause-task': [taskId: string];
  'resume-task': [taskId: string];
  'delete-task': [taskId: string];
  'view-detail': [taskId: string];
}>();

function getTaskActions(task: ScheduleTaskClientDTO): MenuAction[] {
  const actions: MenuAction[] = [];

  if (task.status === 'Active') {
    actions.push({
      key: 'pause',
      label: menuLabel('pause'),
      icon: Pause,
      handler: () => emit('pause-task', task.id),
    });
  }

  if (task.status === 'Paused') {
    actions.push({
      key: 'resume',
      label: menuLabel('resume'),
      icon: Play,
      handler: () => emit('resume-task', task.id),
    });
  }

  actions.push({
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    handler: () => emit('delete-task', task.id),
  });

  return actions;
}

function getStatusVariant(): BadgeVariants['variant'] {
  const activeCount = props.tasks.filter((t) => t.status === 'Active').length;
  return activeCount === 0 ? 'secondary' : 'default';
}

function getTaskStatusColorClass(status: string): string {
  const colorMap: Record<string, string> = {
    Active: 'text-green-600',
    Paused: 'text-yellow-600',
    Completed: 'text-blue-600',
    Failed: 'text-red-600',
    Cancelled: 'text-gray-400',
  };
  return colorMap[status] || 'text-gray-400';
}

function getBadgeVariant(status: string): BadgeVariants['variant'] {
  if (status === 'Active') return 'default';
  if (status === 'Failed') return 'destructive';
  return 'secondary';
}

function getTaskStatusIcon(status: string) {
  const iconMap: Record<string, any> = {
    Active: PlayCircle,
    Paused: PauseCircle,
    Completed: CheckCircle,
    Failed: AlertCircle,
    Cancelled: XCircle,
  };
  return iconMap[status] || HelpCircle;
}

function getTaskStatusText(status: string): string {
  const textMap: Record<string, string> = {
    Active: '活跃',
    Paused: '暂停',
    Completed: '完成',
    Failed: '失败',
    Cancelled: '取消',
  };
  return textMap[status] || status;
}
</script>
