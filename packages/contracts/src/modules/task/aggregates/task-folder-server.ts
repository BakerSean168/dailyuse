import type { TaskFolderId, IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';


export interface TaskFolderServer {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

export interface TaskFolderServerDTO {

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

export interface TaskFolderPersistenceDTO {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}