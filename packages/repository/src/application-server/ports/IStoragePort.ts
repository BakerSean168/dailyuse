export interface StorageWriteRequest {
  repositoryId: string;
  path: string;
  content?: string | null;
  isFolder?: boolean;
}

export interface StorageMoveRequest {
  repositoryId: string;
  fromPath: string;
  toPath: string;
  isFolder?: boolean;
}

export interface StorageDeleteRequest {
  repositoryId: string;
  path: string;
  isFolder?: boolean;
}

export interface IStoragePort {
  write(request: StorageWriteRequest): Promise<void>;
  move(request: StorageMoveRequest): Promise<void>;
  delete(request: StorageDeleteRequest): Promise<void>;
}
