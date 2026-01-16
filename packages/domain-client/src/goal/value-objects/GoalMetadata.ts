/**
 * GoalMetadata 值对象实现 (Client)
 */

import type {
  GoalMetadataClient,
  GoalMetadataClientDTO,
  GoalMetadataServerDTO,
} from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ValueObject } from '@dailyuse/utils';

// Priority calculation constants (aligned with domain-server)
const IMPORTANCE_WEIGHT = 0.6;
const TIME_WEIGHT = 0.4;
const OVERDUE_BOOST = 50;

export class GoalMetadata extends ValueObject implements GoalMetadataClient {
  private _importance: ImportanceLevel;
  private _category: string | null;
  private _tags: string[];
  private _targetDate?: number | null;

  private constructor(params: {
    importance: ImportanceLevel;
    category?: string | null;
    tags: string[];
    targetDate?: number | null;
  }) {
    super();
    this._importance = params.importance;
    this._category = params.category ?? null;
    this._tags = params.tags;
    this._targetDate = params.targetDate;
  }

  // Getters
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get category(): string | null {
    return this._category;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get targetDate(): number | null | undefined {
    return this._targetDate;
  }

  // UI 辅助属性
  public get importanceText(): string {
    return this._importance || '未知';
  }

  /**
   * 计算动态优先级 (0-100)
   * 基于 importance 和 targetDate
   */
  private calculatePriority(): number {
    const importanceMap: Record<ImportanceLevel, number> = {
      [ImportanceLevel.Vital]: 5,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Trivial]: 1,
    };
    const importanceValue = importanceMap[this._importance] ?? 3;
    const importanceWeight = importanceValue * 20 * IMPORTANCE_WEIGHT;

    if (!this._targetDate) {
      return Math.round(importanceWeight + 5);
    }

    const now = Date.now();
    const daysRemaining = Math.ceil((this._targetDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return Math.min(100, Math.round(importanceWeight + OVERDUE_BOOST));
    }

    const timeUrgency = Math.min(100, 100 / (1 + daysRemaining / 7));
    const timeWeight = timeUrgency * TIME_WEIGHT;

    return Math.min(100, Math.max(0, Math.round(importanceWeight + timeWeight)));
  }

  /**
   * 动态优先级值 (0-100)
   */
  public get priority(): number {
    return this.calculatePriority();
  }

  public get priorityLevel(): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const p = this.priority;
    if (p >= 80) return 'CRITICAL';
    if (p >= 60) return 'HIGH';
    if (p >= 40) return 'MEDIUM';
    return 'LOW';
  }

  public get priorityText(): string {
    const levelMap = { CRITICAL: '紧急', HIGH: '高', MEDIUM: '中', LOW: '低' };
    return levelMap[this.priorityLevel];
  }

  public get priorityBadgeColor(): string {
    const colorMap = {
      CRITICAL: '#dc2626',
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };
    return colorMap[this.priorityLevel];
  }

  public get categoryDisplay(): string {
    return this._category || '未分类';
  }

  public get tagsDisplay(): string {
    return this._tags.length > 0 ? this._tags.join(', ') : '无标签';
  }

  // 值对象方法
  public equals(other: GoalMetadataClient): boolean {
    return (
      this._importance === other.importance &&
      this._category === other.category &&
      JSON.stringify(this._tags.sort()) === JSON.stringify([...other.tags].sort())
    );
  }

  // UI 辅助方法
  public hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  // DTO 转换
  public toServerDTO(): GoalMetadataServerDTO {
    return {
      importance: this._importance,
      category: this._category,
      tags: [...this._tags],
    };
  }

  public toClientDTO(): GoalMetadataClientDTO {
    return {
      importance: this._importance,
      category: this._category,
      tags: [...this._tags],
      importanceText: this.importanceText,
      priority: this.priority,
      priorityLevel: this.priorityLevel,
      priorityText: this.priorityText,
      priorityBadgeColor: this.priorityBadgeColor,
      categoryDisplay: this.categoryDisplay,
      tagsDisplay: this.tagsDisplay,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalMetadataClientDTO): GoalMetadata {
    return new GoalMetadata({
      importance: dto.importance,
      category: dto.category,
      tags: dto.tags,
    });
  }

  public static fromServerDTO(dto: GoalMetadataServerDTO): GoalMetadata {
    return new GoalMetadata({
      importance: dto.importance,
      category: dto.category,
      tags: dto.tags,
    });
  }
}
