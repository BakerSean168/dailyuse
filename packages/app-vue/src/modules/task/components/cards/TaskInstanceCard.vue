<template>
  <div
    :class="[
      'flex items-center gap-3 p-4 min-h-[64px] transition-all duration-200 hover:bg-muted/50 group',
      { 'border-b border-border': showBorder, 'opacity-60': isCompleted },
    ]"
  >
    <!-- Completion Checkbox/Button -->
    <Button
      variant="ghost"
      size="icon"
      class="h-5 w-5 shrink-0 rounded-full p-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
      @click="toggleComplete"
    >
      <CheckCircle2 v-if="isCompleted" class="h-5 w-5 text-primary" />
      <Circle v-else class="h-5 w-5" />
    </Button>

    <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
      <!-- Title -->
      <h3
        :class="[
          'text-sm font-medium leading-normal truncate transition-colors',
          { 'line-through text-muted-foreground': isCompleted, 'text-foreground': !isCompleted },
        ]"
      >
        {{ taskTitle }}
      </h3>

      <!-- Metadata -->
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <component :is="isCompleted ? Check : Clock" class="h-3 w-3" />
        <span v-if="!isCompleted">{{ timeLabel }}</span>
        <span v-else>Completed at {{ formatCompletionTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { CheckCircle2, Circle, Clock, Check } from 'lucide-vue-next';
import type { TaskInstanceViewModel } from '../types';

// Props
interface Props {
  task: TaskInstanceViewModel;
  showBorder?: boolean;
  goalStore?: any;
}

const props = withDefaults(defineProps<Props>(), {
  showBorder: true,
});

// Emits
const emit = defineEmits<{
  complete: [id: string];
}>();

// Store - TODO: Connect to new domain model
// const taskStore = useTaskStore();

// Computed
const isCompleted = computed(() => props.task.isCompleted);

const taskTitle = computed(() => {
  return props.task.templateTitle ?? '未知任务';
});

const formatCompletionTime = computed(() => {
  return props.task.actualEndTime ? format(new Date(props.task.actualEndTime), 'HH:mm') : '';
});

const timeLabel = computed(() => {
  const timeConfig = props.task.timeConfig;

  if (timeConfig?.timeType === 'ALL_DAY') {
    return 'All Day';
  }

  if (timeConfig?.timeType === 'TIME_POINT' && timeConfig.timePoint !== null) {
    const hours = Math.floor(timeConfig.timePoint / 60);
    const minutes = timeConfig.timePoint % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  if (timeConfig?.timeType === 'TIME_RANGE' && timeConfig.timeRange) {
    const startHours = Math.floor(timeConfig.timeRange.start / 60);
    const startMinutes = timeConfig.timeRange.start % 60;
    const endHours = Math.floor(timeConfig.timeRange.end / 60);
    const endMinutes = timeConfig.timeRange.end % 60;

    return `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')} - ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  return 'All Day';
});

const toggleComplete = () => {
  emit('complete', props.task.id);
};
</script>
