/**
 * Sync Profile Config Value Object
 * 同步配置值对象
 */

import type { SyncDirection } from './sync-direction';
import type { SyncStrategy } from './sync-strategy';
import type { ConflictResolutionStrategy } from './conflict-resolution-strategy';
import type { SyncableEntityType } from './syncable-entity-type';
import type { SyncProviderType } from './sync-provider-type';

// ============ Auto Sync Config ============

export interface AutoSyncConfigDTO {
  enabled: boolean;
  intervalMs: number;
  wifiOnly: boolean;
  syncOnStartup: boolean;
  syncOnChange: boolean;
  changeDebounceMs: number;
}

// ============ Sync Filter Config ============

export interface SyncFilterConfigDTO {
  entityTypes: SyncableEntityType[];
  includeDeleted: boolean;
  sinceTimestamp?: number;
}

// ============ Sync Profile Config ============

export interface SyncProfileConfigDTO {
  direction: SyncDirection;
  strategy: SyncStrategy;
  conflictStrategy: ConflictResolutionStrategy;
  autoSync: AutoSyncConfigDTO;
  filter: SyncFilterConfigDTO;
  compress: boolean;
  encrypt: boolean;
}

// ============ Provider Configs ============

export interface GitHubGistAuthConfigDTO {
  accessToken: string;
  tokenType: 'bearer' | 'oauth';
  expiresAt?: number;
  refreshToken?: string;
}

export interface GitHubGistProviderConfigDTO {
  type: 'GITHUB_GIST';
  auth: GitHubGistAuthConfigDTO;
  gistId?: string;
  gistDescription: string;
  isPrivate: boolean;
  splitStrategy: 'single-file' | 'per-entity-type' | 'per-entity';
}

export interface WebDAVProviderConfigDTO {
  type: 'WEBDAV';
  serverUrl: string;
  username: string;
  password: string;
  remotePath: string;
  supportLocking: boolean;
}

export type SyncProviderConfigDTO = GitHubGistProviderConfigDTO | WebDAVProviderConfigDTO;

// ============ 接口定义 ============

export interface ISyncProfileConfig {
  direction: SyncDirection;
  strategy: SyncStrategy;
  conflictStrategy: ConflictResolutionStrategy;
  autoSync: AutoSyncConfigDTO;
  filter: SyncFilterConfigDTO;
  compress: boolean;
  encrypt: boolean;

  equals(other: ISyncProfileConfig): boolean;
  with(updates: Partial<SyncProfileConfigDTO>): ISyncProfileConfig;
  toDTO(): SyncProfileConfigDTO;
}
