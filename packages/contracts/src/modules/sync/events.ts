/**
 * Sync Module Events
 * 同步模块领域事件定义
 */

import type { SyncSessionStatus, SyncDirection, SyncStrategy, SyncTriggerType, SyncProviderType, SyncableEntityType, ConflictStatus } from './value-objects';
import type { EntityReferenceDTO, SyncVersionServerDTO, ConflictResolutionDTO, SyncSessionStatsDTO, DeviceInfoDTO } from './value-objects';

// ============ 事件名常量 ============

export const SyncEvents = {
  // Session
  SESSION_CREATED: 'sync:session:created',
  SESSION_STARTED: 'sync:session:started',
  SESSION_PROGRESS: 'sync:session:progress',
  SESSION_COMPLETED: 'sync:session:completed',
  SESSION_FAILED: 'sync:session:failed',
  SESSION_CANCELLED: 'sync:session:cancelled',
  // Conflict
  CONFLICT_DETECTED: 'sync:conflict:detected',
  CONFLICT_RESOLVED: 'sync:conflict:resolved',
  // Profile
  PROFILE_CREATED: 'sync:profile:created',
  PROFILE_UPDATED: 'sync:profile:updated',
  PROFILE_ACTIVATED: 'sync:profile:activated',
  PROVIDER_CONNECTED: 'sync:provider:connected',
  PROVIDER_DISCONNECTED: 'sync:provider:disconnected',
  // Change
  CHANGE_RECORDED: 'sync:change:recorded',
  CHANGE_SYNCED: 'sync:change:synced',
} as const;

export type SyncEventType = typeof SyncEvents[keyof typeof SyncEvents];

// ============ 基础事件接口 ============

export interface BaseSyncDomainEvent {
  eventId: string;
  occurredAt: number;
  deviceId: string;
  version: number;
}

// ============ Session 事件 ============

export interface SyncSessionCreatedEvent extends BaseSyncDomainEvent {
  type: 'sync:session:created';
  payload: {
    sessionId: string;
    profileId: string;
    direction: SyncDirection;
    strategy: SyncStrategy;
    triggerType: SyncTriggerType;
  };
}

export interface SyncSessionStartedEvent extends BaseSyncDomainEvent {
  type: 'sync:session:started';
  payload: {
    sessionId: string;
    startedAt: number;
    expectedEntityCount: number;
  };
}

export interface SyncSessionProgressEvent extends BaseSyncDomainEvent {
  type: 'sync:session:progress';
  payload: {
    sessionId: string;
    currentEntity?: EntityReferenceDTO;
    processedCount: number;
    totalCount: number;
    percentage: number;
    phase: 'collecting' | 'uploading' | 'downloading' | 'merging' | 'applying';
  };
}

export interface SyncSessionCompletedEvent extends BaseSyncDomainEvent {
  type: 'sync:session:completed';
  payload: {
    sessionId: string;
    completedAt: number;
    statistics: SyncSessionStatsDTO;
    newVersion: SyncVersionServerDTO;
  };
}

export interface SyncSessionFailedEvent extends BaseSyncDomainEvent {
  type: 'sync:session:failed';
  payload: {
    sessionId: string;
    failedAt: number;
    error: { code: string; message: string; details?: unknown };
    canRetry: boolean;
  };
}

export interface SyncSessionCancelledEvent extends BaseSyncDomainEvent {
  type: 'sync:session:cancelled';
  payload: {
    sessionId: string;
    cancelledAt: number;
    cancelledBy: 'user' | 'system';
    reason?: string;
  };
}

// ============ Conflict 事件 ============

export interface ConflictDetectedEvent extends BaseSyncDomainEvent {
  type: 'sync:conflict:detected';
  payload: {
    conflictId: string;
    sessionId: string;
    entityRef: EntityReferenceDTO;
    localVersion: SyncVersionServerDTO;
    remoteVersion: SyncVersionServerDTO;
    conflictType: 'update-update' | 'update-delete' | 'delete-update';
    autoResolvable: boolean;
  };
}

export interface ConflictResolvedEvent extends BaseSyncDomainEvent {
  type: 'sync:conflict:resolved';
  payload: {
    conflictId: string;
    sessionId: string;
    entityRef: EntityReferenceDTO;
    resolution: ConflictResolutionDTO;
  };
}

// ============ Profile 事件 ============

export interface SyncProfileCreatedEvent extends BaseSyncDomainEvent {
  type: 'sync:profile:created';
  payload: {
    profileId: string;
    profileName: string;
    providerType: SyncProviderType;
  };
}

export interface SyncProfileUpdatedEvent extends BaseSyncDomainEvent {
  type: 'sync:profile:updated';
  payload: {
    profileId: string;
    changes: { field: string; oldValue: unknown; newValue: unknown }[];
  };
}

export interface ProviderConnectedEvent extends BaseSyncDomainEvent {
  type: 'sync:provider:connected';
  payload: {
    profileId: string;
    providerType: SyncProviderType;
    connectedAt: number;
  };
}

export interface ProviderDisconnectedEvent extends BaseSyncDomainEvent {
  type: 'sync:provider:disconnected';
  payload: {
    profileId: string;
    providerType: SyncProviderType;
    disconnectedAt: number;
    reason?: 'manual' | 'error' | 'token_expired';
  };
}

// ============ Change 事件 ============

export interface EntityChangeRecordedEvent extends BaseSyncDomainEvent {
  type: 'sync:change:recorded';
  payload: {
    changeId: string;
    entityRef: EntityReferenceDTO;
    operation: 'create' | 'update' | 'delete';
    version: SyncVersionServerDTO;
  };
}

export interface ChangeSyncedEvent extends BaseSyncDomainEvent {
  type: 'sync:change:synced';
  payload: {
    changeId: string;
    entityRef: EntityReferenceDTO;
    sessionId: string;
    syncedAt: number;
  };
}

// ============ 联合类型 ============

export type SyncDomainEvent =
  | SyncSessionCreatedEvent
  | SyncSessionStartedEvent
  | SyncSessionProgressEvent
  | SyncSessionCompletedEvent
  | SyncSessionFailedEvent
  | SyncSessionCancelledEvent
  | ConflictDetectedEvent
  | ConflictResolvedEvent
  | SyncProfileCreatedEvent
  | SyncProfileUpdatedEvent
  | ProviderConnectedEvent
  | ProviderDisconnectedEvent
  | EntityChangeRecordedEvent
  | ChangeSyncedEvent;
