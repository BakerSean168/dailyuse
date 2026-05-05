/**
 * ActiveTimeConfig 值对象
 * 
 * 生效时间配置：启动时间（循环提醒的计算基点）
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IActiveTimeConfig,
  ActiveTimeConfigDTO,
} from '@dailyuse/contracts/reminder';

/**
 * ActiveTimeConfig 值对象实现
 */
export class ActiveTimeConfig extends ValueObject<ActiveTimeConfigDTO> implements IActiveTimeConfig {

  private constructor(props: ActiveTimeConfigDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ActiveTimeConfigDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(props);
  }

  public static createNow(): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: Date.now(),
    });
  }

  public static createAt(timestamp: number): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: timestamp,
    });
  }

  public static fromDTO(dto: ActiveTimeConfigDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(dto);
  }

  // ================= Getters =================

  public get activatedAt(): number {
    return this.props.activatedAt;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<ActiveTimeConfigDTO>,
  ): ActiveTimeConfig {
    return new ActiveTimeConfig({ ...this.props, ...updates });
  }

  public reactivate(): ActiveTimeConfig {
    return this.with({ activatedAt: Date.now() });
  }

  public setActivatedAt(timestamp: number): ActiveTimeConfig {
    return this.with({ activatedAt: timestamp });
  }

  // ================= 计算属性 =================

  public get activatedAtDate(): Date {
    return new Date(this.props.activatedAt);
  }

  public get daysSinceActivation(): number {
    const now = Date.now();
    const diff = now - this.props.activatedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // ================= 序列化 =================

  public toDTO(): ActiveTimeConfigDTO {
    return { ...this.props };
  }

}
