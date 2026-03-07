/**
 * Repository Module - SQLite Composition Root
 */

import type Database from 'better-sqlite3';
import type { IRepositoryRepository } from '../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../domain-server/repositories/IFolderRepository';
import { RepositorySyncApplicationService } from '../application-server/use-cases/commands/repository-sync-application-service';
import { RepositoryContainer } from './di/repository-container-v2';
import {
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
} from './adapters/sqlite';

type BetterSQLiteDB = Database.Database;

export class RepositorySqliteModule {
  public readonly repositoryRepository: IRepositoryRepository;
  public readonly resourceRepository: IResourceRepository;
  public readonly folderRepository: IFolderRepository;

  public readonly syncService: RepositorySyncApplicationService;

  constructor(dbConnection: BetterSQLiteDB) {
    const repositoryRepository = new SqliteRepositoryRepository(dbConnection);
    const resourceRepository = new SqliteResourceRepository(dbConnection);
    const folderRepository = new SqliteFolderRepository(dbConnection);

    const container = RepositoryContainer.getInstance();
    container.reset();
    container.registerRepositoryRepository(repositoryRepository);
    container.registerResourceRepository(resourceRepository);
    container.registerFolderRepository(folderRepository);

    this.repositoryRepository = container.getRepositoryRepository();
    this.resourceRepository = container.getResourceRepository();
    this.folderRepository = container.getFolderRepository();

    this.syncService = new RepositorySyncApplicationService();
  }
}

export {
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
  RepositoryContainer,
};
