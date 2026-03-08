import { ResourceType } from '@dailyuse/contracts/repository';
import type { IRepositoryRepository } from '@dailyuse/repository';
import type { IResourceRepository } from '@dailyuse/repository';
import { CreateResource } from '@dailyuse/repository';
import type { IStoragePort } from '@dailyuse/repository';

export class RepositoryResourceWriter {
  private readonly createResource: CreateResource;

  constructor(
    resourceRepository: IResourceRepository,
    repositoryRepository: IRepositoryRepository,
    storagePort: IStoragePort,
  ) {
    this.createResource = new CreateResource(resourceRepository, repositoryRepository, storagePort);
  }

  async createMarkdownNote(input: {
    repositoryId: string;
    identityId: string;
    path: string;
    fileName: string;
    content: string;
  }) {
    return this.createResource.execute({
      repositoryId: input.repositoryId,
      identityId: input.identityId,
      name: input.fileName,
      type: ResourceType.File,
      path: input.path,
      content: input.content,
    });
  }
}
