/**
 * ExampleTag 实体实现
 * 
 * 【规范说明：实体（Entity）】
 * 实体是有唯一标识符（ID/UUID）的领域对象：
 * - 有唯一标识：通过 ID 区分，而非属性值
 * - 有生命周期：可以被创建、修改、删除
 * - 从属于聚合根：在本例中，ExampleTag 从属于 Example 聚合根
 * - 可变性：状态可以改变，但 ID 不变
 * 
 * 【实体 vs 聚合根】
 * - ExampleTag（实体）：Example 聚合内的子对象，不能独立存在
 * - Example（聚合根）：聚合的顶级对象，对外代表整个聚合
 * 
 * 【实体 vs 值对象】
 * - ExampleTag（实体）：有 ID，可变，通过 ID 比较相等性
 * - ExampleColor（值对象）：无 ID，不可变，通过值比较
 * 
 * 【实现模式】
 * - 继承 Entity 基类（提供 UUID 支持）
 * - 私有构造函数 + 工厂方法（防止无效实例创建）
 * - 时间字段使用 DomainDate（Date）用于业务逻辑计算
 * - 提供转换方法：toServerDTO(), toPersistenceDTO()
 */

import type {
  ExampleTagServer,
  ExampleTagServerDTO,
  ExampleTagPersistenceDTO,
} from '@/contracts';
import { Entity, generateUUID } from '@dailyuse/utils';

/**
 * ExampleTag 实体实现
 * 
 * 【业务含义】
 * ExampleTag 是 Example 聚合根内的子实体，代表某个 Example 的标签/分类标记
 * 特点：
 * - 每个标签有名称、颜色、显示顺序
 * - 标签可以修改名称和颜色
 * - 简洁设计，不包含历史追踪
 */
export class ExampleTag extends Entity<string> implements ExampleTagServer {
  // ================= 1. 内部状态 =================
  private _name: string;
  private _color: string;
  private _order: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. 构造函数（Private） =================
  /**
   * 【规范说明】
   * 构造函数必须为 private，防止外部直接 new ExampleTag(...)
   * 确保所有实例都通过工厂方法创建，保证业务规则验证
   */
  private constructor(props: ExampleTagServerDTO) {
    super(props.id);

    this._name = props.name;
    this._color = props.color;
    this._order = props.order;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
  }

  // ================= 3. Getters（只读属性） =================
  /**
   * 【规范说明】
   * 通过 public get 暴露状态，但标记为只读
   * 确保外部只能读取，不能直接修改
   * 所有修改必须通过明确的业务方法进行
   */

  get name(): string {
    return this._name;
  }

  get color(): string {
    return this._color;
  }

  get order(): number {
    return this._order;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ================= 4. 工厂方法（Factory Methods） =================

  /**
   * 🏭 业务工厂：创建新的标签
   * 
   * 【设计说明】
   * - 创建时间使用当前时间
   * - Order 默认为 0（由聚合根管理排序）
   * 
   * @param props - 标签创建参数
   * @returns 新创建的 ExampleTag 实体
   */
  public static create(props: {
    id?: string;
    name: string;
    color: string;
    order?: number;
  }): ExampleTag {
    const now = Date.now();
    const dto: ExampleTagServerDTO = {
      id: props.id ?? generateUUID(),
      name: props.name,
      color: props.color,
      order: props.order ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    return new ExampleTag(dto);
  }

  /**
   * 🏭 恢复工厂：从 Server DTO 恢复实体
   * 
   * 【使用场景】
   * - 从 API 响应/应用服务返回值恢复
   * - 加载聚合根时，恢复其内部的 ExampleTag 实体
   * 
   * @param dto - 标签 Server DTO
   * @returns 恢复后的 ExampleTag 实体
   */
  public static fromServerDTO(dto: ExampleTagServerDTO): ExampleTag {
    return new ExampleTag(dto);
  }

  /**
   * 🏭 恢复工厂：从持久化 DTO 恢复实体
   * 
   * 【使用场景】
   * - 从数据库查询结果恢复（ORM 返回的对象）
   * - Repository 加载数据时使用
   * 
   * 【时间类型转换】
   * PersistenceDate（Date）→ 内部存储继续使用 Date
   * 
   * @param dto - 标签 Persistence DTO（来自数据库）
   * @returns 恢复后的 ExampleTag 实体
   */
  public static fromPersistenceDTO(dto: ExampleTagPersistenceDTO): ExampleTag {
    const serverDTO: ExampleTagServerDTO = {
      id: dto.id,
      name: dto.name,
      color: dto.color,
      order: dto.order,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    };
    return new ExampleTag(serverDTO);
  }

  // ================= 5. 业务行为（Business Methods） =================

  /**
   * ✅ 修改标签名称
   * 
   * 【业务规则】
   * - 名称不能为空
   * - 更新 updatedAt 时间戳
   * 
   * @param newName - 新的标签名称
   * @throws 当名称为空或无效时
   */
  public rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    if (newName.trim().length > 256) {
      throw new Error('Tag name cannot exceed 256 characters');
    }

    this._name = newName.trim();
    this._updatedAt = new Date();
  }

  /**
   * ✅ 修改标签颜色
   * 
   * 【业务规则】
   * - 颜色格式必须是有效的十六进制颜色（#RRGGBB）
   * - 更新 updatedAt 时间戳
   * 
   * @param newColor - 新的颜色（十六进制，如 #FF0000）
   * @throws 当颜色格式无效时
   */
  public changeColor(newColor: string): void {
    if (!this.isValidColor(newColor)) {
      throw new Error(`Invalid color format: ${newColor}. Expected #RRGGBB format`);
    }

    this._color = newColor;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 更改显示顺序
   * 
   * 【业务规则】
   * - Order 用于控制标签在列表中的显示顺序
   * - 更新 updatedAt 时间戳
   * 
   * @param newOrder - 新的顺序值（通常是 0-100 之间的整数）
   */
  public reorder(newOrder: number): void {
    if (!Number.isInteger(newOrder) || newOrder < 0) {
      throw new Error('Order must be a non-negative integer');
    }

    this._order = newOrder;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 批量更新标签属性
   * 
   * 【使用场景】
   * - 前端一次性修改多个属性（名称+颜色）
   * - 减少更新次数
   * 
   * @param updates - 要更新的属性
   */
  public update(updates: { name?: string; color?: string; order?: number }): void {
    if (updates.name !== undefined) {
      this.rename(updates.name);
    }

    if (updates.color !== undefined) {
      this.changeColor(updates.color);
    }

    if (updates.order !== undefined) {
      this.reorder(updates.order);
    }
  }

  /**
   * 🛡️ 颜色校验辅助方法
   */
  private isValidColor(color: string): boolean {
    // 简单的十六进制颜色校验
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  // ================= 6. 序列化（Serialization） =================

  /**
   * 转换为 Server DTO
   * 
   * 【用途】
   * - 应用服务返回数据给 API 层
   * - 跨层级传递数据
   * - 时间字段转为时间戳（TransferDate）
   */
  public toServerDTO(): ExampleTagServerDTO {
    return {
      id: this.id,
      name: this._name,
      color: this._color,
      order: this._order,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为持久化 DTO
   * 
   * 【用途】
   * - Repository 保存到数据库
   * - ORM 对象映射
   * - 时间字段保持为 Date 对象（Prisma 会处理）
   */
  public toPersistenceDTO(): ExampleTagPersistenceDTO {
    return {
      id: this.id,
      name: this._name,
      color: this._color,
      order: this._order,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
