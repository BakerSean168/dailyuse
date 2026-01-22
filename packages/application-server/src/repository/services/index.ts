/**
 * Repository Services Index
 *
 * 导出所有 Repository 模块的 Services
 */

// ===== Repository 用例 =====
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

// ===== Resource 用例 =====
export { CreateResource } from './create-resource';
export type { CreateResourceInput } from './create-resource';

export { GetResource } from './get-resource';

export { ListResources } from './list-resources';

export { UpdateResourceContent } from './update-resource-content';
export type { UpdateResourceContentInput } from './update-resource-content';

export { DeleteResource } from './delete-resource';

// ===== Folder 用例 =====
export { CreateFolder } from './create-folder';
export type { CreateFolderInput } from './create-folder';

export { GetFolder } from './get-folder';

export { GetFolderTree } from './get-folder-tree';

export { RenameFolder } from './rename-folder';

export { MoveFolder } from './move-folder';

export { DeleteFolder } from './delete-folder';

// ===== Search Service =====
export { SearchService, search } from './search-application';

// ===== Tags Service =====
export { TagsService, getTagStatistics } from './tags-application';

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
