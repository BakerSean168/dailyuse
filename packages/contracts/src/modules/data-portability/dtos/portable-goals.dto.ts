/**
 * Portable Goals DTOs
 */

import { z } from 'zod';
import { PortableRefSchema, IsoDateString } from './portable-common.dto';

export const PortableGoalFolderSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    parentRef: PortableRefSchema.nullable().optional(),
    sortOrder: z.number(),
    isSystemFolder: z.boolean(),
    folderType: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableGoalFolder = z.infer<typeof PortableGoalFolderSchema>;

export const PortableKeyResultSchema = z
  .object({
    _ref: PortableRefSchema,
    title: z.string(),
    description: z.string().nullable().optional(),
    progress: z.unknown(),
    weight: z.number(),
    sortOrder: z.number(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableKeyResult = z.infer<typeof PortableKeyResultSchema>;

export const PortableGoalReviewSchema = z
  .object({
    _ref: PortableRefSchema,
    reviewType: z.string(),
    rating: z.number().optional(),
    content: z.string(),
    achievements: z.string().nullable().optional(),
    challenges: z.string().nullable().optional(),
    lessonsLearned: z.string().nullable().optional(),
    nextSteps: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableGoalReview = z.infer<typeof PortableGoalReviewSchema>;

export const PortableGoalSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    color: z.string(),
    feasibilityAnalysis: z.string().nullable().optional(),
    motivation: z.string().nullable().optional(),
    status: z.string(),
    importance: z.string(),
    priority: z.number(),
    category: z.string().nullable().optional(),
    tags: z.array(z.string()),
    startDate: IsoDateString.nullable().optional(),
    targetDate: IsoDateString.nullable().optional(),
    completedAt: IsoDateString.nullable().optional(),
    folderRef: PortableRefSchema.nullable().optional(),
    parentGoalRef: PortableRefSchema.nullable().optional(),
    sortOrder: z.number(),
    reminderConfig: z.unknown().optional(),
    keyResults: z.array(PortableKeyResultSchema),
    goalReviews: z.array(PortableGoalReviewSchema),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableGoal = z.infer<typeof PortableGoalSchema>;

export const PortableGoalRecordSchema = z
  .object({
    _ref: PortableRefSchema,
    keyResultRef: PortableRefSchema,
    value: z.number(),
    note: z.string().nullable().optional(),
    recordedAt: IsoDateString,
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableGoalRecord = z.infer<typeof PortableGoalRecordSchema>;

export const PortableFocusSessionSchema = z
  .object({
    _ref: PortableRefSchema,
    goalRef: PortableRefSchema.nullable().optional(),
    status: z.string(),
    durationMinutes: z.number(),
    actualDurationMinutes: z.number(),
    description: z.string().nullable().optional(),
    startedAt: IsoDateString.nullable().optional(),
    completedAt: IsoDateString.nullable().optional(),
    pauseCount: z.number(),
    pausedDurationMinutes: z.number(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableFocusSession = z.infer<typeof PortableFocusSessionSchema>;

export const PortableFocusModeSchema = z
  .object({
    _ref: PortableRefSchema,
    focusedGoalRefs: z.array(PortableRefSchema),
    startTime: IsoDateString,
    endTime: IsoDateString,
    hiddenGoalsMode: z.string(),
    isActive: z.boolean(),
    actualEndTime: IsoDateString.nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableFocusMode = z.infer<typeof PortableFocusModeSchema>;

export const PortableGoalDataSchema = z
  .object({
    folders: z.array(PortableGoalFolderSchema),
    items: z.array(PortableGoalSchema),
    records: z.array(PortableGoalRecordSchema),
    focusSessions: z.array(PortableFocusSessionSchema),
    focusModes: z.array(PortableFocusModeSchema),
  })
  .strict();

export type PortableGoalData = z.infer<typeof PortableGoalDataSchema>;
