import type { TaskFolderId, IdentityId } from '@/primitives/ids';
import type { TransferDate } from '@/primitives';

export interface TaskFolderClientDTO {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
