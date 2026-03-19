import type {
  UploadResourceFailureDTO,
  UploadResourceFileDTO,
  UploadResourcesRequestDTO,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';
import { ResourceType } from '@dailyuse/contracts/repository';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
import { PathCalculator } from '../../../domain-server/services/PathCalculator';
import { CreateResource } from './create-resource';
import { DeleteResource } from './delete-resource';

export interface UploadResourcesInput {
  repositoryId: string;
  identityId: string;
  files: UploadResourceFileDTO[];
  metadata?: UploadResourcesRequestDTO;
}

export class UploadResources {
  constructor(
    private readonly createResource: CreateResource,
    private readonly deleteResource: DeleteResource,
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly folderRepository: IFolderRepository,
  ) {}

  async execute(input: UploadResourcesInput): Promise<UploadResourcesResponseDTO> {
    const repository = await this.repositoryRepository.findById(input.repositoryId);
    if (!repository) {
      throw new Error(`Repository not found: ${input.repositoryId}`);
    }

    let folderPath: string | null = null;
    if (input.metadata?.folderId) {
      const folder = await this.folderRepository.findById(input.metadata.folderId);
      if (!folder || folder.repositoryId !== input.repositoryId) {
        throw new Error(`Folder not found: ${input.metadata.folderId}`);
      }
      folderPath = folder.path;
    }

    const successes: UploadResourcesResponseDTO['successes'] = [];
    const failures: UploadResourceFailureDTO[] = [];

    for (const file of input.files) {
      try {
        const normalizedName = normalizeFileName(file.name);
        const resourcePath = PathCalculator.buildPath(folderPath, normalizedName);
        const existing = await this.resourceRepository.findByRepositoryIdAndPath(
          input.repositoryId,
          resourcePath,
        );

        if (existing && input.metadata?.overwritePolicy !== 'replace') {
          failures.push({
            fileName: file.name,
            code: 'RESOURCE_EXISTS',
            message: `Resource already exists at ${resourcePath}`,
          });
          continue;
        }

        if (existing && input.metadata?.overwritePolicy === 'replace') {
          await this.deleteResource.execute({ id: String(existing.id) });
        }

        const binaryContent = Buffer.from(file.contentBase64, 'base64');
        const mimeType = normalizeMimeType(file.mimeType, normalizedName);
        const textContent = isTextLikeMimeType(mimeType)
          ? binaryContent.toString('utf8')
          : undefined;

        const created = await this.createResource.execute({
          repositoryId: input.repositoryId,
          identityId: input.identityId,
          folderId: input.metadata?.folderId,
          name: normalizedName,
          type: ResourceType.File,
          path: resourcePath,
          content: textContent,
          binaryContent: textContent === undefined ? binaryContent : undefined,
          mimeType,
          metadata: {
            tags: normalizeTags(input.metadata?.tags),
            mimeType,
          },
        });

        successes.push({
          fileName: file.name,
          resource: created.resource,
        });
      } catch (error) {
        failures.push({
          fileName: file.name,
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return {
      successes,
      failures,
      resources: successes.map((item) => item.resource),
    };
  }
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function normalizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  return trimmed.length > 0 ? trimmed : `upload-${Date.now()}`;
}

function normalizeMimeType(mimeType: string | undefined, fileName: string): string {
  if (mimeType && mimeType.trim()) return mimeType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function isTextLikeMimeType(mimeType: string): boolean {
  return mimeType.startsWith('text/') || mimeType === 'application/json';
}
