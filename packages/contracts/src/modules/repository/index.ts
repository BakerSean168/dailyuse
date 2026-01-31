/**
 * Repository Module - Explicit Exports
 * 仓库模块 - 显式导出
 */

// ============ Enums ============
export { RepositoryType, RepositoryStatus, ResourceType, ResourceStatus } from './enums';

// ============ Value Objects - Server ============
export type {
  RepositoryConfigServerDTO,
  RepositoryConfigServer,} from './value-objects/RepositoryConfigServer';

export type {
  RepositoryStatsServerDTO,
  RepositoryStatsServer,} from './value-objects/RepositoryStatsServer';

export type {
  FolderMetadataServerDTO,
  FolderMetadataServer,} from './value-objects/FolderMetadataServer';

export type {
  ResourceMetadataServerDTO,
  ResourceMetadataServer,} from './value-objects/ResourceMetadataServer';

export type {
  ResourceStatsServerDTO,
  ResourceStatsServer,} from './value-objects/ResourceStatsServer';

// ============ Value Objects - Client ============
export type {
  RepositoryConfigClientDTO,
  RepositoryConfigClient,} from './value-objects/RepositoryConfigClient';

export type {
  RepositoryStatsClientDTO,
  RepositoryStatsClient,} from './value-objects/RepositoryStatsClient';

export type {
  FolderMetadataClientDTO,
  FolderMetadataClient,} from './value-objects/FolderMetadataClient';

export type {
  ResourceMetadataClientDTO,
  ResourceMetadataClient,} from './value-objects/ResourceMetadataClient';

export type {
  ResourceStatsClientDTO,
  ResourceStatsClient,} from './value-objects/ResourceStatsClient';

// ============ Aggregates ============
export type {
  RepositoryServerDTO,
  RepositoryPersistenceDTO,
  RepositoryServer,} from './aggregates/RepositoryServer';

export type {
  RepositoryClientDTO,
  RepositoryClient,} from './aggregates/RepositoryClient';

export type {
  RepositoryStatisticsServerDTO,
  RepositoryStatisticsPersistenceDTO,
  RepositoryStatisticsServer,  RecalculateStatisticsRequest,
  RecalculateStatisticsResponse,
  StatisticsUpdateEvent,
} from './aggregates/RepositoryStatisticsServer';

// ============ Entities ============
export type {
  FolderServerDTO,
  FolderPersistenceDTO,
  FolderServer,} from './entities/FolderServer';

export type { FolderClientDTO, FolderClient } from './entities/FolderClient';

export type {
  ResourceServerDTO,
  ResourcePersistenceDTO,
  ResourceServer,} from './entities/ResourceServer';

export type {
  ResourceClientDTO,
  ResourceClient,} from './entities/ResourceClient';

// ============ DTOs (File Tree - Story 11.1) ============
export type { TreeNodeType, TreeNode, FileTreeResponse } from './TreeNode';

// ============ DTOs (Search - Story 11.2) ============
export type {
  SearchMode,
  SearchRequest,
  SearchMatch,
  MatchType,
  SearchResultItem,
  SearchResponse,
} from './SearchContracts';

// ============ DTOs (Bookmark - Story 11.4) ============
export type {
  BookmarkTargetType,
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  BookmarkListResponse,
} from './BookmarkContracts';

// ============ DTOs (Tags - Story 11.5) ============
export type { TagStatisticsDto, TagResourceReferenceDto } from './TagsContracts';

// ============ DTOs (Resource Upload - Story 11.x) ============
export type {
  ImageEmbedMode,
  ResourceUploadResult,
  ResourceUploadRequest,
  BatchUploadResult,
  Resource,
  ResourceMetadata,
  ResourceListQuery,
  ResourceListResponse,
  ResourceMoveRequest,
  ResourceRenameRequest,
  ResourceDeleteRequest,
  ImageCompressionSettings,
  ImageEmbedSettings,
} from './ResourceContracts';

// ============ Constants (Upload) ============
export { RESOURCE_UPLOAD_CONFIG } from './ResourceContracts';
export type { ResourceUploadConfig } from './ResourceContracts';
