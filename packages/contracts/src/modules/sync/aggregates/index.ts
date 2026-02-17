export interface SyncSessionClientDTO {
  id: string;
  identityId: string;
  lastSyncAt: number | null;
}

export interface SyncSessionServerDTO extends SyncSessionClientDTO {
  createdAt: number;
  updatedAt: number;
}
