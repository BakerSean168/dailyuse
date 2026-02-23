import type { SubtaskId,  TransferDate } from '@/primitives';

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
