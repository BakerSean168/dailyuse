import { ResourceType } from '@dailyuse/contracts/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { PrismaClient } from '@dailyuse/database';
import type {
  CreateKnowledgeNotePersistenceInput,
  CreateKnowledgeNotePersistenceResult,
  IKnowledgeNotePersistencePort,
} from '@dailyuse/ai/ports';
import {
  createRepositoryPrismaModule,
  type RepositoryModuleInstance,
} from '@dailyuse/repository/api';

/**
 * Adapter that persists AI knowledge notes via the repository module's
 * application port — never bypassing it with raw repository access.
 *
 * 通过仓库模块的应用层门面持久化 AI 知识笔记的适配器 ——
 * 绝不绕过门面直接访问原始仓储。
 */
export class RepositoryKnowledgeNotePersistenceAdapter implements IKnowledgeNotePersistencePort {
  private readonly repositoryModule: RepositoryModuleInstance;

  constructor(db: PrismaClient, storageBaseDir: string) {
    this.repositoryModule = createRepositoryPrismaModule(db, {
      storageBaseDir,
    });
  }

  async createKnowledgeNote(
    input: CreateKnowledgeNotePersistenceInput,
  ): Promise<CreateKnowledgeNotePersistenceResult> {
    // Resolve the active repository through the application port.
    // 通过应用层门面解析活跃仓库。
    const repoResult = await this.repositoryModule.api.findActiveRepository(input.identityId);
    if (!repoResult.ok) {
      throw new Error('No repository available for current user');
    }
    const repository = repoResult.data as { id: string };

    // Create the resource through the application port.
    // 通过应用层门面创建资源。
    const createResult = await this.repositoryModule.api.createResource(
      {
        repositoryId: String(repository.id),
        name: input.fileName,
        type: ResourceType.File,
        content: input.content,
      },
      { identityId: input.identityId, deviceId: 'api-server' },
    );

    if (!createResult.ok) {
      throw new Error('Failed to create knowledge note resource');
    }

    return { resource: createResult.data as ResourceClientDTO };
  }
}
