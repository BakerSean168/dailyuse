/**
 * ChecklistItemDefinition 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 任务模板中的清单项定义
 * 注意：这是模板定义，不包含完成状态
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ChecklistItemDefinition as IChecklistItemDefinition,
  ChecklistItemDefinitionDTO,
} from '@dailyuse/contracts/task';

/**
 * ChecklistItemDefinition 值对象实现
 * 
 * 包含：
 * - title: 清单项标题
 * - order: 排序顺序
 */
export class ChecklistItemDefinition 
  extends ValueObject<ChecklistItemDefinitionDTO> 
  implements IChecklistItemDefinition 
{

  private constructor(props: ChecklistItemDefinitionDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: ChecklistItemDefinitionDTO): ChecklistItemDefinition {
    this.validate(props);
    return new ChecklistItemDefinition(props);
  }

  // ================= 工厂方法 2: 快速创建 =================
  /**
   * 快速创建清单项
   */
  public static of(title: string, order: number): ChecklistItemDefinition {
    return ChecklistItemDefinition.create({ title, order });
  }

  // ================= 工厂方法 3: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: ChecklistItemDefinitionDTO): ChecklistItemDefinition {
    return new ChecklistItemDefinition(dto);
  }

  // ================= 工厂方法 4: 批量创建 =================
  /**
   * 从标题列表批量创建清单项
   */
  public static fromTitles(titles: string[]): ChecklistItemDefinition[] {
    return titles.map((title, index) => 
      ChecklistItemDefinition.create({ title, order: index })
    );
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: ChecklistItemDefinitionDTO): void {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (props.title.length > 200) {
      throw new Error('Title too long (max 200 characters)');
    }

    if (props.order < 0) {
      throw new Error('Order must be non-negative');
    }
  }

  // ================= Getters（只读暴露）=================

  public get title(): string {
    return this.props.title;
  }

  public get order(): number {
    return this.props.order;
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 更新标题
   */
  public updateTitle(title: string): ChecklistItemDefinition {
    const newProps = { ...this.props, title };
    ChecklistItemDefinition.validate(newProps);
    return new ChecklistItemDefinition(newProps);
  }

  /**
   * 更新排序
   */
  public updateOrder(order: number): ChecklistItemDefinition {
    const newProps = { ...this.props, order };
    ChecklistItemDefinition.validate(newProps);
    return new ChecklistItemDefinition(newProps);
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): ChecklistItemDefinitionDTO {
    return {
      title: this.props.title,
      order: this.props.order,
    };
  }
}
