/**
 * Resource Stats Value Object - Server Implementation
 * 资源统计值对象 - 服务端实现
 */
import type { ResourceStatsServer, ResourceStatsServerDTO } from '@dailyuse/contracts/repository';

export class ResourceStats implements ResourceStatsServer {
  private _viewCount: number;
  private _editCount: number;
  private _linkCount: number;
  private _lastViewedAt?: number | null;
  private _lastEditedAt?: number | null;

  constructor(
    viewCount: number = 0,
    editCount: number = 0,
    linkCount: number = 0,
    lastViewedAt?: number | null,
    lastEditedAt?: number | null,
  ) {
    this._viewCount = viewCount;
    this._editCount = editCount;
    this._linkCount = linkCount;
    this._lastViewedAt = lastViewedAt ?? null;
    this._lastEditedAt = lastEditedAt ?? null;
  }

  // ===== Getters =====
  get viewCount(): number {
    return this._viewCount;
  }

  get editCount(): number {
    return this._editCount;
  }

  get linkCount(): number {
    return this._linkCount;
  }

  get lastViewedAt(): number | null | undefined {
    return this._lastViewedAt;
  }

  get lastEditedAt(): number | null | undefined {
    return this._lastEditedAt;
  }

  // ===== 业务方法 =====
  incrementViewCount(): void {
    this._viewCount++;
    this._lastViewedAt = new Date();
  }

  incrementEditCount(): void {
    this._editCount++;
    this._lastEditedAt = new Date();
  }

  updateLinkCount(count: number): void {
    this._linkCount = count;
  }

  // ===== DTO 转换 =====
  toServerDTO(): ResourceStatsServerDTO {
    return {
      viewCount: this._viewCount,
      editCount: this._editCount,
      linkCount: this._linkCount,
      lastViewedAt: this._lastViewedAt,
      lastEditedAt: this._lastEditedAt,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: ResourceStatsServerDTO): ResourceStats {
    return new ResourceStats(
      dto.viewCount,
      dto.editCount,
      dto.linkCount,
      dto.lastViewedAt,
      dto.lastEditedAt,
    );
  }

  static create(params?: Partial<ResourceStatsServerDTO>): ResourceStats {
    return new ResourceStats(
      params?.viewCount || 0,
      params?.editCount || 0,
      params?.linkCount || 0,
      params?.lastViewedAt,
      params?.lastEditedAt,
    );
  }
}
