/**
 * Task Module — Export Projections
 */

import type { ExportContext } from '../../portable-runtime';
import type { PortableTaskFolder, PortableTaskTemplate, PortableTaskInstance, PortableTaskDependency } from '@dailyuse/contracts/data-portability';
import { parseJsonField, toDateString, toRecord, toStringArray, toTimestamp } from './projection-helpers';

function buildTimeConfig(entity: Record<string, unknown>): unknown {
  const existing = parseJsonField(entity.timeConfig);
  if (existing !== undefined) return existing;
  if (!entity.timeConfigType) return undefined;

  const range =
    entity.timeConfigTimeRangeStart != null && entity.timeConfigTimeRangeEnd != null
      ? {
          start: entity.timeConfigTimeRangeStart,
          end: entity.timeConfigTimeRangeEnd,
        }
      : null;

  return {
    timeType: entity.timeConfigType,
    startDate: toTimestamp(entity.timeConfigStartTime) ?? null,
    timePoint: entity.timeConfigTimePoint ?? null,
    timeRange: range,
  };
}

function buildRecurrenceRule(entity: Record<string, unknown>): unknown {
  const existing = parseJsonField(entity.recurrenceRule);
  if (existing !== undefined) return existing;
  if (!entity.recurrenceRuleType) return undefined;

  return {
    frequency: entity.recurrenceRuleType,
    interval: entity.recurrenceRuleInterval ?? 1,
    daysOfWeek: parseJsonField(entity.recurrenceRuleDaysOfWeek, []),
    dayOfMonth: entity.recurrenceRuleDayOfMonth ?? null,
    monthOfYear: entity.recurrenceRuleMonthOfYear ?? null,
    endDate: toTimestamp(entity.recurrenceRuleEndDate) ?? null,
    occurrences: entity.recurrenceRuleCount ?? null,
  };
}

function buildReminderConfig(entity: Record<string, unknown>): unknown {
  const existing = parseJsonField(entity.reminderConfig);
  if (existing !== undefined) return existing;
  if (entity.reminderConfigEnabled == null) return undefined;

  return {
    enabled: entity.reminderConfigEnabled,
    triggers:
      entity.reminderConfigTimeOffsetMinutes == null
        ? []
        : [
            {
              type: 'Relative',
              relativeValue: entity.reminderConfigTimeOffsetMinutes,
              relativeUnit: entity.reminderConfigUnit ?? null,
              channel: entity.reminderConfigChannel ?? null,
            },
          ],
  };
}

export function projectTaskFolders(folders: unknown[], ctx: ExportContext): PortableTaskFolder[] {
  return folders.map((f) => {
    const entity = f as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('taskFolder');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      name: entity.name as string,
      color: entity.color as string | null | undefined,
      icon: entity.icon as string | null | undefined,
      order: (entity.order as number) ?? 0,
    };
  });
}

export function projectTaskTemplates(templates: unknown[], ctx: ExportContext): PortableTaskTemplate[] {
  return templates.map((t) => {
    const entity = t as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('taskTemplate');
    ctx.refToIdMap.set(entity.id as string, ref);
    const goalBinding = toRecord(entity.goalBinding);
    const goalId =
      (entity.goalId as string | undefined) ??
      (typeof goalBinding?.goalId === 'string' ? goalBinding.goalId : undefined);
    const keyResultId =
      (entity.keyResultId as string | undefined) ??
      (typeof goalBinding?.keyResultId === 'string' ? goalBinding.keyResultId : undefined);
    const recurrenceRule = buildRecurrenceRule(entity);
    return {
      _ref: ref,
      title: ((entity.title as string | undefined) ?? (entity.name as string | undefined)) ?? '',
      description: entity.description as string | null | undefined,
      taskType:
        ((entity.taskType as string | undefined) ??
          (recurrenceRule ? 'Recurring' : undefined)) ?? 'OneTime',
      importance: entity.importance as string,
      tags: toStringArray(entity.tags),
      color: entity.color as string | null | undefined,
      status: entity.status as string,
      folderRef: resolveRef(entity.folderId as string | null, ctx),
      goalRef: resolveRef(goalId, ctx),
      keyResultRef: resolveRef(keyResultId, ctx),
      goalBinding,
      checklist: (parseJsonField(entity.checklist, []) as unknown[]) ?? [],
      parentTaskRef: resolveRef(entity.parentTaskId as string | null, ctx),
      timeConfig: buildTimeConfig(entity),
      recurrenceRule,
      reminderConfig: buildReminderConfig(entity),
      startDate: toDateString(entity.startDate),
      dueDate: toDateString(entity.dueDate),
      completedAt: toDateString(entity.completedAt),
      estimatedMinutes: entity.estimatedMinutes as number | null | undefined,
      actualMinutes: entity.actualMinutes as number | null | undefined,
      note: ((entity.note as string | null | undefined) ?? (entity.comment as string | null | undefined)),
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

export function projectTaskInstances(instances: unknown[], ctx: ExportContext): PortableTaskInstance[] {
  return instances.map((i) => {
    const entity = i as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('taskInstance');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      templateRef: resolveRefOrThrow(entity.templateId as string, ctx),
      instanceDate: toTimestamp(entity.instanceDate) ?? Date.now(),
      timeConfig: parseJsonField(entity.timeConfig, {}),
      importance: entity.importance as string,
      priority: entity.priority as number | undefined,
      status: entity.status as string,
      completionRecord: parseJsonField(entity.completionRecord),
      skipRecord: parseJsonField(entity.skipRecord),
      actualStartTime: toTimestamp(entity.actualStartTime),
      actualEndTime: toTimestamp(entity.actualEndTime),
      note: ((entity.note as string | null | undefined) ?? (entity.comment as string | null | undefined)),
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

export function projectTaskDependencies(deps: unknown[], ctx: ExportContext): PortableTaskDependency[] {
  return deps.map((d) => {
    const entity = d as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('taskDependency');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      predecessorTaskRef: resolveRefOrThrow(entity.predecessorTaskId as string, ctx),
      successorTaskRef: resolveRefOrThrow(entity.successorTaskId as string, ctx),
      dependencyType: entity.dependencyType as string,
      lagDays: entity.lagDays as number | undefined,
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

function resolveRef(id: string | null | undefined, ctx: ExportContext): string | null {
  if (!id) return null;
  const ref = ctx.refToIdMap.get(id);
  if (ref) return ref;
  ctx.warnings.push(`Unresolved task reference to ${id}`);
  return null;
}

function resolveRefOrThrow(id: string, ctx: ExportContext): string {
  const ref = ctx.refToIdMap.get(id);
  if (ref) return ref;
  throw new Error(`EXPORT_VALIDATION_ERROR: Unresolved task reference to ${id}`);
}
