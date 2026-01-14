/**
 * ConflictResolution 值对象
 * 冲突解决结果
 */

import { ValueObject } from '@dailyuse/utils';
import {
  ConflictResolutionStrategy,
  type ConflictResolutionDTO,
} from '@dailyuse/contracts/sync';

/**
 * ConflictResolution 值对象
 *
 * 记录冲突是如何被解决的
 */
export class ConflictResolution extends ValueObject {
  public readonly strategy: ConflictResolutionStrategy;
  public readonly selectedVersion: 'local' | 'remote' | 'merged';
  public readonly resolvedData: unknown;
  public readonly resolvedAt: number;
  public readonly resolvedBy: string;
  public readonly notes?: string;

  private constructor(params: {
    strategy: ConflictResolutionStrategy;
    selectedVersion: 'local' | 'remote' | 'merged';
    resolvedData: unknown;
    resolvedAt: number;
    resolvedBy: string;
    notes?: string;
  }) {
    super();
    this.strategy = params.strategy;
    this.selectedVersion = params.selectedVersion;
    this.resolvedData = params.resolvedData;
    this.resolvedAt = params.resolvedAt;
    this.resolvedBy = params.resolvedBy;
    this.notes = params.notes;
    Object.freeze(this);
  }

  // ===== 静态工厂方法 =====

  /**
   * 选择本地版本
   */
  static createLocalWins(
    localData: unknown,
    resolvedBy: string,
  ): ConflictResolution {
    return new ConflictResolution({
      strategy: ConflictResolutionStrategy.LOCAL_WINS,
      selectedVersion: 'local',
      resolvedData: localData,
      resolvedAt: Date.now(),
      resolvedBy,
    });
  }

  /**
   * 选择远程版本
   */
  static createRemoteWins(
    remoteData: unknown,
    resolvedBy: string,
  ): ConflictResolution {
    return new ConflictResolution({
      strategy: ConflictResolutionStrategy.REMOTE_WINS,
      selectedVersion: 'remote',
      resolvedData: remoteData,
      resolvedAt: Date.now(),
      resolvedBy,
    });
  }

  /**
   * 手动合并
   */
  static createMerged(
    mergedData: unknown,
    resolvedBy: string,
    notes?: string,
  ): ConflictResolution {
    return new ConflictResolution({
      strategy: ConflictResolutionStrategy.MANUAL,
      selectedVersion: 'merged',
      resolvedData: mergedData,
      resolvedAt: Date.now(),
      resolvedBy,
      notes,
    });
  }

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: ConflictResolutionDTO): ConflictResolution {
    return new ConflictResolution({
      strategy: dto.strategy,
      selectedVersion: dto.selectedVersion,
      resolvedData: dto.resolvedData,
      resolvedAt: dto.resolvedAt,
      resolvedBy: dto.resolvedBy,
      notes: dto.notes,
    });
  }

  // ===== ValueObject 方法 =====

  equals(other: ValueObject): boolean {
    if (!(other instanceof ConflictResolution)) return false;
    return (
      this.strategy === other.strategy &&
      this.selectedVersion === other.selectedVersion &&
      this.resolvedAt === other.resolvedAt &&
      this.resolvedBy === other.resolvedBy
    );
  }

  // ===== DTO 转换 =====

  toDTO(): ConflictResolutionDTO {
    return {
      strategy: this.strategy,
      selectedVersion: this.selectedVersion,
      resolvedData: this.resolvedData,
      resolvedAt: this.resolvedAt,
      resolvedBy: this.resolvedBy,
      notes: this.notes,
    };
  }
}
