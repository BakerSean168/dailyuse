/**
 * Task module importer — handles task folders, templates, dependencies, and instances.
 */

import type { ImportContext } from '../../portable-runtime';
import type { PortableTaskData } from '@dailyuse/contracts/data-portability';
import type { TxClient } from './import-helpers';
import { allocateId, resolveRef, optRef, jsonStringify, inc, rec, timestamps } from './import-helpers';

export async function importTasks(
  tx: TxClient, ctx: ImportContext, data: PortableTaskData,
): Promise<void> {
  for (const folder of data.folders) {
    const f = rec(folder);
    const id = allocateId(ctx, f._ref as string);
    await tx.createTaskFolder({
      id, identityId: ctx.identityId,
      name: f.name as string,
      color: f.color as string | null ?? null,
      icon: f.icon as string | null ?? null,
      order: (f.order as number) ?? 0,
      ...timestamps(f),
    });
    inc(ctx, 'taskFolders');
  }

  for (const template of data.templates) {
    const t = rec(template);
    const id = allocateId(ctx, t._ref as string);
    const tc = t.timeConfig as Record<string, unknown> | undefined;
    const rr = t.recurrenceRule as Record<string, unknown> | undefined;
    const rc = t.reminderConfig as Record<string, unknown> | undefined;
    const reminderTrigger = Array.isArray(rc?.triggers) ? (rc.triggers[0] as Record<string, unknown> | undefined) : undefined;
    await tx.createTaskTemplate({
      id, identityId: ctx.identityId,
      name: t.title as string,
      description: (t.description as string | null ?? null) || (t.note as string | null ?? null),
      status: (t.status as string) ?? 'pending',
      importance: (t.importance as string) ?? 'moderate',
      color: t.color as string | null ?? null,
      tags: jsonStringify(t.tags ?? []),
      folderId: optRef(t.folderRef as string | null, ctx),
      parentTaskId: optRef(t.parentTaskRef as string | null, ctx),
      timeConfigType: ((tc?.type as string | undefined) ?? (tc?.timeType as string | undefined)) ?? null,
      timeConfigStartTime: tc?.startTime ? String(tc.startTime) : (tc?.startDate ? String(tc.startDate) : (t.startDate ? String(t.startDate) : null)),
      timeConfigEndTime: tc?.endTime ? String(tc.endTime) : (t.dueDate ? String(t.dueDate) : null),
      timeConfigDurationMinutes: tc?.durationMinutes as number | null ?? null,
      timeConfigTimePoint: tc?.timePoint as number | null ?? null,
      timeConfigTimeRangeStart: (tc?.timeRangeStart as number | null | undefined) ?? ((tc?.timeRange as Record<string, unknown> | undefined)?.start as number | null | undefined) ?? null,
      timeConfigTimeRangeEnd: (tc?.timeRangeEnd as number | null | undefined) ?? ((tc?.timeRange as Record<string, unknown> | undefined)?.end as number | null | undefined) ?? null,
      recurrenceRuleType: ((rr?.type as string | undefined) ?? (rr?.frequency as string | undefined)) ?? null,
      recurrenceRuleInterval: rr?.interval as number | null ?? null,
      recurrenceRuleDaysOfWeek: rr?.daysOfWeek ? jsonStringify(rr.daysOfWeek) : null,
      recurrenceRuleDayOfMonth: rr?.dayOfMonth as number | null ?? null,
      recurrenceRuleMonthOfYear: rr?.monthOfYear as number | null ?? null,
      recurrenceRuleEndDate: rr?.endDate ? String(rr.endDate) : null,
      recurrenceRuleCount: (rr?.count as number | null | undefined) ?? (rr?.occurrences as number | null | undefined) ?? null,
      reminderConfigEnabled: rc?.enabled as boolean | null ?? null,
      reminderConfigTimeOffsetMinutes: (rc?.timeOffsetMinutes as number | null | undefined) ?? (reminderTrigger?.relativeValue as number | null | undefined) ?? null,
      reminderConfigUnit: (rc?.unit as string | null | undefined) ?? (reminderTrigger?.relativeUnit as string | null | undefined) ?? null,
      reminderConfigChannel: (rc?.channel as string | null | undefined) ?? (reminderTrigger?.channel as string | null | undefined) ?? null,
      goalBinding: t.goalBinding ? jsonStringify(t.goalBinding) : null,
      checklist: t.checklist ? jsonStringify(t.checklist) : null,
      dependencyStatus: 'NONE', isBlocked: false,
      ...timestamps(t),
    });
    inc(ctx, 'taskTemplates');
  }

  for (const dep of data.dependencies) {
    const d = rec(dep);
    const id = allocateId(ctx, d._ref as string);
    await tx.createTaskDependency({
      id, identityId: ctx.identityId,
      predecessorTaskId: resolveRef(d.predecessorTaskRef as string, ctx),
      successorTaskId: resolveRef(d.successorTaskRef as string, ctx),
      dependencyType: (d.dependencyType as string) ?? 'FINISH_TO_START',
      lagDays: d.lagDays as number | null ?? null,
      ...timestamps(d),
    });
    inc(ctx, 'taskDependencies');
  }

  for (const instance of data.instances) {
    const i = rec(instance);
    const id = allocateId(ctx, i._ref as string);
    await tx.createTaskInstance({
      id, templateId: resolveRef(i.templateRef as string, ctx),
      identityId: ctx.identityId,
      instanceDate: String(i.instanceDate),
      status: (i.status as string) ?? 'pending',
      importance: (i.importance as string) ?? 'moderate',
      timeConfig: jsonStringify(i.timeConfig ?? {}),
      actualStartTime: i.actualStartTime ? String(i.actualStartTime) : null,
      actualEndTime: i.actualEndTime ? String(i.actualEndTime) : null,
      comment: i.note as string | null ?? null,
      ...timestamps(i),
    });
    inc(ctx, 'taskInstances');
  }
}
