import * as path from 'node:path';
import { app } from 'electron';
import type Database from 'better-sqlite3';
import { ResourceType, RepositoryStatus } from '@dailyuse/contracts/repository';
import type {
  CreateKnowledgeNotePersistenceInput,
  CreateKnowledgeNotePersistenceResult,
  IKnowledgeNotePersistencePort,
} from '@dailyuse/ai/application-server';
import { CreateResource, FsStorageAdapter } from '@dailyuse/repository';
import { RepositorySqliteModule } from '@dailyuse/repository/infrastructure-server/sqlite';

export class DesktopKnowledgeNotePersistenceAdapter implements IKnowledgeNotePersistencePort {
  private readonly repositoryModule: RepositorySqliteModule;
  private readonly createResource: CreateResource;

  constructor(db: Database.Database) {
    this.repositoryModule = new RepositorySqliteModule(db);

    const storageBaseDir = path.join(app.getPath('userData'), 'repository-storage');
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
