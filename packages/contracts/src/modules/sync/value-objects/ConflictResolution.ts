/**
 * Conflict Resolution Value Object
 * 冲突解决方案值对象
 */

import type { ConflictResolutionStrategy } from '../enums';

// ============ DTO 定义 ============

export interface ConflictResolutionDTO {
  strategy: ConflictResolutionStrategy;
  selectedVersion: 'local' | 'remote' | 'merged';
  resolvedData: unknown;
  resolvedAt: number;
  resolvedBy: string;
  notes?: string;
}

// ============ 接口定义 ============

export interface IConflictResolution {
  strategy: ConflictResolutionStrategy;
  selectedVersion: 'local' | 'remote' | 'merged';
  resolvedData: unknown;
  resolvedAt: number;
  resolvedBy: string;
  notes?: string;

  equals(other: IConflictResolution): boolean;
  toDTO(): ConflictResolutionDTO;
}

export interface IConflictResolutionStatic {
  createLocalWins(localData: unknown, resolvedBy: string): IConflictResolution;
  createRemoteWins(remoteData: unknown, resolvedBy: string): IConflictResolution;
  createMerged(mergedData: unknown, resolvedBy: string, notes?: string): IConflictResolution;
  fromDTO(dto: ConflictResolutionDTO): IConflictResolution;
}
