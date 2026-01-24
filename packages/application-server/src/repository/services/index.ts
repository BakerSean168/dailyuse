/**
 * Repository Services Index
 *
 * 瀵煎嚭All鏈?Repository 妯″潡鐨?Services
 */

// ===== Repository Application Service =====
export { RepositoryApplicationService } from './repository-application-service';

// ===== Repository Sync Application Service =====
export { RepositorySyncApplicationService } from './repository-sync-application-service';

// ===== Repository Permission Application Service =====
export { RepositoryPermissionApplicationService } from './repository-permission-application-service';

// ===== Repository 鐢ㄤ緥 =====
export { CreateRepository } from './create-repository';
export type { CreateRepositoryInput } from './create-repository';

export { GetRepository } from './get-repository';

export { ListRepositories } from './list-repositories';

export { UpdateRepositoryConfig } from './update-repository-config';
export type { UpdateRepositoryConfigInput } from './update-repository-config';

export { UpdateRepositoryStats } from './update-repository-stats';
export type { UpdateRepositoryStatsInput } from './update-repository-stats';

export { ArchiveRepository } from './archive-repository';

export { ActivateRepository } from './activate-repository';

export { DeleteRepository } from './delete-repository';

// ===== Resource 鐢ㄤ緥 =====
export { CreateResource } from './create-resource';
export type { CreateResourceInput } from './create-resource';

export { GetResource } from './get-resource';

export { ListResources } from './list-resources';

export { UpdateResourceContent } from './update-resource-content';
export type { UpdateResourceContentInput } from './update-resource-content';

export { DeleteResource } from './delete-resource';

// ===== Folder 鐢ㄤ緥 =====
export { CreateFolder } from './create-folder';
export type { CreateFolderInput } from './create-folder';

export { GetFolder } from './get-folder';

export { GetFolderTree } from './get-folder-tree';

export { RenameFolder } from './rename-folder';

export { MoveFolder } from './move-folder';

export { DeleteFolder } from './delete-folder';

// ===== Search Service =====
export { SearchService, createSearchService } from './search-application';

// ===== Tags Service =====
export { TagsService, createTagsService } from './tags-application';

// ===== Repository Statistics Service =====
export {
  RepositoryStatisticsService,
  getOrCreateStatistics,
  getStatistics,
  initializeStatistics,
  recalculateStatistics,
  handleStatisticsUpdateEvent,
  deleteStatistics,
} from './repository-statistics-application';

