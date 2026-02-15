export interface RepositoryContentReadResult {
  resourceId: string;
  name: string;
  content: string | null;
  mimeType?: string | null;
}

export interface RepositoryContentWriteRequest {
  resourceId: string;
  content: string;
}

export interface IRepositoryContentPort {
  getContent(resourceId: string): Promise<RepositoryContentReadResult>;
  saveContent(request: RepositoryContentWriteRequest): Promise<void>;
}
