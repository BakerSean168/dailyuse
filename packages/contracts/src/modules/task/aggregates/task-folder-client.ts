import type { TaskFolderId, IdentityId } from '@/primitives/ids';


export interface TaskFolderClient {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
}

export interface TaskFolderClientDTO {

  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
}

