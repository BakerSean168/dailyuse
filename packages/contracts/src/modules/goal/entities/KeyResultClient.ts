/**
 * KeyResult Entity - Client Interface
 */

import type { KeyResultServerDTO } from './KeyResultServer';
import type { KeyResultProgressClientDTO } from '../value-objects';
import type { GoalRecordClientDTO } from './GoalRecordClient';

export interface KeyResultClientDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressClientDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: number;
  updatedAt: number;
  records?: GoalRecordClientDTO[] | null;
}

export interface KeyResultClient {
  uuid: string;
  goalUuid: string;
  title: string;
  description?: string | null;
  progress: KeyResultProgressClientDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: number;
  updatedAt: number;
  records?: GoalRecordClientDTO[] | null;

  toClientDTO(): KeyResultClientDTO;
  toServerDTO(): KeyResultServerDTO;
}

export interface KeyResultClientStatic {
  fromClientDTO(dto: KeyResultClientDTO): KeyResultClient;
  fromServerDTO(dto: KeyResultServerDTO): KeyResultClient;
  forCreate(goalUuid: string): KeyResultClient;
}

export interface KeyResultClientInstance extends KeyResultClient {
  clone(): KeyResultClient;
}
