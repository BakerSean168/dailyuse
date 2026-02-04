/**
 * ActiveTimeConfig 值对象
 * 
 * 生效时间配置：启动时间（循环提醒的计算基点）
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IActiveTimeConfigServer,
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigPersistenceDTO,
} from '@dailyuse/contracts/reminder';

/**
 * ActiveTimeConfig 值对象实现
 */
export class ActiveTimeConfig extends ValueObject<ActiveTimeConfigServerDTO> implements IActiveTimeConfigServer {

  private constructor(props: ActiveTimeConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ActiveTimeConfigServerDTO): ActiveTimeConfig {
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

  public static fromDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(dto);
  }

  public static fromPersistenceDTO(dto: ActiveTimeConfigPersistenceDTO): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: dto.activatedAt,
    });
  }

  // ================= Getters =================

  public get activatedAt(): number {
    return this.props.activatedAt;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<ActiveTimeConfigServerDTO>,
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

  public get displayText(): string {
    const date = new Date(this.props.activatedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `启动于 ${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // ================= 序列化 =================

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): ActiveTimeConfigPersistenceDTO {
    return { ...this.props };
  }
}
