/**
 * FocusMode Value Object Contracts
 * 专注模式值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type {
  DomainDate,
  TransferDate,
  PersistenceDate,
  IdentityId,
  FocusModeId,
  GoalId,
} from '@/primitives';

// ============ 枚举定义 ============

/**
 * 隐藏目标模式
 */
export const HiddenGoalsMode = {
  HIDE: 'hide',
  DIM: 'dim',
  COLLAPSE: 'collapse',
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

/**
 * FocusMode Client DTO
 * 包含 UI 显示用的计算属性
 */
export interface FocusModeClientDTO {
  id: FocusModeId;
  identityId: IdentityId;
  focusedGoalIds: GoalId[];
  startTime: TransferDate;
  endTime: TransferDate;
  hiddenGoalsMode: HiddenGoalsMode;
  isActive: boolean;
  actualEndTime: TransferDate | null;
  // UI 计算属性
  remainingDays: number;
}

// ============ Persistence DTO (持久化层) ============

/**
 * FocusMode Persistence DTO
 * 数据库存储用
 */
export interface FocusModePersistenceDTO {
  id: FocusModeId;
  identityId: IdentityId;
  name: string;
  startTime: PersistenceDate;
  endTime: PersistenceDate;
  hiddenGoalsMode: string;
  isActive: boolean;
  actualEndTime: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ API Request DTOs ============

/**
 * 激活聚焦模式请求
 */
export interface ActivateFocusModeRequest {
  focusedGoalIds: GoalId[]; // 1-3个目标
  endTime: TransferDate; // 结束时间 (timestamp)
  hiddenGoalsMode?: HiddenGoalsMode; // 隐藏模式，默认 'hide'
}

/**
 * 延长聚焦模式请求
 */
export interface ExtendFocusModeRequest {
  newEndTime: TransferDate; // 新的结束时间 (timestamp)
}

// ============ 向后兼容别名 (Backward Compatibility) ============

/** @deprecated Use FocusModeDTO */
export type FocusModeServerDTO = FocusModeDTO;
