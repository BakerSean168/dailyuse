import type { ResourceClientDTO } from '../aggregates/resource-client';
import type { FolderId } from '../../../primitives';

export type UploadOverwritePolicy = 'skip' | 'replace';

export interface UploadResourcesRequestDTO {
  folderId?: FolderId;
  tags?: string[];
  overwritePolicy?: UploadOverwritePolicy;
}

export interface UploadResourceFileDTO {
  name: string;
  mimeType?: string;
  size?: number;
  contentBase64: string;
}

export interface UploadResourceSuccessDTO {
  fileName: string;
  resource: ResourceClientDTO;
}

export interface UploadResourceFailureDTO {
  fileName: string;
  code: string;
  message: string;
}

export interface UploadResourcesResponseDTO {
  successes: UploadResourceSuccessDTO[];
  failures: UploadResourceFailureDTO[];
  resources: ResourceClientDTO[];
}
