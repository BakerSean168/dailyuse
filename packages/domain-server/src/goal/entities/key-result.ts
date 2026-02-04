/**
 * KeyResult 实体实现
 * 
 * 【规范说明：实体（Entity）】
 * 实体是有唯一标识符（ID/UUID）的领域对象：
 * - 有唯一标识：通过 UUID 区分，而非属性值
 * - 有生命周期：可以被创建、修改、删除
 * - 从属于聚合根：在本例中，KeyResult 从属于 Goal 聚合根
 * - 可变性：状态可以改变，但 UUID 不变
 * 
 * 【实体 vs 聚合根】
 * - KeyResult（实体）：Goal 聚合内的子对象，不能独立存在
 * - Goal（聚合根）：聚合的顶级对象，对外代表整个聚合
 * 
 * 【KeyResult 职责】
 * 管理关键结果的完整生命周期：
 * - 进度追踪（当前值、目标值、初始值）
 * - 权重管理（用于综合评分）
 * 
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - weight 在 0-100 之间
 * - title 不能为空
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import { KeyResultId } from '@dailyuse/domain-shared';
import type {
  KeyResultPersistenceDTO,
  KeyResultServer,
  KeyResultServerDTO,
} from '@dailyuse/contracts/goal';

/**
 * KeyResult 实体
 */
export class KeyResult extends Entity<KeyResultId> implements KeyResultServer {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _title: string;
  private _description: string | null;
  private _progress: KeyResultServerDTO['progress'];
  private _weight: number; // 权重 (0-100)
  private _order: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: KeyResultServerDTO) {
    super(props.id as KeyResultId);
    this._title = props.title;
    this._description = props.description ?? null;
    this._progress = props.progress;
    this._weight = props.weight;
    this._order = props.order;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
  }

  // ================= 3. 公共属性 (Getters) =================
  get title(): string {
    return this._title;
  }
  
  get description(): string | null {
    return this._description;
  }
  
  get progress(): KeyResultServerDTO['progress'] {
    return this._progress;
  }
  
  get weight(): number {
    return this._weight;
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

  // ================= 4. 工厂方法 (Factory Methods) =================

  /**
   * 🏭 业务工厂：创建新的关键结果
   */
  public static create(params: {
    title: string;
    description?: string;
    progress: KeyResultServerDTO['progress'];
    weight?: number;
    order?: number;
  }): KeyResult {
    // 验证业务规则
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    const now = Date.now();
    const id = generateUUID() as KeyResultId;

    return new KeyResult({
      id,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      progress: params.progress,
      weight: params.weight ?? 0,
      order: params.order ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResult {
    return new KeyResult(dto);
  }

  /**
   * 🏭 恢复工厂：从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResult {
    // 解析 JSON 字符串
    const progressData = JSON.parse(dto.progress) as Record<string, any>;

    const progress = {
      valueType: progressData.valueType,
      aggregationMethod: progressData.aggregationMethod,
      initialValue: progressData.initialValue,
      targetValue: progressData.targetValue,
      currentValue: progressData.currentValue,
      unit: progressData.unit,
    };

    const serverDTO: KeyResultServerDTO = {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      progress,
      weight: dto.weight,
      order: dto.order,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    };

    return new KeyResult(serverDTO);
  }

  // ================= 5. 业务行为 (Business Methods) =================

  /**
   * ✅ 更新标题
   */
  public updateTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._title = trimmed;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 更新描述
   */
  public updateDescription(description: string): void {
    this._description = description.trim() || null;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 更新权重
   * 
   * 【业务规则】
   * - 权重必须在 0-100 之间
   */
  public updateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }
    this._weight = weight;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 添加进度记录并重新计算进度
   */
  public addRecord(recordData: { value: number }): void {
    this._updatedAt = new Date();
    this.recalculateProgress(recordData.value);
  }

  /**
   * 📊 根据聚合方式重新计算进度
   */
  public recalculateProgress(value: number): void {
    this._progress = {
      ...this._progress,
      currentValue: value,
    };
    this._updatedAt = new Date();
  }

  /**
   * 📊 计算完成百分比（0-100）
   */
  public calculatePercentage(): number {
    const start = (this._progress as any).initialValue ?? 0;
    const range = this._progress.targetValue - start;
    
    if (this._progress.targetValue <= 0 || range <= 0) {
      return 0;
    }
    
    const percentage = ((this._progress.currentValue - start) / range) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * 📊 是否已完成
   */
  public isCompleted(): boolean {
    return this._progress.currentValue >= this._progress.targetValue;
  }

  /**
   * ✅ 更新排序
   */
  public updateOrder(order: number): void {
    this._order = order;
    this._updatedAt = new Date();
  }

  /**
   * 📊 获取所有记录的值
   */
  public getRecordValues(): number[] {
    return [];
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): KeyResultServerDTO {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      progress: this._progress,
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): KeyResultPersistenceDTO {
    const progressPersistence = {
      initialValue: (this._progress as any).initialValue,
      currentValue: this._progress.currentValue,
      targetValue: this._progress.targetValue,
      valueType: this._progress.valueType,
      aggregationMethod: this._progress.aggregationMethod,
      unit: this._progress.unit,
    };

    return {
      id: this.id,
      title: this._title,
      description: this._description,
      progress: JSON.stringify(progressPersistence),
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
