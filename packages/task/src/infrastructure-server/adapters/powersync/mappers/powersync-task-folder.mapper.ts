import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';

export type PowerSyncTaskFolderRow = {
  id: string;
  identity_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class PowerSyncTaskFolderMapper {
  static toDTO(data: PowerSyncTaskFolderRow): TaskFolderServerDTO {
    return {
      id: data.id as TaskFolderServerDTO['id'],
      identityId: data.identity_id as TaskFolderServerDTO['identityId'],
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null,
      order: data.order,
      version: data.version ?? 1,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      deletedAt: data.deleted_at ? new Date(data.deleted_at).getTime() : null,
    };
  }
}
