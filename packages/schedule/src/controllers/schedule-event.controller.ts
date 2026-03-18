/**
 * Schedule Event Controller
 *
 * Encapsulates Zod validation and use case orchestration for schedule events (calendar entries).
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateScheduleRequestSchema,
  type CreateScheduleRequest,
  UpdateScheduleRequestSchema,
  type UpdateScheduleRequest,
  DetectConflictsRequestSchema,
  ResolveConflictRequestSchema,
  type ResolveConflictRequest,
  type GetSchedulesByTimeRangeInternalQuery,
  type DetectConflictsInternalQuery,
} from '@dailyuse/contracts/schedule';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface ScheduleEventUseCases {
  createEvent(data: CreateScheduleRequest, ctx: Context): Promise<Result<unknown>>;
  getEvent(id: string): Promise<Result<unknown>>;
  listEvents(query: GetSchedulesByTimeRangeInternalQuery, ctx: Context): Promise<Result<unknown>>;
  updateEvent(id: string, data: UpdateScheduleRequest): Promise<Result<unknown>>;
  deleteEvent(id: string): Promise<Result<unknown>>;
  getConflicts(id: string): Promise<Result<unknown>>;
  detectConflicts(data: DetectConflictsInternalQuery): Promise<Result<unknown>>;
  createEventWithConflictDetection(
    data: CreateScheduleRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  resolveConflict(id: string, data: ResolveConflictRequest): Promise<Result<unknown>>;
}

/**
 * Schedule Event Controller
 *
 * Provides validated use-case calls for CalendarEntry (schedule events).
 */
export class ScheduleEventController {
  constructor(private readonly useCases: ScheduleEventUseCases) {}

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

    if (parsed.data.autoDetectConflicts) {
      return this.createWithConflictDetection(input, ctx);
    }

    return this.useCases.createEvent(parsed.data, ctx);
  }

  async get(id: string): Promise<Result<unknown>> {
    return this.useCases.getEvent(id);
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

    // Use ONLY ctx.identityId - never accept identityId from query params
    const internalQuery: GetSchedulesByTimeRangeInternalQuery = {
      startTime,
      endTime,
      identityId: ctx.identityId as GetSchedulesByTimeRangeInternalQuery['identityId'],
    };

    return this.useCases.listEvents(internalQuery, ctx);
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
    return this.useCases.updateEvent(id, parsed.data);
  }

  async delete(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteEvent(id);
  }

  // ==================== Conflict Detection ====================

  async getConflicts(id: string): Promise<Result<unknown>> {
    return this.useCases.getConflicts(id);
  }

  async detectConflicts(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = DetectConflictsRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    // Inject identityId from context - never from request
    const internalQuery: DetectConflictsInternalQuery = {
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      excludeId: parsed.data.excludeId,
      identityId: ctx.identityId as DetectConflictsInternalQuery['identityId'],
    };

    return this.useCases.detectConflicts(internalQuery);
  }

  async createWithConflictDetection(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateScheduleRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createEventWithConflictDetection(parsed.data, ctx);
  }

  async resolveConflict(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = ResolveConflictRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.resolveConflict(id, parsed.data);
  }
}
