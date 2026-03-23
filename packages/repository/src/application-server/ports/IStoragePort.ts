export interface StorageWriteRequest {
  repositoryId: string;
  path: string;
  content?: string | Uint8Array | null;
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

export interface StorageReadRequest {
  repositoryId: string;
  path: string;
}

export interface IStoragePort {
  write(request: StorageWriteRequest): Promise<void>;
  move(request: StorageMoveRequest): Promise<void>;
  delete(request: StorageDeleteRequest): Promise<void>;
  read(request: StorageReadRequest): Promise<Uint8Array | null>;
}
