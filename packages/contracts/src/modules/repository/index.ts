/**
 * Repository Module - Explicit Exports
 * 仓库模块 - 显式导出
 */

// ============ Enums ============
export { RepositoryType, RepositoryStatus, ResourceType, ResourceStatus } from './enums';

// ============ Value Objects ============
export type {
  RepositoryConfigDTO,
  RepositoryConfigClientDTO,
  RepositoryConfig,
  RepositoryConfigClient,
  // Backward compatibility
  RepositoryConfigServerDTO,
  RepositoryConfigServer,
} from './value-objects/repository-config';

export type {
  RepositoryStatsDTO,
  RepositoryStatsClientDTO,
  RepositoryStats,
  RepositoryStatsClient,
  // Backward compatibility
  RepositoryStatsServerDTO,
  RepositoryStatsServer,
} from './value-objects/repository-stats';

export type {
  FolderMetadataDTO,
  FolderMetadataClientDTO,
  FolderMetadata,
  FolderMetadataClient,
  // Backward compatibility
  FolderMetadataServerDTO,
  FolderMetadataServer,
} from './value-objects/folder-metadata';

export type {
  ResourceMetadataDTO,
  ResourceMetadataClientDTO,
  ResourceMetadata,
  ResourceMetadataClient,
  // Backward compatibility
  ResourceMetadataServerDTO,
  ResourceMetadataServer,
} from './value-objects/resource-metadata';

export type {
  ResourceStatsDTO,
  ResourceStatsClientDTO,
  ResourceStats,
  ResourceStatsClient,
  // Backward compatibility
  ResourceStatsServerDTO,
  ResourceStatsServer,
} from './value-objects/resource-stats';

// ============ Aggregates ============
export type {
  RepositoryServerDTO,
  RepositoryPersistenceDTO,
  RepositoryServer,
} from './aggregates/repository-server';

export type {
  RepositoryClientDTO,
  RepositoryClient,
} from './aggregates/repository-client';

export type {
  RepositoryStatisticsServerDTO,
  RepositoryStatisticsPersistenceDTO,
  RepositoryStatisticsServer,
  RecalculateStatisticsRequest,
  RecalculateStatisticsResponse,
  StatisticsUpdateEvent,
} from './aggregates/repository-statistics-server';

// ============ Entities ============
export type {
  FolderServerDTO,
  FolderPersistenceDTO,
  FolderServer,
} from './entities/folder-server';

export type { FolderClientDTO, FolderClient } from './entities/folder-client';

export type {
  ResourceServerDTO,
  ResourcePersistenceDTO,
  ResourceServer,
} from './entities/resource-server';

export type {
  ResourceClientDTO,
  ResourceClient,
} from './entities/resource-client';

// ============ DTOs (File Tree - Story 11.1) ============
export type { TreeNodeType, TreeNode, FileTreeResponse } from './tree-node';

// ============ DTOs (Search - Story 11.2) ============
export type {
  SearchMode,
  SearchRequest,
  SearchMatch,
  MatchType,
  SearchResultItem,
  SearchResponse,
} from './search-contracts';

// ============ DTOs (Bookmark - Story 11.4) ============
export type {
  BookmarkTargetType,
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  BookmarkListResponse,
} from './bookmark-contracts';

// ============ DTOs (Tags - Story 11.5) ============
export type { TagStatisticsDto, TagResourceReferenceDto } from './tags-contracts';

// ============ DTOs (Resource Upload - Story 11.x) ============
export type {
  ImageEmbedMode,
  ResourceUploadResult,
  ResourceUploadRequest,
  BatchUploadResult,
  Resource,
  ResourceMetadata as ResourceContractMetadata,
  ResourceListQuery,
  ResourceListResponse,
  ResourceMoveRequest,
  ResourceRenameRequest,
  ResourceDeleteRequest,
  ImageCompressionSettings,
  ImageEmbedSettings,
} from './resource-contracts';

// ============ Constants (Upload) ============
export { RESOURCE_UPLOAD_CONFIG } from './resource-contracts';
export type { ResourceUploadConfig } from './resource-contracts';
