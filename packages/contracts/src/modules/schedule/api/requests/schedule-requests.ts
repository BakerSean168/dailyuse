/**
 * Schedule API Requests
 * 调度（日历事件）API 请求定义
 */

import { z } from 'zod';
import type { ScheduleClientDTO } from '../../aggregates/schedule-job-client';
import type { ConflictDetectionResult } from '../../value-objects/conflict-detection-result';

// ============ Zod Schemas ============

export const CreateScheduleRequestSchema = z.object({
  accountUuid: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  duration: z.number().positive(),
  priority: z.number().min(0).max(10).optional(),
  location: z.string().max(500).optional(),
  attendees: z.array(z.string()).optional(),
  autoDetectConflicts: z.boolean().optional(),
});

export const UpdateScheduleRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startTime: z.number().positive().optional(),
  endTime: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  priority: z.number().min(0).max(10).optional(),
  location: z.string().max(500).optional(),
  attendees: z.array(z.string()).optional(),
});

export const DetectConflictsRequestSchema = z.object({
  userId: z.string().uuid(),
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  excludeUuid: z.string().uuid().optional(),
});

export const GetSchedulesByTimeRangeRequestSchema = z.object({
  startTime: z.number().positive(),
  endTime: z.number().positive(),
  accountUuid: z.string().uuid().optional(),
});

/**
 * Resolution strategies for schedule conflicts
 */
export enum ResolutionStrategy {
  RESCHEDULE = 'RESCHEDULE',
  CANCEL = 'CANCEL',
  ADJUST_DURATION = 'ADJUST_DURATION',
  IGNORE = 'IGNORE',
}

export const ResolveConflictRequestSchema = z.object({
  resolution: z.nativeEnum(ResolutionStrategy),
  newStartTime: z.number().positive().optional(),
  newEndTime: z.number().positive().optional(),
  newDuration: z.number().positive().optional(),
});

// ============ Request Types ============

/**
 * Request DTO for creating a new schedule with automatic conflict detection
 */
export interface CreateScheduleRequest {
  accountUuid: string;
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
  userId: string;
  startTime: number;
  endTime: number;
  excludeUuid?: string;
}

/**
 * Request DTO for getting schedules within a time range
 */
export interface GetSchedulesByTimeRangeRequest {
  startTime: number;
  endTime: number;
  accountUuid?: string;
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

// ============ Response Types ============

/**
 * Response DTO for creating a schedule
 */
export interface CreateScheduleResponseDTO {
  schedule: ScheduleClientDTO;
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
  schedule: ScheduleClientDTO;
  conflicts: ConflictDetectionResult;
  applied: AppliedResolution;
}
