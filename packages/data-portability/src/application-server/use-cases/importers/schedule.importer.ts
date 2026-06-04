/**
 * Schedule module importer — handles schedule entries and schedule tasks.
 */

import type { ImportContext, PortableScheduleData } from '../../portable-types';
import type { TxClient } from './import-helpers';
import { allocateId, optRef, jsonStringify, inc, rec, timestamps } from './import-helpers';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

export async function importSchedules(
  tx: TxClient, ctx: ImportContext, data: PortableScheduleData,
): Promise<void> {
  for (const entry of data.entries) {
    const e = rec(entry);
    const id = allocateId(ctx, e._ref as string);
    await tx.createSchedule({
      id, identityId: ctx.identityId,
      title: e.title as string, description: e.description as string | null ?? null,
      startTime: String(e.startTime),
      endTime: String(e.endTime),
      duration: e.duration as number,
      priority: e.priority as number | null ?? null,
      location: e.location as string | null ?? null,
      attendees: e.attendees ? jsonStringify(e.attendees) : null,
      ...timestamps(e),
    });
    inc(ctx, 'schedules');
  }

  for (const task of data.tasks) {
    const t = rec(task);
    const id = allocateId(ctx, t._ref as string);
    const schedule = asRecord(t.schedule);
    const execution = asRecord(t.execution);
    const retryPolicy = asRecord(t.retryPolicy);
    await tx.createScheduleTask({
      id, identityId: ctx.identityId,
      name: t.name as string, description: t.description as string | null ?? null,
      sourceModule: t.sourceModule as string,
      sourceEntityId: optRef(t.sourceRef as string | null, ctx) ?? '',
      status: (t.status as string) ?? 'pending',
      enabled: (t.enabled as boolean) ?? true,
      cronExpression: optionalString(schedule.cronExpression),
      timezone: (schedule.timezone as string | null | undefined) ?? 'UTC',
      startDate: optionalString(schedule.startDate),
      endDate: optionalString(schedule.endDate),
      maxExecutions: execution.maxExecutions as number | null ?? null,
      nextRunAt: optionalString(execution.nextRunAt),
      lastRunAt: optionalString(execution.lastRunAt),
      executionCount: (execution.executionCount as number) ?? 0,
      lastExecutionStatus: execution.lastExecutionStatus as string | null ?? null,
      lastExecutionDuration: execution.lastExecutionDuration as number | null ?? null,
      consecutiveFailures: (execution.consecutiveFailures as number) ?? 0,
      maxRetries: (retryPolicy.maxRetries as number) ?? 3,
      initialDelayMs: (retryPolicy.initialDelayMs as number) ?? 1000,
      maxDelayMs: (retryPolicy.maxDelayMs as number) ?? 30000,
      backoffMultiplier: (retryPolicy.backoffMultiplier as number) ?? 2,
      retryableStatuses: jsonStringify(retryPolicy.retryableStatuses ?? []),
      priority: (t.priority as string | undefined) ?? 'normal',
      timeout: retryPolicy.timeout as number | null ?? null,
      payload: t.metadata ? jsonStringify(t.metadata) : null,
      tags: t.tags ? jsonStringify(t.tags) : '[]',
      ...timestamps(t),
    });
    inc(ctx, 'scheduleTasks');
  }
}
