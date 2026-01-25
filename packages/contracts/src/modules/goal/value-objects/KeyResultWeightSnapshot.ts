/**
 * Key Result Weight Snapshot Value Object
 * 关键成果权重快照值对象
 *
 * 用于记录 KeyResult 权重的历史变更，支持权重调整的完整追溯和审计。
 */

import { z } from 'zod';

// ============ 枚举和类型定义 ============

/**
 * 权重快照触发方式
 * - manual: 用户手动调整
 * - auto: 系统自动调整
 * - restore: 恢复历史快照
 * - import: 从外部导入
 */
export type SnapshotTrigger = 'manual' | 'auto' | 'restore' | 'import';

// ============ 接口定义 ============

/**
 * 关键成果权重快照 - Server 接口
 */
export interface IKeyResultWeightSnapshotServer {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: number;
  trigger: SnapshotTrigger;
  reason?: string | null;
  operatorUuid: string;
  createdAt: number;

  // 值对象方法
  equals(other: IKeyResultWeightSnapshotServer): boolean;
  with(
    updates: Partial<
      Omit<
        IKeyResultWeightSnapshotServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO' | 'weightDelta'
      >
    >,
  ): IKeyResultWeightSnapshotServer;

  // 业务方法
  calculateWeightDelta(): number; // 计算权重变化量
  isWeightIncreased(): boolean; // 权重是否增加
  isWeightDecreased(): boolean; // 权重是否减少

  // DTO 转换方法
  toServerDTO(): KeyResultWeightSnapshotServerDTO;
  toClientDTO(): KeyResultWeightSnapshotClientDTO;
  toPersistenceDTO(): KeyResultWeightSnapshotPersistenceDTO;
}

/**
 * 关键成果权重快照 - Client 接口
 */
export interface IKeyResultWeightSnapshotClient {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: number;
  trigger: SnapshotTrigger;
  reason?: string | null;
  operatorUuid: string;
  createdAt: number;

  // UI 辅助属性
  snapshotTimeText: string; // 格式化的时间文本
  triggerText: string; // 触发方式文本 "手动调整" / "自动调整"
  weightChangeText: string; // "+10%" / "-5%"
  weightChangeColor: string; // 变化量颜色 (增加绿色，减少红色)

  // 值对象方法
  equals(other: IKeyResultWeightSnapshotClient): boolean;

  // DTO 转换方法
  toServerDTO(): KeyResultWeightSnapshotServerDTO;
}

// ============ DTO 定义 ============

/**
 * Key Result Weight Snapshot Server DTO
 */
export interface KeyResultWeightSnapshotServerDTO {
  /** 快照唯一标识 */
  uuid: string;

  /** 所属 Goal UUID */
  goalUuid: string;

  /** 所属 KeyResult UUID */
  keyResultUuid: string;

  /** 调整前权重 (0-100) */
  oldWeight: number;

  /** 调整后权重 (0-100) */
  newWeight: number;

  /** 权重变化量 (newWeight - oldWeight) */
  weightDelta: number;

  /** 快照时间戳 (毫秒) */
  snapshotTime: number;

  /**
   * 触发方式
   */
  trigger: SnapshotTrigger;

  /** 调整原因说明 (可选) */
  reason?: string | null;

  /** 操作人 UUID */
  operatorUuid: string;

  /** 创建时间戳 */
  createdAt: number;
}

/**
 * Key Result Weight Snapshot Client DTO
 */
export interface KeyResultWeightSnapshotClientDTO {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: number;
  trigger: SnapshotTrigger;
  reason?: string | null;
  operatorUuid: string;
  createdAt: number;

  // UI 辅助字段
  snapshotTimeText: string;
  triggerText: string;
  weightChangeText: string;
  weightChangeColor: string;
}

/**
 * Key Result Weight Snapshot Persistence DTO
 */
export interface KeyResultWeightSnapshotPersistenceDTO {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: Date;
  trigger: SnapshotTrigger;
  reason?: string | null;
  operatorUuid: string;
  createdAt: Date;
}

// ============ Zod Schema 定义 ============

/**
 * SnapshotTrigger Zod Schema
 */
export const SnapshotTriggerSchema = z.enum(['manual', 'auto', 'restore', 'import']);

/**
 * KeyResultWeightSnapshotServerDTO Zod Schema
 */
export const KeyResultWeightSnapshotServerDTOSchema = z.object({
  uuid: z.string().uuid('Invalid UUID format'),
  goalUuid: z.string().uuid('Invalid Goal UUID'),
  keyResultUuid: z.string().uuid('Invalid KeyResult UUID'),
  oldWeight: z
    .number()
    .min(0, 'oldWeight must be at least 0')
    .max(100, 'oldWeight must be at most 100'),
  newWeight: z
    .number()
    .min(0, 'newWeight must be at least 0')
    .max(100, 'newWeight must be at most 100'),
  weightDelta: z.number(),
  snapshotTime: z.number().int().positive('snapshotTime must be positive'),
  trigger: SnapshotTriggerSchema,
  reason: z.string().optional().nullable(),
  operatorUuid: z.string().uuid('Invalid operator UUID'),
  createdAt: z.number().int().positive('createdAt must be positive'),
});

/**
 * KeyResultWeightSnapshotClientDTO Zod Schema
 */
export const KeyResultWeightSnapshotClientDTOSchema = z.object({
  uuid: z.string().uuid(),
  goalUuid: z.string().uuid(),
  keyResultUuid: z.string().uuid(),
  oldWeight: z.number().min(0).max(100),
  newWeight: z.number().min(0).max(100),
  weightDelta: z.number(),
  snapshotTime: z.number().int().positive(),
  trigger: SnapshotTriggerSchema,
  reason: z.string().optional().nullable(),
  operatorUuid: z.string().uuid(),
  createdAt: z.number().int().positive(),
  snapshotTimeText: z.string(),
  triggerText: z.string(),
  weightChangeText: z.string(),
  weightChangeColor: z.string(),
});

/**
 * KeyResultWeightSnapshotPersistenceDTO Zod Schema
 */
export const KeyResultWeightSnapshotPersistenceDTOSchema = z.object({
  uuid: z.string().uuid(),
  goalUuid: z.string().uuid(),
  keyResultUuid: z.string().uuid(),
  oldWeight: z.number().min(0).max(100),
  newWeight: z.number().min(0).max(100),
  weightDelta: z.number(),
  snapshotTime: z.bigint(),
  trigger: SnapshotTriggerSchema,
  reason: z.string().optional().nullable(),
  operatorUuid: z.string().uuid(),
  createdAt: z.date(),
})

// ============ 类型推断 ============

export type KeyResultWeightSnapshotServerDTOType = z.infer<
  typeof KeyResultWeightSnapshotServerDTOSchema
>;
export type KeyResultWeightSnapshotClientDTOType = z.infer<
  typeof KeyResultWeightSnapshotClientDTOSchema
>;
export type KeyResultWeightSnapshotPersistenceDTOType = z.infer<
  typeof KeyResultWeightSnapshotPersistenceDTOSchema
>;

// ============ 类型导出 ============

export type KeyResultWeightSnapshotServer = IKeyResultWeightSnapshotServer;
export type KeyResultWeightSnapshotClient = IKeyResultWeightSnapshotClient;
