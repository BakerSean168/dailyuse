<template>
  <ActionableWrapper :actions="menuActions">
    <Card
      class="template-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      :class="`priority-${getPriorityLevel(template.priority ?? 0)}`"
      @click="handleCardClick"
    >
      <!-- 卡片头部 -->
      <CardHeader class="template-header border-b border-border/10 p-4 pb-3">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-2 flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <!-- Priority Indicator Icon - Story 2.4 -->
              <div
                v-if="(template.priority ?? 0) >= 80"
                class="priority-indicator flex items-center shrink-0"
              >
                <component
                  :is="getIndicatorIconComponent(template.priority ?? 0)"
                  :class="[getIndicatorClass(template.priority ?? 0), 'h-5 w-5']"
                  :style="{ color: getIndicatorColor(template.priority ?? 0) }"
                />
              </div>

              <CardTitle class="text-lg font-semibold line-clamp-1 min-h-[1.75rem]">{{
                template.title
              }}</CardTitle>
            </div>

            <div class="flex flex-wrap gap-2 items-center">
              <Badge
                :variant="template.isActive ? 'default' : 'secondary'"
                :class="getTemplateStatusBadgeClass(template)"
                class="text-xs"
              >
                <component :is="getTemplateStatusIconComponent(template)" class="h-3 w-3 mr-1" />
                {{ getTemplateStatusText(template) }}
              </Badge>
              <Badge
                variant="outline"
                :class="getImportanceBadgeClass(template.importance)"
                class="text-xs"
              >
                <Flag class="h-3 w-3 mr-1" />
                {{ template.importanceText }}
              </Badge>
              <!-- Priority Score Chip - Story 2.4 -->
              <Badge :class="getPriorityBadgeClass(template.priority ?? 0)" class="text-xs">
                <Flame class="h-3 w-3 mr-1" />
                {{ Math.round(template.priority ?? 0) }}/100
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <!-- 卡片内容 -->
      <CardContent class="p-4">
        <!-- 描述 -->
        <p class="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 min-h-[2.625rem]">
          {{ template.description || t('task.templateCard.noDescription') }}
        </p>

        <!-- 元信息 -->
        <div class="flex flex-col gap-3">
          <!-- 日期范围 -->
          <div class="flex items-center gap-2">
            <Calendar class="h-4 w-4 shrink-0 text-primary" />
            <span class="text-sm text-muted-foreground">
              {{ t('task.templateCard.startsAt') }}
              {{ format(template.timeConfig.startDate || Date.now(), 'yyyy-MM-dd') }}
            </span>
          </div>

          <!-- 时间范围 -->
          <div class="flex items-center gap-2">
            <Clock class="h-4 w-4 shrink-0 text-blue-500" />
            <span class="text-sm text-muted-foreground">
              {{ timeLabel }}
            </span>
          </div>

          <!-- 重复模式 -->
          <div class="flex items-center gap-2">
            <RefreshCw class="h-4 w-4 shrink-0 text-green-500" />
            <span class="text-sm text-muted-foreground">
              {{ template.recurrenceText }}
            </span>
          </div>

          <!-- 分类和标签 -->
          <div class="flex items-center gap-2">
            <Tag class="h-4 w-4 shrink-0 text-purple-500" />
            <span class="text-sm text-muted-foreground">
              <span v-if="template.tags && template.tags.length > 0" class="italic opacity-70">
                · {{ template.tags.slice(0, 2).join(', ') }}
                <span v-if="template.tags.length > 2">{{
                  t('task.templateCard.moreTagsSuffix')
                }}</span>
              </span>
            </span>
          </div>

          <!-- 关联目标 -->
          <div v-if="template.goalBinding" class="flex items-center gap-2">
            <Target class="h-4 w-4 shrink-0 text-yellow-500" />
            <span class="text-sm text-muted-foreground">
              {{ t('task.templateCard.linkedGoal') }}
            </span>
          </div>
        </div>

        <!-- 关键结果标签 -->
        <div v-if="template.goalBinding" class="flex flex-wrap gap-1 mt-3">
          <Badge variant="outline" class="text-xs text-primary border-primary">
            <Target class="h-3 w-3 mr-1" />
            {{ getGoalBindingName(template.goalBinding) }}
          </Badge>
        </div>

        <!-- 统计信息 -->
        <div v-if="(template.instanceCount ?? 0) > 0" class="mt-3 rounded-lg bg-muted/30 p-3">
          <Separator class="mb-2" />
          <div class="flex justify-between gap-4 flex-wrap">
            <div class="flex flex-col items-center min-w-[60px]">
              <span class="text-xs text-muted-foreground mb-1">{{
                t('task.templateCard.totalCount')
              }}</span>
              <span class="text-sm font-semibold text-primary">{{ template.instanceCount }}</span>
            </div>
            <div class="flex flex-col items-center min-w-[60px]">
              <span class="text-xs text-muted-foreground mb-1">{{
                t('task.templateCard.completionRate')
              }}</span>
              <span class="text-sm font-semibold text-primary"
                >{{ Math.round((template.completionRate ?? 0) * 100) }}%</span
              >
            </div>
          </div>
        </div>
      </CardContent>

      <!-- 卡片底部操作 -->
      <CardFooter class="px-4 py-3 border-t border-border/10 bg-muted/30 flex items-center">
        <Button
          v-if="template.isActive"
          data-testid="task-card-pause-button"
          variant="outline"
          size="sm"
          @click.stop="handlePauseTemplate"
        >
          <Pause class="h-4 w-4 mr-1" />
          {{ t('task.templateCard.pause') }}
        </Button>
        <Button
          v-else-if="template.isPaused"
          data-testid="task-card-resume-button"
          variant="outline"
          size="sm"
          class="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          @click.stop="handleResume"
        >
          <Play class="h-4 w-4 mr-1" />
          {{ t('task.templateCard.resume') }}
        </Button>
        <Button
          v-else-if="template.status === 'ARCHIVED'"
          data-testid="task-card-activate-button"
          variant="outline"
          size="sm"
          class="border-blue-500 text-blue-600 hover:bg-blue-50"
          @click.stop="handleActivateTemplate"
        >
          <Play class="h-4 w-4 mr-1" />
          {{ t('task.templateCard.activate') }}
        </Button>

        <Separator orientation="vertical" class="mx-2 h-6" />

        <div class="flex flex-col items-end ml-auto">
          <span class="text-xs text-muted-foreground">
            {{ t('task.templateCard.createdAt') }} {{ template.formattedCreatedAt }}
          </span>
        </div>
      </CardFooter>
    </Card>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { TaskTemplateViewModel, TaskGoalBindingViewModel } from '../types';
