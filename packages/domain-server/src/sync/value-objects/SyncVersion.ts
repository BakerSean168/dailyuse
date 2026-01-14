/**
 * SyncVersion 值对象
 * 同步版本（向量时钟）- 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  DeviceVersionEntry,
  SyncVersionServerDTO,
  SyncVersionClientDTO,
  SyncVersionPersistenceDTO,
} from '@dailyuse/contracts/sync';

/**
 * SyncVersion 值对象
 *
 * 使用向量时钟实现分布式版本控制：
 * - 每个设备维护自己的版本号
 * - 可以检测并发修改和冲突
 * - 支持因果关系判断
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
    Object.freeze(this);
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建初始版本
   */
  static create(deviceId: string): SyncVersion {
    const now = Date.now();
    return new SyncVersion({
      logicalVersion: 1,
      vectorClock: [{ deviceId, version: 1, updatedAt: now }],
      lastModifiedBy: deviceId,
      lastModifiedAt: now,
    });
  }

  /**
   * 从 ServerDTO 创建
   */
  static fromServerDTO(dto: SyncVersionServerDTO): SyncVersion {
    return new SyncVersion({
      logicalVersion: dto.logicalVersion,
      vectorClock: dto.vectorClock,
      lastModifiedBy: dto.lastModifiedBy,
      lastModifiedAt: dto.lastModifiedAt,
    });
  }

  /**
   * 从 PersistenceDTO 创建
   */
  static fromPersistenceDTO(dto: SyncVersionPersistenceDTO): SyncVersion {
    return new SyncVersion({
      logicalVersion: dto.logicalVersion,
      vectorClock: JSON.parse(dto.vectorClockJson),
      lastModifiedBy: dto.lastModifiedBy,
      lastModifiedAt: dto.lastModifiedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 递增版本（当前设备做了修改）
   */
  increment(deviceId: string): SyncVersion {
    const now = Date.now();
    const newClock = [...this.vectorClock];
    const deviceEntry = newClock.find((e) => e.deviceId === deviceId);

    if (deviceEntry) {
      const index = newClock.indexOf(deviceEntry);
      newClock[index] = {
        ...deviceEntry,
        version: deviceEntry.version + 1,
        updatedAt: now,
      };
    } else {
      newClock.push({ deviceId, version: 1, updatedAt: now });
    }

    return new SyncVersion({
      logicalVersion: this.logicalVersion + 1,
      vectorClock: newClock,
      lastModifiedBy: deviceId,
      lastModifiedAt: now,
    });
  }

  /**
   * 合并两个版本（取每个设备的最大值）
   */
  merge(other: SyncVersion): SyncVersion {
    const now = Date.now();
    const mergedClock: DeviceVersionEntry[] = [];
    const allDevices = new Set([
      ...this.vectorClock.map((e) => e.deviceId),
      ...other.vectorClock.map((e) => e.deviceId),
    ]);

    for (const deviceId of allDevices) {
      const thisEntry = this.vectorClock.find((e) => e.deviceId === deviceId);
      const otherEntry = other.vectorClock.find((e) => e.deviceId === deviceId);

      if (thisEntry && otherEntry) {
        mergedClock.push(
          thisEntry.version >= otherEntry.version ? thisEntry : otherEntry,
        );
      } else {
        mergedClock.push(thisEntry || otherEntry!);
      }
    }

    return new SyncVersion({
      logicalVersion: Math.max(this.logicalVersion, other.logicalVersion) + 1,
      vectorClock: mergedClock,
      lastModifiedBy: this.lastModifiedBy,
      lastModifiedAt: now,
    });
  }

  /**
   * 判断是否发生在另一个版本之前（因果关系）
   */
  happenedBefore(other: SyncVersion): boolean {
    let atLeastOneLess = false;

    for (const entry of this.vectorClock) {
      const otherEntry = other.vectorClock.find(
        (e) => e.deviceId === entry.deviceId,
      );
      const otherVersion = otherEntry?.version ?? 0;

      if (entry.version > otherVersion) {
        return false;
      }
      if (entry.version < otherVersion) {
        atLeastOneLess = true;
      }
    }

    // 检查 other 中有但 this 中没有的设备
    for (const entry of other.vectorClock) {
      const thisEntry = this.vectorClock.find(
        (e) => e.deviceId === entry.deviceId,
      );
      if (!thisEntry && entry.version > 0) {
        atLeastOneLess = true;
      }
    }

    return atLeastOneLess;
  }

  /**
   * 判断是否与另一个版本冲突（并发修改）
   */
  isConflict(other: SyncVersion): boolean {
    return !this.happenedBefore(other) && !other.happenedBefore(this) && !this.equals(other);
  }

  /**
   * 获取设备版本
   */
  getDeviceVersion(deviceId: string): number {
    return this.vectorClock.find((e) => e.deviceId === deviceId)?.version ?? 0;
  }

  // ===== ValueObject 方法 =====

  equals(other: ValueObject): boolean {
    if (!(other instanceof SyncVersion)) return false;
    if (this.logicalVersion !== other.logicalVersion) return false;
    if (this.vectorClock.length !== other.vectorClock.length) return false;

    for (const entry of this.vectorClock) {
      const otherEntry = other.vectorClock.find(
        (e) => e.deviceId === entry.deviceId,
      );
      if (!otherEntry || entry.version !== otherEntry.version) return false;
    }
    return true;
  }

  // ===== DTO 转换 =====

  toServerDTO(): SyncVersionServerDTO {
    return {
      logicalVersion: this.logicalVersion,
      vectorClock: [...this.vectorClock],
      lastModifiedBy: this.lastModifiedBy,
      lastModifiedAt: this.lastModifiedAt,
    };
  }

  toClientDTO(): SyncVersionClientDTO {
    return this.toServerDTO();
  }

  toPersistenceDTO(): SyncVersionPersistenceDTO {
    return {
      logicalVersion: this.logicalVersion,
      vectorClockJson: JSON.stringify(this.vectorClock),
      lastModifiedBy: this.lastModifiedBy,
      lastModifiedAt: this.lastModifiedAt,
    };
  }
}
