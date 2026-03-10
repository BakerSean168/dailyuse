import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IRepositoryRepository } from '../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../domain-server/repositories/IFolderRepository';
import { RepositorySyncApplicationService } from '../application-server/use-cases/commands/repository-sync-application-service';
import { RepositoryContainer } from './di/repository-container-v2';
import {
  PowerSyncRepositoryRepository,
  PowerSyncResourceRepository,
  PowerSyncFolderRepository,
} from './adapters/powersync';

export class RepositoryPowerSyncModule {
  public readonly repositoryRepository: IRepositoryRepository;
  public readonly resourceRepository: IResourceRepository;
  public readonly folderRepository: IFolderRepository;

  public readonly syncService: RepositorySyncApplicationService;

  constructor(dbConnection: IElectronDatabase) {
    const repositoryRepository = new PowerSyncRepositoryRepository(dbConnection);
    const resourceRepository = new PowerSyncResourceRepository(dbConnection);
    const folderRepository = new PowerSyncFolderRepository(dbConnection);

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
  PowerSyncRepositoryRepository,
  PowerSyncResourceRepository,
  PowerSyncFolderRepository,
  RepositoryContainer,
};
