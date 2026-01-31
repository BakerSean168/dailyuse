/**
 * KeyResult Entity - Server Interface
 */

import type { KeyResultProgressDTO } from '../value-objects';
import type { TransferDate, PersistenceDate, DomainDate } from '@/primitives';

export interface KeyResultServerDTO {
  id: string;
  title: string;
  description: string | null;
  progress: KeyResultProgressDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * KeyResult Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface KeyResultPersistenceDTO {
  id: string;
  title: string;
  description: string | null;
  progress: string; // JSON string
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

export interface KeyResultServer {
  id: string;
  title: string;
  description: string | null;
  progress: KeyResultProgressDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
