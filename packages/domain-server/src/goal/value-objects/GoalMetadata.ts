/**
 * GoalMetadata 值对象
 * 目标元数据 - 不可变值对象
 */

import type { GoalMetadataPersistenceDTO, GoalMetadataServerDTO } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ValueObject } from '@dailyuse/utils';

// 类型别名

/**
 * GoalMetadata 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class GoalMetadata extends ValueObject {
  public readonly importance: ImportanceLevel;
  // urgency removed - priority is now computed by GoalPriorityCalculator
  public readonly category: string | null;
  public readonly tags: string[];

  constructor(params: {
    importance: ImportanceLevel;
    // urgency: UrgencyLevel; // REMOVED
    category?: string | null;
    tags?: string[];
  }) {
    super();

    this.importance = params.importance;
    // this.urgency removed
    this.category = params.category ?? null;
    this.tags = [...(params.tags ?? [])];

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.tags);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      importance: ImportanceLevel;
      // urgency: UrgencyLevel; // REMOVED
      category: string | null;
      tags: string[];
    }>,
  ): GoalMetadata {
    return new GoalMetadata({
      importance: changes.importance ?? this.importance,
      // urgency removed
      category: changes.category ?? this.category,
      tags: changes.tags ?? this.tags,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof GoalMetadata)) {
      return false;
    }

    return (
      this.importance === other.importance &&
      // urgency removed from equality check
      this.category === other.category &&
      this.arraysEqual(this.tags, other.tags)
    );
  }

  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  /**
   * 计算优先级分数（基于 importance）
   * @deprecated 使用 GoalPriorityCalculator 服务替代
   */
  public getPriority(): number {
    const importanceScore = this.getImportanceScore();
    // 简化计算：只使用 importance
    return importanceScore * 10; // 返回 10-50 范围
  }

  /**
   * 获取重要性分数
   */
  private getImportanceScore(): number {
    const scores: Record<ImportanceLevel, number> = {
      [ImportanceLevel.Vital]: 5,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Trivial]: 1,
    };
    return scores[this.importance] || 0;
  }

  // getUrgencyScore removed - priority is now computed by GoalPriorityCalculator

  /**
   * 检查是否有指定标签
   */
  public hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * 添加标签（返回新实例）
   */
  public addTag(tag: string): GoalMetadata {
    if (this.hasTag(tag)) {
      return this;
    }
    return this.with({ tags: [...this.tags, tag] });
  }

  /**
   * 移除标签（返回新实例）
   */
  public removeTag(tag: string): GoalMetadata {
    if (!this.hasTag(tag)) {
      return this;
    }
    return this.with({ tags: this.tags.filter((t) => t !== tag) });
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalMetadataServerDTO {
    return {
      importance: this.importance,
      // urgency removed
      category: this.category,
      tags: [...this.tags],
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: GoalMetadataServerDTO): GoalMetadata {
    return new GoalMetadata({
      importance: dto.importance,
      category: dto.category ?? null,
      tags: dto.tags ?? [],
    });
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalMetadataPersistenceDTO {
    return {
      importance: this.importance,
      // urgency removed
      category: this.category,
      tags: JSON.stringify(this.tags),
    };
  }

  /**
   * 从 Persistence DTO 创建值对象
   */
  public static fromPersistenceDTO(dto: GoalMetadataPersistenceDTO): GoalMetadata {
    return new GoalMetadata({
      importance: dto.importance,
      // urgency removed
      category: dto.category ?? null,
      tags: JSON.parse(dto.tags) as string[],
    });
  }

  /**
   * 创建默认元数据
   */
  public static createDefault(): GoalMetadata {
    return new GoalMetadata({
      importance: ImportanceLevel.Moderate,
      // urgency removed
      category: null,
      tags: [],
    });
  }
}
