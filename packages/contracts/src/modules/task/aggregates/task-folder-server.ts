import type { TaskFolderId, IdentityId } from '@/primitives/ids';


export interface TaskFolderServer {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
}

export interface TaskFolderServerDTO {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
}

export interface TaskFolderPersistenceDTO {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
}