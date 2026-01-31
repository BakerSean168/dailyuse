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
