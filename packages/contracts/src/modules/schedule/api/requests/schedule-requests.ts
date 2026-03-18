/**
 * Schedule API Requests
 * 调度模块 API 请求定义
 */

import { z } from 'zod';
import { brandedId } from '../../../../primitives';
import type { IdentityId, ScheduleId } from '../../../../primitives';
import type { CalendarEntryClientDTO } from '../../aggregates/calendar-entry-client';
import type { ConflictDetectionResult } from '../../value-objects/conflict-detection-result';

// ============ Zod Schemas ============

export const ResolutionStrategySchema = z.enum([
  'AUTO',
  'REJECT',
  'ADJUST_START_TIME',
  'ADJUST_END_TIME',
  'ADJUST_DURATION',
]);

export type ResolutionStrategy = z.infer<typeof ResolutionStrategySchema>;

export const CreateScheduleRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  duration: z.number().positive(),
  priority: z.number().int().min(0).max(10).optional(),
  location: z.string().max(500).optional(),
  attendees: z.array(z.string().email()).optional(),
  autoDetectConflicts: z.boolean().optional(),
});

export const UpdateScheduleRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startTime: z.number().positive().optional(),
  endTime: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  location: z.string().max(500).optional(),
  attendees: z.array(z.string().email()).optional(),
});

export const DetectConflictsRequestSchema = z.object({
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  excludeId: brandedId<ScheduleId>().optional(),
});

export const GetSchedulesByTimeRangeRequestSchema = z.object({
  startTime: z.number().positive(),
  endTime: z.number().positive(),
});

export const ResolveConflictRequestSchema = z.object({
  resolution: ResolutionStrategySchema,
  newStartTime: z.number().positive().optional(),
  newEndTime: z.number().positive().optional(),
  newDuration: z.number().positive().optional(),
});

// ============ Request Types ============

/**
 * Request DTO for creating a new schedule with automatic conflict detection
 */
export interface CreateScheduleRequest {
  name: string;
  description?: string;
  startTime: number;
  endTime: number;
  duration: number;
  priority?: number;
  location?: string;
  attendees?: string[];
  autoDetectConflicts?: boolean;
}

/**
 * Request DTO for updating a schedule
 */
export interface UpdateScheduleRequest {
  name?: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  priority?: number;
  location?: string;
  attendees?: string[];
}

/**
 * Request DTO for detecting schedule conflicts for a given time range
 */
export interface DetectConflictsRequest {
  startTime: number;
  endTime: number;
  excludeId?: ScheduleId;
}

/**
 * Request DTO for getting schedules within a time range
 */
export interface GetSchedulesByTimeRangeRequest {
  startTime: number;
  endTime: number;
}

/**
 * Request DTO for resolving a schedule conflict
 */
export interface ResolveConflictRequest {
  resolution: ResolutionStrategy;
  newStartTime?: number;
  newEndTime?: number;
  newDuration?: number;
}

// ============ Internal Types (for server-side use only) ============

/**
 * Internal query type for getting schedules within a time range with identity
 * Used by controllers/modules when assembling queries from context
 */
export interface GetSchedulesByTimeRangeInternalQuery {
  startTime: number;
  endTime: number;
  identityId: IdentityId;
}

/**
 * Internal query type for detecting conflicts with identity
 * Used by controllers/modules when assembling queries from context
 */
export interface DetectConflictsInternalQuery {
  startTime: number;
  endTime: number;
  excludeId?: ScheduleId;
  identityId: IdentityId;
}

// ============ Response Types ============

/**
 * Response DTO for creating a schedule
 */
export interface CreateScheduleResponseDTO {
  schedule: CalendarEntryClientDTO;
  conflicts?: ConflictDetectionResult;
}

/**
 * Response DTO for conflict detection endpoint
 */
export interface DetectConflictsResponseDTO {
  result: ConflictDetectionResult;
}

/**
 * Information about the applied resolution
 */
export interface AppliedResolution {
  strategy: ResolutionStrategy;
  previousStartTime?: number;
  previousEndTime?: number;
  changes: string[];
}

/**
 * Response DTO for resolving a schedule conflict
 */
export interface ResolveConflictResponseDTO {
  schedule: CalendarEntryClientDTO;
  conflicts: ConflictDetectionResult;
  applied: AppliedResolution;
}
