import type { SubtaskId, DomainDate, TransferDate } from '@/primitives';

export interface SubtaskClient {
  id: SubtaskId;
  name: string;
  isCompleted: boolean;
  order: number;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

export interface SubtaskClientDTO {
  id: string;
  name: string;
  isCompleted: boolean;
  order: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

