<template>
  <Card class="h-full flex flex-col">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4">
      <div class="flex items-center">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg mr-3"
          :class="colorClasses"
        >
          <component :is="icon" class="h-5 w-5" />
        </div>
        <div>
          <CardTitle class="text-lg font-bold">{{ t(titleKey) }}</CardTitle>
          <p class="text-xs text-muted-foreground">{{ t(subtitleKey) }}</p>
        </div>
      </div>
      <Badge :variant="getStatusVariant()" class="font-medium">
        {{ t('schedule.taskCard.taskCount', { n: tasks.length }) }}
      </Badge>
    </CardHeader>

    <Separator />

    <CardContent class="p-4 flex-1">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <Loader2 class="h-12 w-12 animate-spin" :class="spinnerColorClass" />
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
                {{ task.description || t('schedule.taskCard.noDescription') }}
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <Badge :variant="getBadgeVariant(task.status)" class="text-[10px] h-5">
                {{ getTaskStatusText(task.status) }}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                :aria-label="t('menu.viewDetails')"
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
        <component :is="icon" class="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <p class="text-sm text-muted-foreground">{{ t(emptyTitleKey) }}</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Badge, type BadgeVariants } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import {
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
} from '@lucide/vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

type ColorScheme = 'success' | 'warning' | 'info' | 'destructive';

const COLOR_CLASSES: Record<ColorScheme, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/15 text-info',
  destructive: 'bg-destructive/15 text-destructive',
};

const SPINNER_CLASSES: Record<ColorScheme, string> = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
};

const { t } = useI18n();

interface Props {
  tasks: ScheduleTaskClientDTO[];
  isLoading?: boolean;
  error?: string | null;
  icon: Component;
  colorScheme: ColorScheme;
  titleKey: string;
  subtitleKey: string;
  emptyTitleKey: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'pause-task': [taskId: string];
  'resume-task': [taskId: string];
  'delete-task': [taskId: string];
  'view-detail': [taskId: string];
}>();

const colorClasses = computed(() => COLOR_CLASSES[props.colorScheme]);
const spinnerColorClass = computed(() => SPINNER_CLASSES[props.colorScheme]);

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
    Active: 'text-success',
    Paused: 'text-warning',
    Completed: 'text-info',
    Failed: 'text-destructive',
    Cancelled: 'text-muted-foreground',
  };
  return colorMap[status] || 'text-muted-foreground';
}

function getBadgeVariant(status: string): BadgeVariants['variant'] {
  if (status === 'Active') return 'default';
  if (status === 'Failed') return 'destructive';
  return 'secondary';
}

function getTaskStatusIcon(status: string) {
  const iconMap: Record<string, unknown> = {
    Active: PlayCircle,
    Paused: PauseCircle,
    Completed: CheckCircle,
    Failed: AlertCircle,
    Cancelled: XCircle,
  };
  return iconMap[status] || HelpCircle;
}

function getTaskStatusText(status: string): string {
  const keyMap: Record<string, string> = {
    Active: 'schedule.taskStatus.active',
    Paused: 'schedule.taskStatus.paused',
    Completed: 'schedule.taskStatus.completed',
    Failed: 'schedule.taskStatus.failed',
    Cancelled: 'schedule.taskStatus.cancelled',
  };
  return keyMap[status] ? t(keyMap[status]) : status;
}
</script>
