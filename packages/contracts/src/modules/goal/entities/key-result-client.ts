/**
 * KeyResult Entity - Client Interface
 */

import type { DomainDate, TransferDate, KeyResultId } from '@/primitives';
import type { KeyResultProgress, KeyResultProgressDTO } from '../value-objects';

export interface KeyResultClientDTO {
  id: string;
  title: string;
  description: string | null;
  progress: KeyResultProgressDTO;
  weight: number; // 权重 (0-100)
  order: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

export interface KeyResultClient {
  id: KeyResultId;
  title: string;
  description: string | null;
  progress: KeyResultProgress;
  weight: number; // 权重 (0-100)
  order: number;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}
