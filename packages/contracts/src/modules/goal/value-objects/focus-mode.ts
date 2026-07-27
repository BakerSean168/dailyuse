/**
 * FocusMode Value Object Contracts
 * 专注模式值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  Instant,
  IdentityId,
  FocusModeId,
  GoalId,
} from '../../../primitives';

// ============ 枚举定义 ============

/**
 * 隐藏目标模式
 */
export const HiddenGoalsMode = {
  Hide: 'Hide',
  Dim: 'Dim',
  Collapse: 'Collapse',
} as const;

export type HiddenGoalsMode = (typeof HiddenGoalsMode)[keyof typeof HiddenGoalsMode];

// ============ Domain Shape (领域层) ============

/**
 * FocusMode - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
/**
 * FocusMode - Domain Shape (ADR-037: Instant epoch ms, no DomainDate).
 */
export interface FocusMode {
  id: FocusModeId;
  identityId: IdentityId;
  focusedGoalIds: GoalId[];
  startTime: Instant;
  endTime: Instant;
  hiddenGoalsMode: HiddenGoalsMode;
  isActive: boolean;
  actualEndTime: Instant | null;
  createdAt: Instant;
  updatedAt: Instant;
}

// Residual 745: FocusModeDTO dual body retired — OpenAPI + transport use
// FocusModeClientDTOSchema (semantic type is a z.infer alias).

export const FocusModeClientDTOSchema = z.object({
  id: brandedId<FocusModeId>(),
  identityId: brandedId<IdentityId>(),
  focusedGoalIds: z.array(brandedId<GoalId>()),
  startTime: z.number(),
  endTime: z.number(),
  hiddenGoalsMode: z.enum(HiddenGoalsMode),
  isActive: z.boolean(),
  actualEndTime: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type FocusModeDTO = z.infer<typeof FocusModeClientDTOSchema>;

// ============ Request Schemas ============

export const ActivateFocusModeSchema = z
  .object({
    focusedGoalIds: z.array(brandedId<GoalId>()).min(1).max(3),
    hiddenGoalsMode: z.nativeEnum(HiddenGoalsMode).optional(),
  })
  .strict();

export const DeactivateFocusModeSchema = z.object({}).strict();

export const ExtendFocusModeSchema = z
  .object({
    newEndTime: z.number().int(),
  })
  .strict();

export type ActivateFocusModeReq = z.infer<typeof ActivateFocusModeSchema>;
export type DeactivateFocusModeReq = z.infer<typeof DeactivateFocusModeSchema>;
export type ExtendFocusModeReq = z.infer<typeof ExtendFocusModeSchema>;

// Residual 745: request interface duals retired — aliases of schema-inferred types.
export type ActivateFocusModeRequest = ActivateFocusModeReq;
export type ExtendFocusModeRequest = ExtendFocusModeReq;
