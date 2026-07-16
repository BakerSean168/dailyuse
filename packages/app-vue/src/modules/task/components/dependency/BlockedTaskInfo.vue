<template>
  <Card v-if="blockingTasks.length > 0" class="my-3 border">
    <CardHeader class="bg-destructive/5 p-3">
      <CardTitle class="text-base flex items-center">
        <Lock class="h-5 w-5 text-destructive mr-2" />
        {{ t('task.blocked.title') }}
      </CardTitle>
    </CardHeader>

    <CardContent class="p-3">
      <p class="text-sm mb-3">
        {{ t('task.blocked.waitingMessage', { count: blockingTasks.length }) }}
      </p>

      <div class="divide-y">
        <div v-for="task in blockingTasks" :key="task.id" class="flex items-start gap-3 py-2">
          <component
            :is="getStatusIconComponent(task.status)"
            class="h-4 w-4 mt-0.5 shrink-0"
            :class="getStatusColorClass(task.status)"
          />

          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">
              {{ task.title }}
            </div>
            <div class="flex items-center gap-2 mt-1">
              <Badge :class="getStatusBadgeClass(task.status)" class="text-xs">
                {{ task.status }}
              </Badge>
              <span v-if="task.estimatedMinutes" class="text-xs text-muted-foreground">
                {{ t('task.blocked.estimate') }} {{ formatDuration(task.estimatedMinutes) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="mt-3">
        <div class="flex justify-between text-xs mb-1">
          <span>{{ t('task.blocked.completionProgress') }}</span>
          <span>{{ completedCount }} / {{ totalCount }}</span>
        </div>
        <Progress :model-value="progressPercentage" class="h-2" />
      </div>
    </CardContent>
  </Card>

  <Card v-else class="my-3 border">
    <CardContent class="p-3 flex items-center">
      <CheckCircle class="h-5 w-5 text-success mr-2" />
      <div>
        <div class="font-medium">{{ t('task.blocked.ready') }}</div>
        <div class="text-xs text-muted-foreground">{{ t('task.blocked.readyMessage') }}</div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '@dailyuse/ui-vue-shadcn';
import { Lock, CheckCircle, Clock, Ban, PlayCircle, HelpCircle, Loader2 } from '@lucide/vue';
import { formatTaskDuration } from '../../utils/format-task-duration';

interface BlockingTask {
  id: string;
  title: string;
  status: string;
  estimatedMinutes?: number | null;
}

const props = defineProps<{
  blockingTasks: BlockingTask[];
  totalPredecessors: number;
}>();

const { t, locale } = useI18n();

const completedCount = computed(() => {
  return props.totalPredecessors - props.blockingTasks.length;
});

const totalCount = computed(() => {
  return props.totalPredecessors;
});

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 100;
  return (completedCount.value / totalCount.value) * 100;
});

const getStatusColorClass = (status: string): string => {
  const colors: Record<string, string> = {
    COMPLETED: 'text-success',
    IN_PROGRESS: 'text-primary',
    READY: 'text-info',
    BLOCKED: 'text-destructive',
    PENDING: 'text-muted-foreground',
    CANCELLED: 'text-muted-foreground',
  };
  return colors[status] || 'text-muted-foreground';
};

const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    COMPLETED: 'bg-success/15 text-success',
    IN_PROGRESS: 'bg-primary/10 text-primary',
    READY: 'bg-info/15 text-info',
    BLOCKED: 'bg-destructive/10 text-destructive',
    PENDING: 'bg-muted text-muted-foreground',
    CANCELLED: 'bg-muted text-muted-foreground',
  };
  return classes[status] || 'bg-muted text-muted-foreground';
};

const getStatusIconComponent = (status: string): Component => {
  const icons: Record<string, Component> = {
    COMPLETED: CheckCircle,
    IN_PROGRESS: Loader2,
    READY: PlayCircle,
    BLOCKED: Lock,
    PENDING: Clock,
    CANCELLED: Ban,
  };
  return icons[status] || HelpCircle;
};

const formatDuration = (minutes: number): string => formatTaskDuration(minutes, locale.value);
</script>
