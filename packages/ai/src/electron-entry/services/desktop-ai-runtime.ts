import * as path from 'node:path';
import { app } from 'electron';
import type Database from 'better-sqlite3';
import { RepositorySqliteModule } from '@dailyuse/repository/infrastructure-server/sqlite';
import { FsStorageAdapter } from '@dailyuse/repository';
import { OpenAICompatibleGateway } from '../../infrastructure-server/gateways/openai-compatible.gateway';
import { DefaultRepositoryResolver } from '../../infrastructure-server/services/default-repository-resolver';
import { RepositoryResourceWriter } from '../../infrastructure-server/services/repository-resource-writer';
import { AIKnowledgeNotePathResolver } from '../../infrastructure-server/services/ai-knowledge-note-path-resolver';
import { AIKnowledgeNoteService } from '../../application-server/use-cases/commands/ai-knowledge-note.service';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/IAIProviderConfigRepository';

export class DesktopAIRuntime {
  public readonly knowledgeNoteService: AIKnowledgeNoteService;

  constructor(
    db: Database.Database,
    providerConfigRepository: IAIProviderConfigRepository,
    getKnowledgeNoteSubpath: (identityId: string) => Promise<string>,
  ) {
    const repositoryModule = new RepositorySqliteModule(db);
    const storageBaseDir = path.join(app.getPath('userData'), 'repository-storage');
    const storagePort = new FsStorageAdapter(storageBaseDir);

    this.knowledgeNoteService = new AIKnowledgeNoteService(
      providerConfigRepository,
      new OpenAICompatibleGateway(),
      new DefaultRepositoryResolver(repositoryModule.repositoryRepository),
      new RepositoryResourceWriter(
        repositoryModule.resourceRepository,
        repositoryModule.repositoryRepository,
        storagePort,
      ),
      getKnowledgeNoteSubpath,
      new AIKnowledgeNotePathResolver(),
    );
  }
}
