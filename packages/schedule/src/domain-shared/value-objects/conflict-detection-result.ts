/**
 * ConflictDetectionResult 值对象
 * 
 * 冲突检测结果：是否有冲突、冲突详情、解决建议
 * 这是一个简单的只读值对象
 */

import { ValueObject } from '@dailyuse/utils';
import type { ConflictDetectionResult as IConflictDetectionResult } from '@dailyuse/contracts/schedule';

// 从接口复制的类型定义（因为 contracts 未导出这些类型）
interface ConflictDetail {
  readonly scheduleId: string;
  readonly scheduleTitle: string;
  readonly overlapStart: number;
  readonly overlapEnd: number;
  readonly overlapDuration: number;
  readonly severity?: 'minor' | 'moderate' | 'severe';
}

interface ConflictSuggestion {
  readonly type: 'move_earlier' | 'move_later' | 'shorten';
  readonly newStartTime: number;
  readonly newEndTime: number;
  readonly description?: string;
}

interface ConflictDetectionResultDTO {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
  suggestions: ConflictSuggestion[];
}

/**
 * ConflictDetectionResult 值对象实现
 */
export class ConflictDetectionResult extends ValueObject<ConflictDetectionResultDTO> implements IConflictDetectionResult {

  private constructor(props: ConflictDetectionResultDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ConflictDetectionResultDTO): ConflictDetectionResult {
    return new ConflictDetectionResult(props);
  }

  public static noConflict(): ConflictDetectionResult {
    return new ConflictDetectionResult({
      hasConflict: false,
      conflicts: [],
      suggestions: [],
    });
  }

  public static withConflicts(
    conflicts: ConflictDetail[],
    suggestions: ConflictSuggestion[] = [],
  ): ConflictDetectionResult {
    return new ConflictDetectionResult({
      hasConflict: conflicts.length > 0,
      conflicts,
      suggestions,
    });
  }

  // ================= Getters =================

  public get hasConflict(): boolean {
    return this.props.hasConflict;
  }

  public get conflicts(): readonly ConflictDetail[] {
    return this.props.conflicts;
  }

  public get suggestions(): readonly ConflictSuggestion[] {
    return this.props.suggestions;
  }

  // ================= 计算属性 =================

  public get conflictCount(): number {
    return this.props.conflicts.length;
  }

  public get suggestionCount(): number {
    return this.props.suggestions.length;
  }

  public get hasSuggestions(): boolean {
    return this.props.suggestions.length > 0;
  }

  public get conflictingScheduleIds(): string[] {
    return this.props.conflicts.map(c => c.scheduleId);
  }

  // ================= 序列化 =================

  public toDTO(): ConflictDetectionResultDTO {
    return {
      hasConflict: this.props.hasConflict,
      conflicts: [...this.props.conflicts],
      suggestions: [...this.props.suggestions],
    };
  }
}
