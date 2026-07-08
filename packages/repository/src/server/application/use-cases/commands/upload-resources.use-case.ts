import type {
  UploadResourceFailureDTO,
  UploadResourceFileDTO,
  UploadResourcesRequestDTO,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';
import { ResourceType } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ResourceMutationService } from '../../services/resource-mutation.service';

export interface UploadResourcesInput {
  repositoryId: string;
  identityId: string;
  files: UploadResourceFileDTO[];
  metadata?: UploadResourcesRequestDTO;
}

export class UploadResourcesUseCase {
  constructor(private readonly mutationService: ResourceMutationService) {}

  async execute(input: UploadResourcesInput): Promise<Result<UploadResourcesResponseDTO>> {
    const successes: UploadResourcesResponseDTO['successes'] = [];
    const failures: UploadResourceFailureDTO[] = [];

    for (const file of input.files) {
      try {
        const result = await this.mutationService.uploadResource({
          repositoryId: input.repositoryId,
          identityId: input.identityId,
          type: ResourceType.File,
          file,
          metadata: input.metadata,
        });

        if (!result.ok) {
          failures.push({
            fileName: file.name,
            code: result.error.code,
            message: result.error.message,
          });
          continue;
        }

        successes.push({
          fileName: file.name,
          resource: result.data.resource,
        });
      } catch (error_) {
        failures.push({
          fileName: file.name,
          code: 'UPLOAD_FAILED',
          message: error_ instanceof Error ? error_.message : 'Upload failed',
        });
      }
    }

    return ok({
      successes,
      failures,
      resources: successes.map((item) => item.resource),
    });
  }
}
