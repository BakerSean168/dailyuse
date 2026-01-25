/**
 * KeyResult Entity - Server Interface
 */

import type { KeyResultClientDTO } from './KeyResultClient';
import type { KeyResultProgressServerDTO } from '../value-objects';
import type { GoalRecordServerDTO } from './GoalRecordServer';

export interface KeyResultServerDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressServerDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: number;
  updatedAt: number;
  records?: GoalRecordServerDTO[] | null;
}

/**
 * KeyResult Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface KeyResultPersistenceDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: string; // JSON string
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyResultServer {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressServerDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: Date;
  updatedAt: Date;
  records?: GoalRecordServerDTO[] | null;

  updateTitle(title: string): void;
  updateDescription(description: string): void;
  updateProgress(newValue: number, note?: string): GoalRecordServerDTO;
  calculatePercentage(): number;
  isCompleted(): boolean;
  updateWeight(weight: number): void; // 更新权重
  updateOrder(order: number): void;
  addRecord(record: GoalRecordServerDTO): void;
  recalculateProgress(): void; // 根据聚合方式重新计算进度
  getRecordValues(): number[]; // 获取所有记录的值

  toServerDTO(): KeyResultServerDTO;
  toClientDTO(): KeyResultClientDTO;
  toPersistenceDTO(): KeyResultPersistenceDTO;
}

export interface KeyResultServerStatic {
  create(params: {
    goalUuid: string;
    title: string;
    description?: string;
    progress: KeyResultProgressServerDTO;
    weight?: number; // 权重，默认 0
    order?: number;
  }): KeyResultServer;
  fromServerDTO(dto: KeyResultServerDTO): KeyResultServer;
  fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResultServer;
}
