/**
 * KeyResult Entity - Client Interface
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { KeyResultProgressDTO } from '../value-objects';

export interface KeyResultClientDTO {
  id: string;
  title: string;
  description: string | null;
  progress: KeyResultProgressDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

export interface KeyResultClient {
  id: string;
  title: string;
  description: string | null;
  progress: KeyResultProgressDTO;
  weight: number; // 权重 (0-100)
  order: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
