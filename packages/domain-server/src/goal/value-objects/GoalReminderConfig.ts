/**
 * GoalReminderConfig 值对象实现 (Server)
 * 目标提醒配置
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  GoalReminderConfigClientDTO,
  GoalReminderConfigPersistenceDTO,
  GoalReminderConfigServer,
  GoalReminderConfigServerDTO,
  ReminderTrigger,
  ReminderTriggerType,
} from '@dailyuse/contracts/goal';

/**
 * GoalReminderConfig 值对象 (Server)
 * 
 * 不可变值对象，所有修改操作返回新实例
 */
export class GoalReminderConfig extends ValueObject implements GoalReminderConfigServer {
  private readonly _enabled: boolean;
  private readonly _triggers: readonly ReminderTrigger[];

  private constructor(params: { enabled: boolean; triggers: ReminderTrigger[] }) {
    super();
    this._enabled = params.enabled;
    this._triggers = Object.freeze([...params.triggers]);
  }

  // ===== Getters =====

  public get enabled(): boolean {
    return this._enabled;
  }

  public get triggers(): ReminderTrigger[] {
    return [...this._triggers];
  }

  // ===== 值对象方法 =====

  /**
   * 相等性比较
   */
  public equals(other: GoalReminderConfig): boolean {
    if (!other) return false;
    
    if (this._enabled !== other.enabled) return false;
    
    if (this._triggers.length !== other.triggers.length) return false;
    
    // 比较每个触发器
    for (let i = 0; i < this._triggers.length; i++) {
      const thisTrigger = this._triggers[i];
      const otherTrigger = other.triggers[i];
      
      if (
        thisTrigger.type !== otherTrigger.type ||
        thisTrigger.value !== otherTrigger.value ||
        thisTrigger.enabled !== otherTrigger.enabled
      ) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    updates: Partial<
      Omit<
        GoalReminderConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >
  ): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: updates.enabled ?? this._enabled,
      triggers: updates.triggers ?? [...this._triggers],
    });
  }

  // ===== 业务方法 =====

  /**
   * 添加触发器
   */
  public addTrigger(trigger: ReminderTrigger): GoalReminderConfig {
    // 检查是否已存在相同的触发器
    const exists = this._triggers.some(
      (t) => t.type === trigger.type && t.value === trigger.value
    );
    
    if (exists) {
      throw new Error(`Trigger already exists: ${trigger.type} - ${trigger.value}`);
    }
    
    return new GoalReminderConfig({
      enabled: this._enabled,
      triggers: [...this._triggers, trigger],
    });
  }

  /**
   * 移除触发器
   */
  public removeTrigger(type: ReminderTriggerType, value: number): GoalReminderConfig {
    const newTriggers = this._triggers.filter(
      (t) => !(t.type === type && t.value === value)
    );
    
    return new GoalReminderConfig({
      enabled: this._enabled,
      triggers: newTriggers,
    });
  }

  /**
   * 更新触发器
   */
  public updateTrigger(
    type: ReminderTriggerType,
    value: number,
    updates: Partial<ReminderTrigger>
  ): GoalReminderConfig {
    const newTriggers = this._triggers.map((t) => {
      if (t.type === type && t.value === value) {
        return {
          ...t,
          ...updates,
        };
      }
      return t;
    });
    
    return new GoalReminderConfig({
      enabled: this._enabled,
      triggers: newTriggers,
    });
  }

  /**
   * 根据类型获取触发器
   */
  public getTriggersByType(type: ReminderTriggerType): ReminderTrigger[] {
    return this._triggers.filter((t) => t.type === type);
  }

  /**
   * 是否有启用的触发器
   */
  public hasActiveTriggers(): boolean {
    return this._enabled && this._triggers.some((t) => t.enabled);
  }

  /**
   * 获取所有启用的触发器
   */
  public getActiveTriggers(): ReminderTrigger[] {
    if (!this._enabled) return [];
    return this._triggers.filter((t) => t.enabled);
  }

  /**
   * 启用提醒
   */
  public enable(): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: true,
      triggers: [...this._triggers],
    });
  }

  /**
   * 禁用提醒
   */
  public disable(): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: false,
      triggers: [...this._triggers],
    });
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalReminderConfigServerDTO {
    return {
      enabled: this._enabled,
      triggers: [...this._triggers],
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): GoalReminderConfigClientDTO {
    return {
      enabled: this._enabled,
      triggers: [...this._triggers],
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalReminderConfigPersistenceDTO {
    return {
      enabled: this._enabled,
      triggers: JSON.stringify([...this._triggers]),
    };
  }

  // ===== 私有辅助方法 =====

  /**
   * 生成触发器摘要文本
   */
  private _generateTriggerSummary(): string {
    if (this._triggers.length === 0) return '无触发器';
    
    const progressParts: string[] = [];
    const remainingDaysParts: string[] = [];
    
    for (const trigger of this._triggers) {
      if (!trigger.enabled) continue;
      
      if (trigger.type === 'TIME_PROGRESS_PERCENTAGE') {
        progressParts.push(`${trigger.value}%`);
      } else if (trigger.type === 'REMAINING_DAYS') {
        remainingDaysParts.push(`${trigger.value}天`);
      }
    }
    
    const parts: string[] = [];
    if (progressParts.length > 0) {
      parts.push(`进度 ${progressParts.join(', ')}`);
    }
    if (remainingDaysParts.length > 0) {
      parts.push(`剩余 ${remainingDaysParts.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join('; ') : '无启用的触发器';
  }

  // ===== 静态工厂方法 =====

  /**
   * 从 Server DTO 创建
   */
  public static fromServerDTO(dto: GoalReminderConfigServerDTO): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: dto.enabled,
      triggers: dto.triggers,
    });
  }

  /**
   * 从 Persistence DTO 创建
   */
  public static fromPersistenceDTO(dto: GoalReminderConfigPersistenceDTO): GoalReminderConfig {
    const triggers = JSON.parse(dto.triggers) as ReminderTrigger[];
    return new GoalReminderConfig({
      enabled: dto.enabled,
      triggers,
    });
  }

  /**
   * 创建默认配置（禁用状态，无触发器）
   */
  public static createDefault(): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: false,
      triggers: [],
    });
  }

  /**
   * 创建新实例
   */
  public static create(params: { enabled: boolean; triggers: ReminderTrigger[] }): GoalReminderConfig {
    return new GoalReminderConfig(params);
  }
}
