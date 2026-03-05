/**
 * Schedule Event Controller
 *
 * Encapsulates Zod validation and use case orchestration for schedule events (calendar entries).
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateScheduleRequestSchema,
  UpdateScheduleRequestSchema,
} from '@dailyuse/contracts/schedule';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { ScheduleEventApplicationService } from '../application-server/services/schedule-event-application-service';
import type { ScheduleConflictDetectionService } from '../application-server/services/schedule-conflict-detection-service';

// ============ Use Case Port ============

export interface ScheduleEventUseCases {
  scheduleEventService: ScheduleEventApplicationService;
  conflictDetectionService?: ScheduleConflictDetectionService;
}

/**
 * Schedule Event Controller
 *
 * Provides validated use-case calls for CalendarEntry (schedule events).
 */
export class ScheduleEventController {
  private readonly service: ScheduleEventApplicationService;
  private readonly conflictService?: ScheduleConflictDetectionService;

  constructor(useCases: ScheduleEventUseCases) {
    this.service = useCases.scheduleEventService;
    this.conflictService = useCases.conflictDetectionService;
  }

  // ==================== Event CRUD ====================

  async create(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateScheduleRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    try {
      const event = await this.service.createSchedule({
        identityId: ctx.identityId,
        title: parsed.data.name,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        description: parsed.data.description,
        location: parsed.data.location,
        priority: parsed.data.priority,
        attendees: parsed.data.attendees,
      });
      return ok(event);
    } catch (err: unknown) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async get(id: string): Promise<Result<unknown>> {
    try {
      const event = await this.service.getSchedule(id);
      if (!event) {
        return fail({ code: 'NOT_FOUND', message: '日程不存在' });
      }
      return ok(event);
    } catch (err: unknown) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async getByTimeRange(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>> {
    const startTime = Number(query.startTime);
    const endTime = Number(query.endTime);

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'startTime 和 endTime 必须是有效的数字',
      });
    }

    try {
      const identityId = (query.identityId as string) || ctx.identityId;
      const events = await this.service.getSchedulesByRange(identityId, startTime, endTime);
      return ok(events);
    } catch (err: unknown) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async update(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateScheduleRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    try {
      const event = await this.service.updateSchedule(id, {
        title: parsed.data.name,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        description: parsed.data.description,
        location: parsed.data.location,
        priority: parsed.data.priority,
        attendees: parsed.data.attendees,
      });
      return ok(event);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('not found')) {
        return fail({ code: 'NOT_FOUND', message: err.message });
      }
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async delete(id: string): Promise<Result<unknown>> {
    try {
      await this.service.deleteSchedule(id);
      return ok(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('not found')) {
        return fail({ code: 'NOT_FOUND', message: err.message });
      }
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // ==================== Conflict Detection ====================

  async getConflicts(id: string): Promise<Result<unknown>> {
    if (!this.conflictService) {
      return fail({ code: 'NOT_IMPLEMENTED', message: 'Conflict detection service not configured' });
    }
    try {
      const result = await this.conflictService.getScheduleConflicts(id);
      return ok(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('not found')) {
        return fail({ code: 'NOT_FOUND', message: err.message });
      }
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async detectConflicts(input: unknown): Promise<Result<unknown>> {
    if (!this.conflictService) {
      return fail({ code: 'NOT_IMPLEMENTED', message: 'Conflict detection service not configured' });
    }
    try {
      const result = await this.conflictService.detectConflictsForSchedule(input as any);
      return ok(result);
    } catch (err: unknown) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async createWithConflictDetection(input: unknown, ctx: Context): Promise<Result<unknown>> {
    if (!this.conflictService) {
      return fail({ code: 'NOT_IMPLEMENTED', message: 'Conflict detection service not configured' });
    }
    const parsed = CreateScheduleRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    try {
      // First detect conflicts
      const draftDto = {
        id: '',
        identityId: ctx.identityId,
        title: parsed.data.name,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        description: parsed.data.description ?? null,
        location: parsed.data.location ?? null,
        priority: parsed.data.priority ?? null,
        attendees: parsed.data.attendees ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const conflicts = await this.conflictService.detectConflictsForSchedule(draftDto as any);

      // Create the event regardless
      const event = await this.service.createSchedule({
        identityId: ctx.identityId,
        title: parsed.data.name,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        description: parsed.data.description,
        location: parsed.data.location,
        priority: parsed.data.priority,
        attendees: parsed.data.attendees,
      });
      return ok({ event, conflicts });
    } catch (err: unknown) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async resolveConflict(id: string, input: unknown): Promise<Result<unknown>> {
    // Conflict resolution strategy: update the event with new times or mark as acknowledged
    const strategy = (input as any)?.strategy;
    if (!strategy) {
      return fail({ code: 'VALIDATION_ERROR', message: 'strategy is required (reschedule | acknowledge)' });
    }
    try {
      if (strategy === 'reschedule' && (input as any)?.startTime && (input as any)?.endTime) {
        const event = await this.service.updateSchedule(id, {
          startTime: (input as any).startTime,
          endTime: (input as any).endTime,
        });
        return ok(event);
      }
      // acknowledge strategy — just return current event
      const event = await this.service.getSchedule(id);
      if (!event) {
        return fail({ code: 'NOT_FOUND', message: '日程不存在' });
      }
      return ok({ ...event, conflictAcknowledged: true });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('not found')) {
        return fail({ code: 'NOT_FOUND', message: err.message });
      }
      return fail({
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}
