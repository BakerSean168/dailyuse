<template>
  <div
    :class="[
      'flex gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50 border-b last:border-b-0',
      !notification.isRead && 'bg-blue-50 dark:bg-blue-950/20'
    ]"
    @click="$emit('click', notification)"
  >
    <!-- Icon -->
    <div 
      :class="[
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        typeColorClass
      ]"
    >
      <component :is="typeIcon" class="h-5 w-5 text-white" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span :class="['text-sm', !notification.isRead && 'font-semibold']">
          {{ notification.title }}
        </span>
        <Badge
          v-if="notification.importance === ImportanceLevel.Vital || notification.importance === ImportanceLevel.Important"
          :variant="priorityVariant"
          class="text-xs"
        >
          {{ priorityText }}
        </Badge>
      </div>

      <p class="text-sm text-muted-foreground line-clamp-2">
        {{ notification.content }}
      </p>

      <p class="text-xs text-muted-foreground mt-1">
        {{ timeDisplay }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-1 shrink-0">
      <Tooltip v-if="!notification.isRead">
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            @click.stop="$emit('mark-read', notification.id)"
          >
            <Check class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>标记已读</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-destructive hover:text-destructive"
            @click.stop="$emit('delete', notification.id)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>删除</TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Tooltip, TooltipTrigger, TooltipContent } from '@dailyuse/ui-vue-shadcn';
import {
  Info,
  CheckCircle2,
  Target,
  BellRing,
  CalendarClock,
  Bell,
  Check,
  Trash2,
} from 'lucide-vue-next';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

interface Props {
  notification: NotificationClientDTO;
}

const props = defineProps<Props>();

defineEmits<{
  click: [notification: NotificationClientDTO];
  'mark-read': [id: string];
  delete: [id: string];
}>();

const typeIconMap: Record<string, any> = {
  SYSTEM: Info,
  TASK: CheckCircle2,
  GOAL: Target,
  REMINDER: BellRing,
  SCHEDULE: CalendarClock,
};

const typeColorClassMap: Record<string, string> = {
  SYSTEM: 'bg-blue-500',
  TASK: 'bg-green-500',
  GOAL: 'bg-orange-500',
  REMINDER: 'bg-purple-500',
  SCHEDULE: 'bg-cyan-500',
};

const typeIcon = computed(() => typeIconMap[props.notification.type] || Bell);
const typeColorClass = computed(() => typeColorClassMap[props.notification.type] || 'bg-gray-500');

const priorityVariant = computed(() => {
  switch (props.notification.importance) {
    case ImportanceLevel.Vital:
    case ImportanceLevel.Important:
      return 'destructive';
    case ImportanceLevel.Moderate:
      return 'secondary';
    default:
      return 'outline';
  }
});

const priorityText = computed(() => {
  switch (props.notification.importance) {
    case ImportanceLevel.Vital:
      return '紧急';
    case ImportanceLevel.Important:
      return '重要';
    default:
      return '';
  }
});

const timeDisplay = computed(() => {
  try {
    return formatDistanceToNow(new Date(props.notification.createdAt), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch {
    return props.notification.createdAt;
  }
});
</script>
