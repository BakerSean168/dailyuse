/**
 * ReminderStats 值对象
 * 
 * 提醒统计信息：触发次数、最后触发时间
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IReminderStatsServer,
  ReminderStatsServerDTO,
  ReminderStatsPersistenceDTO,
} from '@dailyuse/contracts/reminder';

/**
 * ReminderStats 值对象实现
 */
export class ReminderStats extends ValueObject<ReminderStatsServerDTO> implements IReminderStatsServer {

  private constructor(props: ReminderStatsServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ReminderStatsServerDTO): ReminderStats {
    return new ReminderStats(props);
  }

  public static createEmpty(): ReminderStats {
    return new ReminderStats({
      totalTriggers: 0,
      lastTriggeredAt: null,
    });
  }

  public static fromDTO(dto: ReminderStatsServerDTO): ReminderStats {
    return new ReminderStats(dto);
  }

  public static fromPersistenceDTO(dto: ReminderStatsPersistenceDTO): ReminderStats {
    return new ReminderStats({
      totalTriggers: dto.total_triggers,
      lastTriggeredAt: dto.last_triggered_at,
    });
  }

  // ================= Getters =================

  public get totalTriggers(): number {
    return this.props.totalTriggers;
  }

  public get lastTriggeredAt(): number | null {
    return this.props.lastTriggeredAt;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<ReminderStatsServerDTO>,
  ): ReminderStats {
    return new ReminderStats({ ...this.props, ...updates });
  }

  public recordTrigger(): ReminderStats {
    return new ReminderStats({
      totalTriggers: this.props.totalTriggers + 1,
      lastTriggeredAt: Date.now(),
    });
  }

  public reset(): ReminderStats {
    return ReminderStats.createEmpty();
  }

  // ================= 计算属性 =================

  public get hasTriggered(): boolean {
    return this.props.totalTriggers > 0;
  }

  public get totalTriggersText(): string {
    return `已触发 ${this.props.totalTriggers} 次`;
  }

  public get lastTriggeredText(): string | null {
    if (this.props.lastTriggeredAt === null) return null;
    const now = Date.now();
    const diff = now - this.props.lastTriggeredAt;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  }

  public get lastTriggeredDate(): Date | null {
    return this.props.lastTriggeredAt !== null
      ? new Date(this.props.lastTriggeredAt)
      : null;
  }

  // ================= 序列化 =================

  public toServerDTO(): ReminderStatsServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): ReminderStatsPersistenceDTO {
    return {
      total_triggers: this.props.totalTriggers,
      last_triggered_at: this.props.lastTriggeredAt,
    };
  }
}
