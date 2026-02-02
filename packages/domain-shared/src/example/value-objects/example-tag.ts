/**
 * ExampleTag 值对象
 * 
 * 【规范说明：简单 Class 类型值对象】
 * 
 * 与 ExampleProperty 不同，这是一个更简单的值对象示例：
 * - 有 ID（但仍是值对象，因为相等性通过 ID 判断）
 * - 适用于需要唯一标识但不需要独立生命周期的对象
 * 
 * 【Entity vs Value Object 的边界】
 * - 如果对象需要独立的仓储（Repository）→ Entity
 * - 如果对象总是作为聚合根的一部分存在 → Value Object
 */

import { ValueObject } from '@dailyuse/utils';
import type { 
  ExampleTagClientDTO, 
  ExampleTagServerDTO,
  ExampleTagPersistenceDTO 
} from '@dailyuse/contracts/example';
import type { TransferDate, DomainDate, PersistenceDate } from '@dailyuse/contracts/primitives';

export class ExampleTag extends ValueObject<ExampleTagClientDTO> {

  private constructor(props: ExampleTagClientDTO) {
    super(props);
  }

  // ================= 工厂方法 =================

  /**
   * 创建新标签（包含校验）
   */
  public static create(props: Omit<ExampleTagClientDTO, 'id' | 'createdAt' | 'updatedAt'>): ExampleTag {
    this.validateName(props.name);
    this.validateColor(props.color);

    const now = Date.now();
    return new ExampleTag({
      id: crypto.randomUUID(), // 生成唯一 ID
      name: props.name,
      color: props.color,
      order: props.order,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ClientDTO 恢复
   */
  public static fromDTO(dto: ExampleTagClientDTO): ExampleTag {
    return new ExampleTag(dto);
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: ExampleTagServerDTO): ExampleTag {
    return new ExampleTag({
      id: dto.id,
      name: dto.name,
      color: dto.color,
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: ExampleTagPersistenceDTO): ExampleTag {
    return new ExampleTag({
      id: dto.id,
      name: dto.name,
      color: dto.color,
      order: dto.order,
      createdAt: dto.createdAt.getTime(), // Date → number
      updatedAt: dto.updatedAt.getTime(),
    });
  }

  // ================= 校验逻辑 =================

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }
    if (name.length > 32) {
      throw new Error('Tag name too long (max 32 characters)');
    }
  }

  private static validateColor(color: string): void {
    // 颜色格式校验：#RRGGBB 或 #RGB
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      throw new Error('Invalid color format (expected #RGB or #RRGGBB)');
    }
  }

  // ================= Getters =================

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get color(): string {
    return this.props.color;
  }

  public get order(): number {
    return this.props.order;
  }

  public get createdAt(): TransferDate {
    return this.props.createdAt;
  }

  public get updatedAt(): TransferDate {
    return this.props.updatedAt;
  }

  // ================= 行为方法 =================

  public updateName(name: string): ExampleTag {
    ExampleTag.validateName(name);
    return new ExampleTag({
      ...this.props,
      name,
      updatedAt: Date.now(),
    });
  }

  public updateColor(color: string): ExampleTag {
    ExampleTag.validateColor(color);
    return new ExampleTag({
      ...this.props,
      color,
      updatedAt: Date.now(),
    });
  }

  public updateOrder(order: number): ExampleTag {
    return new ExampleTag({
      ...this.props,
      order,
      updatedAt: Date.now(),
    });
  }

  // ================= 序列化 =================

  public toDTO(): ExampleTagClientDTO {
    return { ...this.props };
  }

  public toServerDTO(): ExampleTagServerDTO {
    return {
      id: this.props.id,
      name: this.props.name,
      color: this.props.color,
      order: this.props.order,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public toPersistence(): ExampleTagPersistenceDTO {
    return {
      id: this.props.id,
      name: this.props.name,
      color: this.props.color,
      order: this.props.order,
      createdAt: new Date(this.props.createdAt), // number → Date
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  // ================= 相等性 =================

  /**
   * 通过 ID 判断相等（因为 Tag 有唯一标识）
   */
  public equals(other: ExampleTag): boolean {
    return this.props.id === other.props.id;
  }
}
