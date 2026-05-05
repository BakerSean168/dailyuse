/**
 * FocusMode Value Object Contracts
 * 专注模式值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  DomainDate,
  TransferDate,
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
export interface FocusMode {
  id: FocusModeId;
  identityId: IdentityId;
  focusedGoalIds: GoalId[];
  startTime: DomainDate;
  endTime: DomainDate;
  hiddenGoalsMode: HiddenGoalsMode;
  isActive: boolean;
  actualEndTime: DomainDate | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}

// ============ Transfer DTO (传输层) ============

/**
 * FocusMode DTO
 * API 传输用
 */
export interface FocusModeDTO {
  id: FocusModeId;
  identityId: IdentityId;
  focusedGoalIds: GoalId[];
  startTime: TransferDate;
  endTime: TransferDate;
  hiddenGoalsMode: HiddenGoalsMode;
  isActive: boolean;
  actualEndTime: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

// ============ API Request DTOs ============

/**
 * 激活聚焦模式请求
 */
export interface ActivateFocusModeRequest {
  focusedGoalIds: GoalId[]; // 1-3个目标
  hiddenGoalsMode?: HiddenGoalsMode; // 隐藏模式，默认 'hide'
}

/**
 * 延长聚焦模式请求
 */
export interface ExtendFocusModeRequest {
  newEndTime: TransferDate; // 新的结束时间 (timestamp)
}

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
