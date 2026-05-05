/**
 * ResourceStats 值对象
 * 
 * 资源统计：查看次数、编辑次数、链接数、最后访问时间
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ResourceStats as IResourceStats,
  ResourceStatsDTO,
} from '@dailyuse/contracts/repository';
import type { DomainDate } from '@dailyuse/contracts/primitives';

/**
 * ResourceStats 值对象实现
 */
export class ResourceStats extends ValueObject<ResourceStatsDTO> implements IResourceStats {

  private constructor(props: ResourceStatsDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ResourceStatsDTO): ResourceStats {
    return new ResourceStats(props);
  }

  public static createEmpty(): ResourceStats {
    return new ResourceStats({
      viewCount: 0,
      editCount: 0,
      linkCount: 0,
      lastViewedAt: null,
      lastEditedAt: null,
    });
  }

  public static fromDTO(dto: ResourceStatsDTO): ResourceStats {
    return new ResourceStats(dto);
  }

  // ================= Getters =================

  public get viewCount(): number {
    return this.props.viewCount;
  }

  public get editCount(): number {
    return this.props.editCount;
  }

  public get linkCount(): number {
    return this.props.linkCount;
  }

  public get lastViewedAt(): number | null {
    return this.props.lastViewedAt;
  }

  public get lastEditedAt(): number | null {
    return this.props.lastEditedAt;
  }

  // ================= 行为方法 =================

  public recordView(): ResourceStats {
    return new ResourceStats({
      ...this.props,
      viewCount: this.props.viewCount + 1,
      lastViewedAt: Date.now(),
    });
  }

  public recordEdit(): ResourceStats {
    return new ResourceStats({
      ...this.props,
      editCount: this.props.editCount + 1,
      lastEditedAt: Date.now(),
    });
  }

  public incrementLinks(count: number = 1): ResourceStats {
    return new ResourceStats({
      ...this.props,
      linkCount: this.props.linkCount + count,
    });
  }

  public decrementLinks(count: number = 1): ResourceStats {
    return new ResourceStats({
      ...this.props,
      linkCount: Math.max(0, this.props.linkCount - count),
    });
  }

  // ================= 计算属性 =================

  public get hasBeenViewed(): boolean {
    return this.props.viewCount > 0;
  }

  public get hasBeenEdited(): boolean {
    return this.props.editCount > 0;
  }

  public get hasLinks(): boolean {
    return this.props.linkCount > 0;
  }

  public get lastViewedDate(): DomainDate | null {
    return this.props.lastViewedAt !== null ? new Date(this.props.lastViewedAt) : null;
  }

  public get lastEditedDate(): DomainDate | null {
    return this.props.lastEditedAt !== null ? new Date(this.props.lastEditedAt) : null;
  }

  public get daysSinceLastView(): number | null {
    if (this.props.lastViewedAt === null) return null;
    const diff = Date.now() - this.props.lastViewedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // ================= 序列化 =================

  public toDTO(): ResourceStatsDTO {
    return { ...this.props };
  }
}
