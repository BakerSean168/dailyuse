/**
 * GroupStats 值对象
 * 
 * 分组统计信息：模板数量、活跃/暂停状态
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IGroupStatsServer,
  GroupStatsServerDTO,
  GroupStatsPersistenceDTO,
} from '@dailyuse/contracts/reminder';

/**
 * GroupStats 值对象实现
 */
export class GroupStats extends ValueObject<GroupStatsServerDTO> implements IGroupStatsServer {

  private constructor(props: GroupStatsServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: GroupStatsServerDTO): GroupStats {
    return new GroupStats(props);
  }

  public static createEmpty(): GroupStats {
    return new GroupStats({
      totalTemplates: 0,
      activeTemplates: 0,
      pausedTemplates: 0,
      selfEnabledTemplates: 0,
      selfPausedTemplates: 0,
    });
  }

  public static fromDTO(dto: GroupStatsServerDTO): GroupStats {
    return new GroupStats(dto);
  }

  public static fromPersistenceDTO(dto: GroupStatsPersistenceDTO): GroupStats {
    return new GroupStats({
      totalTemplates: dto.total_templates,
      activeTemplates: dto.active_templates,
      pausedTemplates: dto.paused_templates,
      selfEnabledTemplates: dto.self_enabled_templates,
      selfPausedTemplates: dto.self_paused_templates,
    });
  }

  // ================= Getters =================

  public get totalTemplates(): number {
    return this.props.totalTemplates;
  }

  public get activeTemplates(): number {
    return this.props.activeTemplates;
  }

  public get pausedTemplates(): number {
    return this.props.pausedTemplates;
  }

  public get selfEnabledTemplates(): number {
    return this.props.selfEnabledTemplates;
  }

  public get selfPausedTemplates(): number {
    return this.props.selfPausedTemplates;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<GroupStatsServerDTO>,
  ): GroupStats {
    return new GroupStats({ ...this.props, ...updates });
  }

  public recalculate(params: {
    total: number;
    active: number;
    paused: number;
    selfEnabled: number;
    selfPaused: number;
  }): GroupStats {
    return new GroupStats({
      totalTemplates: params.total,
      activeTemplates: params.active,
      pausedTemplates: params.paused,
      selfEnabledTemplates: params.selfEnabled,
      selfPausedTemplates: params.selfPaused,
    });
  }

  // ================= 计算属性 =================

  public get isEmpty(): boolean {
    return this.props.totalTemplates === 0;
  }

  public get hasActiveTemplates(): boolean {
    return this.props.activeTemplates > 0;
  }

  public get allPaused(): boolean {
    return this.props.totalTemplates > 0 && this.props.activeTemplates === 0;
  }

  public get templateCountText(): string {
    return `${this.props.totalTemplates} 个提醒`;
  }

  public get activeStatusText(): string {
    if (this.props.activeTemplates === 0) return '全部暂停';
    if (this.props.activeTemplates === this.props.totalTemplates) return '全部活跃';
    return `${this.props.activeTemplates} 个活跃`;
  }

  public get activePercentage(): number {
    if (this.props.totalTemplates === 0) return 0;
    return Math.round((this.props.activeTemplates / this.props.totalTemplates) * 100);
  }

  // ================= 序列化 =================

  public toServerDTO(): GroupStatsServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): GroupStatsPersistenceDTO {
    return {
      total_templates: this.props.totalTemplates,
      active_templates: this.props.activeTemplates,
      paused_templates: this.props.pausedTemplates,
      self_enabled_templates: this.props.selfEnabledTemplates,
      self_paused_templates: this.props.selfPausedTemplates,
    };
  }
}
