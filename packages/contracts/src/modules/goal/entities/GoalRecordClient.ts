/**
 * GoalRecord Entity - Client Interface
 */

import type { GoalRecordServerDTO } from './GoalRecordServer';

export interface GoalRecordClientDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // 本次记录的值（独立值）
  calculatedCurrentValue?: number;  // 记录时计算的累计值（用于展示）
  note?: string | null;
  recordedAt: number;
  createdAt: number;
}

export interface GoalRecordClient {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // 本次记录的值（独立值）
  calculatedCurrentValue?: number;  // 记录时计算的累计值（用于展示）
  note?: string | null;
  recordedAt: number;
  createdAt: Date;

  toClientDTO(): GoalRecordClientDTO;
  toServerDTO(): GoalRecordServerDTO;
}

export interface GoalRecordClientStatic {
  fromClientDTO(dto: GoalRecordClientDTO): GoalRecordClient;
  fromServerDTO(dto: GoalRecordServerDTO): GoalRecordClient;
}

export interface GoalRecordClientInstance extends GoalRecordClient {
  clone(): GoalRecordClient;
}
