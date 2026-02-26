<template>
  <Card v-if="blockingTasks.length > 0" class="my-3 border">
    <CardHeader class="bg-destructive/5 p-3">
      <CardTitle class="text-base flex items-center">
        <Lock class="h-5 w-5 text-destructive mr-2" />
        任务被阻塞
      </CardTitle>
    </CardHeader>

    <CardContent class="p-3">
      <p class="text-sm mb-3">此任务正在等待以下 {{ blockingTasks.length }} 个前置任务完成：</p>

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
                预估: {{ formatDuration(task.estimatedMinutes) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="mt-3">
        <div class="flex justify-between text-xs mb-1">
          <span>完成进度</span>
          <span>{{ completedCount }} / {{ totalCount }}</span>
        </div>
        <Progress :model-value="progressPercentage" class="h-2" />
      </div>
    </CardContent>
  </Card>

  <Card v-else class="my-3 border">
    <CardContent class="p-3 flex items-center">
      <CheckCircle class="h-5 w-5 text-green-500 mr-2" />
      <div>
        <div class="font-medium">任务已就绪</div>
        <div class="text-xs text-muted-foreground">所有前置任务已完成，可以开始执行</div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '@dailyuse/ui-vue-shadcn';
import { Lock, CheckCircle, Clock, Ban, PlayCircle, HelpCircle, Loader2 } from 'lucide-vue-next';

interface BlockingTask {
  id: string;
  title: string;
  status: string;
  estimatedMinutes?: number | null;
}

interface Props {
  blockingTasks: BlockingTask[];
  totalPredecessors: number;
}

const props = defineProps<Props>();

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
    COMPLETED: 'text-green-500',
    IN_PROGRESS: 'text-primary',
    READY: 'text-blue-500',
    BLOCKED: 'text-destructive',
    PENDING: 'text-muted-foreground',
    CANCELLED: 'text-muted-foreground',
  };
  return colors[status] || 'text-muted-foreground';
};

const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-primary/10 text-primary',
    READY: 'bg-blue-100 text-blue-800',
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

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};
</script>
