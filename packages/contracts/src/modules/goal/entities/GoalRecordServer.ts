/**
 * GoalRecord Entity - Server Interface
 * 目标记录实体 - 服务端接口
 */
import type { GoalRecordClientDTO } from './GoalRecordClient';
// ============ DTO 定义 ============

/**
 * GoalRecord Server DTO
 * 记录本次的独立值，而不是累计值
 */
export interface GoalRecordServerDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // 本次记录的值（独立值）
  note?: string | null;
  recordedAt: number;
  createdAt: number;
}

/**
 * GoalRecord Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalRecordPersistenceDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // 本次记录的值（独立值）
  note?: string | null;
  recordedAt: number;
  createdAt: Date;
}

// ============ 实体接口 ============

export interface GoalRecordServer {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // 本次记录的值（独立值）
  note?: string | null;
  recordedAt: number;
  createdAt: Date;

  updateNote(note: string): void;  toClientDTO(calculatedCurrentValue?: number): GoalRecordClientDTO;}