import { ActionableWrapper, menuLabel } from '../../../../components/shared';
import type { MenuAction } from '../../../../components/shared';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Separator,
} from '@dailyuse/ui-vue-shadcn';
import {
  Pencil,
  Trash2,
  Flag,
  Flame,
  Calendar,
  Clock,
  RefreshCw,
  Tag,
  Target,
  Pause,
  Play,
  Zap,
  ArrowUp,
  Pin,
  PlayCircle,
  PauseCircle,
  Archive,
  Circle,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    template: TaskTemplateViewModel;
    statusFilters?: Array<{
      label: string;
      value: string;
      icon: string;
    }>;
    onDelete?: (template: TaskTemplateViewModel) => void | Promise<void>;
    onPause?: (template: TaskTemplateViewModel) => void | Promise<void>;
    onActivate?: (template: TaskTemplateViewModel) => void | Promise<void>;
    resolveGoalBindingName?: (
      binding: TaskGoalBindingViewModel,
      template: TaskTemplateViewModel,
    ) => string;
  }>(),
  {
    statusFilters: () => [
      { label: 'active', value: 'active', icon: 'mdi-play-circle' },
      { label: 'draft', value: 'draft', icon: 'mdi-file-document-outline' },
      { label: 'paused', value: 'paused', icon: 'mdi-pause-circle' },
      { label: 'archived', value: 'archived', icon: 'mdi-archive' },
    ],
  },
);

