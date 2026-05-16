import type { ComposerTranslation } from 'vue-i18n';
import type {
  TaskTemplateClientDTO,
  TaskTimeConfigDTO,
  TaskTimeConfigReq,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { TaskTemplateViewModel, TaskTimeConfigViewModel } from '../components/types';
import { findNamedColor } from '../../../shared/constants/colorPalette';

type Translate = ComposerTranslation<Record<string, never>, string>;

const statusMap: Record<string, string> = {
  Active: 'ACTIVE',
  Paused: 'PAUSED',
  Archived: 'ARCHIVED',
  Deleted: 'DELETED',
};

const statusLabelKeys: Record<string, string> = {
  ACTIVE: 'task.templateCard.statusActive',
  PAUSED: 'task.templateCard.statusPaused',
  ARCHIVED: 'task.templateCard.statusArchived',
  DELETED: 'common.delete',
};

const importanceLabelKeys: Record<string, string> = {
  [ImportanceLevel.Vital]: 'task.metadata.importanceCritical',
  [ImportanceLevel.Important]: 'task.metadata.importanceHigh',
  [ImportanceLevel.Moderate]: 'task.metadata.importanceMedium',
  [ImportanceLevel.Minor]: 'task.metadata.importanceLow',
  [ImportanceLevel.Trivial]: 'task.metadata.importanceMinimal',
};

function formatMinuteOfDay(minutes?: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '-';
  const safe = Math.max(0, Math.min(1439, minutes));
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

type TaskTimeDisplayInput = {
  timeType?: TaskTimeConfigDTO['timeType'] | string;
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;
} | null | undefined;

type TaskTimePayloadInput = Pick<
  TaskTimeConfigViewModel,
  'timeType' | 'timePoint' | 'timeRange' | 'startDate'
> | null | undefined;

export function getTaskTimeTypeLabel(t: Translate, type?: string | null): string {
  switch (type) {
    case 'AllDay':
      return t('task.timeConfig.allDay');
    case 'TimePoint':
      return t('task.timeConfig.timePoint');
    case 'TimeRange':
      return t('task.timeConfig.timeRange');
    default:
      return t('common.none');
  }
}

export function getTaskTimeValueDisplay(
  t: Translate,
  timeConfig?: TaskTimeDisplayInput,
): string {
  if (!timeConfig) return t('common.none');
  if (timeConfig.timeType === 'AllDay') return t('task.timeConfig.allDay');
  if (timeConfig.timeType === 'TimePoint') return formatMinuteOfDay(timeConfig.timePoint);
  if (timeConfig.timeType === 'TimeRange' && timeConfig.timeRange) {
    return `${formatMinuteOfDay(timeConfig.timeRange.start)} - ${formatMinuteOfDay(timeConfig.timeRange.end)}`;
  }
  return t('common.none');
}

export function toTaskTimeConfigPayload(timeConfig?: TaskTimePayloadInput): TaskTimeConfigReq {
  const timeType = timeConfig?.timeType ?? 'AllDay';
  const startDate = timeConfig?.startDate;

  return {
    timeType,
    startDate:
      startDate instanceof Date
        ? startDate.getTime()
        : typeof startDate === 'number'
          ? startDate
          : null,
    timePoint: timeType === 'TimePoint' ? (timeConfig?.timePoint ?? null) : null,
    timeRange: timeType === 'TimeRange' ? (timeConfig?.timeRange ?? null) : null,
  };
}

export function getTaskRecurrenceText(t: Translate, dto: TaskTemplateClientDTO): string {
  if (!dto.recurrenceRule) {
    return t('task.templateCard.noRecurrence');
  }

  const interval = Math.max(1, dto.recurrenceRule.interval ?? 1);
  switch (dto.recurrenceRule.frequency) {
    case 'Daily':
      return t('task.recurrence.description', {
        interval,
        unit: t('task.recurrence.intervalHintDay'),
      });
    case 'Weekly':
      return t('task.recurrence.description', {
        interval,
        unit: t('task.recurrence.intervalHintWeek'),
      });
    case 'Monthly':
      return t('task.recurrence.description', {
        interval,
        unit: t('task.recurrence.intervalHintMonth'),
      });
    case 'Yearly':
      return t('task.recurrence.description', {
        interval,
        unit: t('task.recurrence.intervalHintYear'),
      });
    default:
      return t('task.templateCard.noRecurrence');
  }
}

export function mapTaskTemplateDtoToViewModel(
  dto: TaskTemplateClientDTO,
  t: Translate,
): TaskTemplateViewModel {
  const status = statusMap[dto.status] ?? dto.status;
  const colorOption = findNamedColor(dto.color);

  return {
    id: dto.id,
    title: dto.name,
    description: dto.description ?? undefined,
    status,
    statusText: t(statusLabelKeys[status] ?? 'common.unknown'),
    isActive: status === 'ACTIVE',
    isPaused: status === 'PAUSED',
    isArchived: status === 'ARCHIVED',
    importance: dto.importance,
    importanceText: t(importanceLabelKeys[dto.importance] ?? 'common.unknown'),
    priority: dto.priority ?? 0,
    estimatedMinutes: dto.estimatedMinutes,
    dueDate: dto.dueDate ?? null,
    parentTaskId: dto.parentTaskId,
    dependencyStatus: dto.dependencyStatus,
    isBlocked: dto.isBlocked,
    blockingReason: dto.blockingReason,
    recurrenceText: getTaskRecurrenceText(t, dto),
    tags: dto.tags ?? [],
    tagSummaryText:
      dto.tags && dto.tags.length > 0 ? dto.tags.join(', ') : t('task.templateCard.noTags'),
    goalBinding: dto.goalBinding
      ? {
          goalId: dto.goalBinding.goalId,
          keyResultId: dto.goalBinding.keyResultId,
          incrementValue: dto.goalBinding.goalRecordValue,
          progressTrigger: dto.goalBinding.progressTrigger,
        }
      : null,
    timeConfig: {
      timeType: dto.timeConfig?.timeType as TaskTemplateViewModel['timeConfig']['timeType'],
      timePoint: dto.timeConfig?.timePoint ?? null,
      timeRange: dto.timeConfig?.timeRange ?? null,
      startDate: dto.timeConfig?.startDate ?? undefined,
    },
    reminderConfig: dto.reminderConfig ?? null,
    recurrenceRule: dto.recurrenceRule ?? null,
    instanceCount: dto.instanceCount ?? 0,
    completedInstanceCount: dto.completedInstanceCount ?? 0,
    pendingInstanceCount: dto.pendingInstanceCount ?? 0,
    completionRate: dto.completionRate ?? 0,
    formattedCreatedAt: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString() : undefined,
    taskType: dto.recurrenceRule ? 'Recurring' : 'OneTime',
    color: dto.color,
    colorLabel: colorOption ? t(colorOption.labelKey) : t('task.metadata.selectColor'),
  };
}
