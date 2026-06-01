/**
 * RepositoryStats 值对象
 * 
 * 仓储统计：资源数、文件夹数、总大小
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  RepositoryStats as IRepositoryStats,
  RepositoryStatsDTO,
} from '@dailyuse/contracts/repository';

/**
 * RepositoryStats 值对象实现
 */
export class RepositoryStats extends ValueObject<RepositoryStatsDTO> implements IRepositoryStats {

  private constructor(props: RepositoryStatsDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: RepositoryStatsDTO): RepositoryStats {
    return new RepositoryStats(props);
  }

  public static createEmpty(): RepositoryStats {
    return new RepositoryStats({
      resourceCount: 0,
      folderCount: 0,
      totalSize: 0,
    });
  }

  public static fromDTO(dto: RepositoryStatsDTO): RepositoryStats {
    return new RepositoryStats(dto);
  }

  // ================= Getters =================

  public get resourceCount(): number {
    return this.props.resourceCount;
  }

  public get folderCount(): number {
    return this.props.folderCount;
  }

  public get totalSize(): number {
    return this.props.totalSize;
  }

  // ================= 行为方法 =================

  public incrementResources(count: number = 1): RepositoryStats {
    return new RepositoryStats({
      ...this.props,
      resourceCount: this.props.resourceCount + count,
    });
  }

  public incrementFolders(count: number = 1): RepositoryStats {
    return new RepositoryStats({
      ...this.props,
      folderCount: this.props.folderCount + count,
    });
  }

  public addSize(bytes: number): RepositoryStats {
    return new RepositoryStats({
      ...this.props,
      totalSize: this.props.totalSize + bytes,
    });
  }

  // ================= 计算属性 =================

  public get formattedSize(): string {
    const bytes = this.props.totalSize;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  public get hasResources(): boolean {
    return this.props.resourceCount > 0;
  }

  public get hasFolders(): boolean {
    return this.props.folderCount > 0;
  }

  public get isEmpty(): boolean {
    return !this.hasResources && !this.hasFolders;
  }

  // ================= 序列化 =================

  public toDTO(): RepositoryStatsDTO {
    return { ...this.props };
  }
}