const emit = defineEmits<{
  click: [templateId: string];
  edit: [templateId: string];
  delete: [template: TaskTemplateViewModel];
  pause: [template: TaskTemplateViewModel];
  resume: [template: TaskTemplateViewModel];
  activate: [template: TaskTemplateViewModel];
}>();

// --- ActionableWrapper menu actions ---
const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'edit',
    label: menuLabel('edit'),
    icon: Pencil,
    handler: handleEdit,
  },
  {
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: handleDelete,
  },
]);

// 状态相关方法
const getTemplateStatusBadgeClass = (template: TaskTemplateViewModel) => {
  if (template.isActive) return 'bg-green-100 text-green-800 border-green-200';
  if (template.isPaused) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (template.isArchived) return 'bg-gray-100 text-gray-800 border-gray-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

const getTemplateStatusIconComponent = (template: TaskTemplateViewModel) => {
  const statusMap: Record<string, any> = {
    ACTIVE: PlayCircle,
    PAUSED: PauseCircle,
    ARCHIVED: Archive,
    DELETED: Trash2,
  };
  return statusMap[template.status] || Circle;
};

const getTemplateStatusText = (template: TaskTemplateViewModel) => {
  return template.statusText || template.status;
};

const getImportanceBadgeClass = (importance: string | undefined) => {
  switch (importance) {
    case ImportanceLevel.Trivial:
      return 'border-gray-300 text-gray-600';
    case ImportanceLevel.Minor:
      return 'border-green-400 text-green-700';
    case ImportanceLevel.Moderate:
      return 'border-blue-400 text-blue-700';
    case ImportanceLevel.Important:
      return 'border-yellow-400 text-yellow-700';
    case ImportanceLevel.Vital:
      return 'border-red-400 text-red-700';
    default:
      return 'border-gray-300 text-gray-600';
  }
};

/**
 * Story 2.4: Priority Visualization Functions
 * ============================================
 * Returns priority level classification: 'high' | 'medium' | 'low'
 * High (>=80): Red background/border - demands immediate attention
 * Medium (60-79): Amber background/border - notable but not urgent
 * Low (<60): Gray background/border - normal priority
 */
const getPriorityLevel = (priority: number): string => {
  if (priority >= 80) return 'high';
  if (priority >= 60) return 'medium';
  return 'low';
};

/**
 * Returns Tailwind classes for priority badge
 */
const getPriorityBadgeClass = (priority: number): string => {
  if (priority >= 80) return 'bg-red-100 text-red-800 border-red-200';
  if (priority >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Returns Lucide icon component for priority indicator
 * 90+: Zap (flash) - critical/on fire
 * 80-89: ArrowUp - important
 */
const getIndicatorIconComponent = (priority: number) => {
  if (priority >= 90) return Zap;
  if (priority >= 80) return ArrowUp;
  return Pin;
};

/**
 * Returns color for priority indicator icon
 */
const getIndicatorColor = (priority: number): string => {
  if (priority >= 90) return '#DC2626'; // red-600
  if (priority >= 80) return '#DC2626'; // red-600
  return '#F59E0B'; // amber-500
};

/**
 * Returns CSS animation class for priority indicator
 * Faster pulse for critical (>=90), subtle pulse for high (80-89)
 */
const getIndicatorClass = (priority: number): string => {
  if (priority >= 90) return 'pulse-animation';
  if (priority >= 80) return 'subtle-pulse';
  return '';
};

// 关键结果相关
const getGoalBindingName = (binding: TaskGoalBindingViewModel | null | undefined) => {
  if (!binding) return '';
  if (props.resolveGoalBindingName) {
    return props.resolveGoalBindingName(binding, props.template);
  }
  return t('task.templateCard.linkedGoal');
};

/**
 * 根据时间类型生成时间标签
 * - ALL_DAY: 全天
 * - TIME_POINT: HH:mm
 * - TIME_RANGE: HH:mm - HH:mm
 */
const timeLabel = computed(() => {
  const timeConfig = props.template.timeConfig;

  if (timeConfig.timeType === 'AllDay') {
    return t('task.templateCard.allDay');
  }

  if (timeConfig.timeType === 'TimePoint' && timeConfig.timePoint != null) {
    const hours = Math.floor(timeConfig.timePoint / 60);
    const minutes = timeConfig.timePoint % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  if (timeConfig.timeType === 'TimeRange' && timeConfig.timeRange) {
    const startHours = Math.floor(timeConfig.timeRange.start / 60);
    const startMinutes = timeConfig.timeRange.start % 60;
    const endHours = Math.floor(timeConfig.timeRange.end / 60);
    const endMinutes = timeConfig.timeRange.end % 60;

    const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    return `${startTime} - ${endTime}`;
  }

  return t('task.templateCard.allDay');
});

// 事件处理方法
const handleCardClick = () => {
  emit('click', props.template.id);
};

const handleEdit = () => {
  emit('edit', props.template.id);
};

const handleDelete = async () => {
  emit('delete', props.template);
  if (props.onDelete) {
    await props.onDelete(props.template);
  }
};

const handlePauseTemplate = () => {
  emit('pause', props.template);
  props.onPause?.(props.template);
};

const handleResume = () => {
  emit('resume', props.template);
};

const handleActivateTemplate = async () => {
  emit('activate', props.template);
  if (props.onActivate) {
    await props.onActivate(props.template);
  }
};
</script>

<style scoped>
/* Priority Card Base Styling */
.template-card {
  border-left: 4px solid transparent;
}

/* High Priority (>=80) - RED */
.template-card.priority-high {
  background: var(--priority-high-bg-light);
  border-left-color: var(--priority-high-border-light);
  box-shadow: 0 2px 4px var(--priority-high-shadow-light);
}

/* Medium Priority (60-79) - AMBER */
.template-card.priority-medium {
  background: var(--priority-medium-bg-light);
  border-left-color: var(--priority-medium-border-light);
  box-shadow: 0 2px 4px var(--priority-medium-shadow-light);
}

/* Low Priority (<60) - GRAY */
.template-card.priority-low {
  background: var(--priority-low-bg-light);
  border-left-color: var(--priority-low-border-light);
  box-shadow: 0 1px 2px var(--priority-low-shadow-light);
}

/* Dark Theme Adjustments */
[data-theme='dark'] .template-card.priority-high {
  background: var(--priority-high-bg-dark);
  border-left-color: var(--priority-high-border-dark);
  box-shadow: 0 2px 4px var(--priority-high-shadow-dark);
}

[data-theme='dark'] .template-card.priority-medium {
  background: var(--priority-medium-bg-dark);
  border-left-color: var(--priority-medium-border-dark);
  box-shadow: 0 2px 4px var(--priority-medium-shadow-dark);
}

[data-theme='dark'] .template-card.priority-low {
  background: var(--priority-low-bg-dark);
  border-left-color: var(--priority-low-border-dark);
  box-shadow: 0 1px 2px var(--priority-low-shadow-dark);
}

/* Animation Keyframes */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes subtle-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

/* Animation Classes */
.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.subtle-pulse {
  animation: subtle-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Respect User's Motion Preference */
@media (prefers-reduced-motion: reduce) {
  .pulse-animation,
  .subtle-pulse {
    animation: none;
    opacity: 1;
  }
}
</style>
