/**
 * GoalMetadata 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 目标的元数据信息：重要程度、分类、标签等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type {
  GoalMetadata as IGoalMetadata,
  GoalMetadataDTO,
} from '@dailyuse/contracts/goal';

/**
 * GoalMetadata 值对象实现
 * 
 * 包含：
 * - importance: 重要程度
 * - category: 分类（可选）
 * - tags: 标签数组
 */
export class GoalMetadata extends ValueObject<GoalMetadataDTO> implements IGoalMetadata {

  private constructor(props: GoalMetadataDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   * 
   * @param props - 属性 DTO
   * @throws 当校验失败时抛出错误
   */
  public static create(props: GoalMetadataDTO): GoalMetadata {
    this.validate(props);
    return new GoalMetadata(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 生成业务默认状态
   * 场景: 创建新目标时，生成默认元数据
   */
  public static createDefault(): GoalMetadata {
    return new GoalMetadata({
      importance: 'Moderate',
      category: null,
      tags: [],
    });
  }

  // ================= 工厂方法 3: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   * 用于：从 API 响应或客户端数据还原对象
   */
  public static fromDTO(dto: GoalMetadataDTO): GoalMetadata {
    return new GoalMetadata(dto);
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: GoalMetadataDTO): void {
    // 分类校验：可选，但有长度限制
    if (props.category && props.category.length > 50) {
      throw new Error('Category too long (max 50 characters)');
    }

    // 标签校验：最多 10 个标签，每个标签最多 20 个字符
    if (props.tags.length > 10) {
      throw new Error('Too many tags (max 10)');
    }
    for (const tag of props.tags) {
      if (tag.length > 20) {
        throw new Error('Tag too long (max 20 characters)');
      }
    }
  }

  // ================= Getters（只读暴露）=================

  public get importance(): ImportanceLevel {
    return this.props.importance;
  }

  public get category(): string | null {
    return this.props.category;
  }

  public get tags(): string[] {
    return [...this.props.tags];
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 更新重要程度
   */
  public updateImportance(importance: ImportanceLevel): GoalMetadata {
    const newProps = { ...this.props, importance };
    GoalMetadata.validate(newProps);
    return new GoalMetadata(newProps);
  }

  /**
   * 更新分类
   */
  public updateCategory(category: string | null): GoalMetadata {
    const newProps = { ...this.props, category };
    GoalMetadata.validate(newProps);
    return new GoalMetadata(newProps);
  }

  /**
   * 更新标签
   */
  public updateTags(tags: string[]): GoalMetadata {
    const newProps = { ...this.props, tags };
    GoalMetadata.validate(newProps);
    return new GoalMetadata(newProps);
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): GoalMetadata {
    const tags = [...this.props.tags];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    return this.updateTags(tags);
  }

  /**
   * 移除标签
   */
  public removeTag(tag: string): GoalMetadata {
    const tags = this.props.tags.filter((t) => t !== tag);
    return this.updateTags(tags);
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否有分类
   */
  public get hasCategory(): boolean {
    return this.props.category !== null && this.props.category.length > 0;
  }

  /**
   * 是否有标签
   */
  public get hasTags(): boolean {
    return this.props.tags.length > 0;
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): GoalMetadataDTO {
    return {
      importance: this.props.importance,
      category: this.props.category,
      tags: [...this.props.tags],
    };
  }

}
