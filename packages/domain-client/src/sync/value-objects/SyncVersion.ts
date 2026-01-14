/**
 * SyncVersion 值对象 (Client)
 * 同步版本 - 向量时钟
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  SyncVersionClientDTO,
  SyncVersionServerDTO,
  DeviceVersionEntry,
} from '@dailyuse/contracts/sync';

/**
 * SyncVersion 值对象
 *
 * 客户端同步版本表示，用于显示和比较
 */
export class SyncVersion extends ValueObject {
  public readonly logicalVersion: number;
  public readonly vectorClock: ReadonlyArray<DeviceVersionEntry>;
  public readonly lastModifiedBy: string;
  public readonly lastModifiedAt: number;

  private constructor(params: {
    logicalVersion: number;
    vectorClock: DeviceVersionEntry[];
    lastModifiedBy: string;
    lastModifiedAt: number;
  }) {
    super();
    this.logicalVersion = params.logicalVersion;
    this.vectorClock = Object.freeze([...params.vectorClock]);
    this.lastModifiedBy = params.lastModifiedBy;
    this.lastModifiedAt = params.lastModifiedAt;
  }

  // ===== 静态工厂方法 =====

  static fromClientDTO(dto: SyncVersionClientDTO): SyncVersion {
    return new SyncVersion({
      logicalVersion: dto.logicalVersion,
      vectorClock: dto.vectorClock,
      lastModifiedBy: dto.lastModifiedBy,
      lastModifiedAt: dto.lastModifiedAt,
    });
  }

  static fromServerDTO(dto: SyncVersionServerDTO): SyncVersion {
    return new SyncVersion({
      logicalVersion: dto.logicalVersion,
      vectorClock: dto.vectorClock,
      lastModifiedBy: dto.lastModifiedBy,
      lastModifiedAt: dto.lastModifiedAt,
    });
  }

  // ===== UI 辅助属性 =====

  /**
   * 格式化的最后修改时间
   */
  get lastModifiedAtFormatted(): string {
    return new Date(this.lastModifiedAt).toLocaleString();
  }

  /**
   * 相对时间描述
   */
  get lastModifiedAtRelative(): string {
    const now = Date.now();
    const diff = now - this.lastModifiedAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }

  /**
   * 版本显示文本
   */
  get versionDisplay(): string {
    return `v${this.logicalVersion}`;
  }

  /**
   * 参与同步的设备数量
   */
  get deviceCount(): number {
    return this.vectorClock.length;
  }

  // ===== ValueObject 方法 =====

  override equals(other: ValueObject): boolean {
    if (!(other instanceof SyncVersion)) return false;
    return (
      this.logicalVersion === other.logicalVersion &&
      this.lastModifiedBy === other.lastModifiedBy &&
      this.lastModifiedAt === other.lastModifiedAt
    );
  }

  // ===== DTO 转换 =====

  toClientDTO(): SyncVersionClientDTO {
    return {
      logicalVersion: this.logicalVersion,
      vectorClock: [...this.vectorClock],
      lastModifiedBy: this.lastModifiedBy,
      lastModifiedAt: this.lastModifiedAt,
    };
  }

  toServerDTO(): SyncVersionServerDTO {
    return {
      logicalVersion: this.logicalVersion,
      vectorClock: [...this.vectorClock],
      lastModifiedBy: this.lastModifiedBy,
      lastModifiedAt: this.lastModifiedAt,
    };
  }
}
