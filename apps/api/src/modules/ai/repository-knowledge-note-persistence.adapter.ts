import { ResourceType, RepositoryStatus } from '@dailyuse/contracts/repository';
import type { PrismaClient } from '@dailyuse/database';
import type {
  CreateKnowledgeNotePersistenceInput,
  CreateKnowledgeNotePersistenceResult,
  IKnowledgeNotePersistencePort,
} from '@dailyuse/ai/application-server';
import { CreateResource, FsStorageAdapter, RepositoryModule } from '@dailyuse/repository';

export class RepositoryKnowledgeNotePersistenceAdapter implements IKnowledgeNotePersistencePort {
  private readonly repositoryModule: RepositoryModule;
  private readonly createResource: CreateResource;

  constructor(db: PrismaClient, storageBaseDir: string) {
    this.repositoryModule = new RepositoryModule('prisma', db);
    const storagePort = new FsStorageAdapter(storageBaseDir);
    this.createResource = new CreateResource(
      this.repositoryModule.resourceRepository,
      this.repositoryModule.repositoryRepository,
      storagePort,
    );
  }

  async createKnowledgeNote(
    input: CreateKnowledgeNotePersistenceInput,
  ): Promise<CreateKnowledgeNotePersistenceResult> {
    const repository = await this.resolveRepository(input.identityId);
    const result = await this.createResource.execute({
      repositoryId: String(repository.id),
      identityId: input.identityId,
      name: input.fileName,
      type: ResourceType.File,
      path: input.path,
      content: input.content,
    });

    return { resource: result.resource };
  }

  private async resolveRepository(identityId: string) {
    const activeRepositories =
      await this.repositoryModule.repositoryRepository.findByIdentityIdAndStatus(
        identityId,
        RepositoryStatus.Active,
      );

    const repository =
      activeRepositories[0] ??
      (await this.repositoryModule.repositoryRepository.findByIdentityId(identityId))[0];

    if (!repository) {
      throw new Error('No repository available for current user');
    }

    return repository;
  }
}
