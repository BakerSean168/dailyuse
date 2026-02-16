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
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 * 
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - weight 在 0-100 之间
 * - title 不能为空
 */

import { Entity } from '@dailyuse/utils';
import { KeyResultId } from '../../domain-shared';
import type {
  KeyResultPersistenceDTO,
  KeyResultServer,
  KeyResultServerDTO,
} from '@dailyuse/contracts/goal';

// 内部状态接口
interface KeyResultState {
  id: KeyResultId;
  title: string;
  description: string | null;
  progress: KeyResultServerDTO['progress'];
  weight: number;
  sortOrder: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * KeyResult 实体
 */
export class KeyResult extends Entity<KeyResultId> implements KeyResultServer {
  // ================= 1. 内部状态 (Single Props Object) =================
  private _props: KeyResultState;

  // ================= 2. 构造函数 (Private) =================
  private constructor(params: {
    id: KeyResultId;
    title: string;
    description: string | null;
    progress: KeyResultServerDTO['progress'];
    weight: number;
    sortOrder: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._props = {
      id: params.id,
      title: params.title,
      description: params.description ?? null,
      progress: params.progress,
      weight: params.weight,
      sortOrder: params.sortOrder,
      version: params.version ?? 1,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      deletedAt: params.deletedAt ?? null,
    };
  }

  // ================= 3. 公共属性 (Getters) =================
  get title(): string {
    return this._props.title;
  }
  
  get description(): string | null {
    return this._props.description;
  }
  
  get progress(): KeyResultServerDTO['progress'] {
    return this._props.progress;
  }
  
  get weight(): number {
    return this._props.weight;
  }
  
  get sortOrder(): number {
    return this._props.sortOrder;
  }
  
  get version(): number {
    return this._props.version;
  }
  
  get createdAt(): Date {
    return this._props.createdAt;
  }
  
  get updatedAt(): Date {
    return this._props.updatedAt;
  }
  
  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ================= 4. 工厂方法 (Factory Methods) =================

  /**
   * 🏭 业务工厂：创建新的关键结果
   * 
   * @param params.id 可选的 ID，支持前端生成。如果不提供则自动生成
   */
  public static create(params: {
    id?: KeyResultId; // 支持前端生成 ID
    title: string;
    description?: string;
    progress: KeyResultServerDTO['progress'];
    weight?: number;
    sortOrder?: number;
  }): KeyResult {
    // 验证业务规则
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    const now = Date.now();
    const id = params.id ?? KeyResultId.generate();

    return new KeyResult({
      id,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      progress: params.progress,
      weight: params.weight ?? 0,
      sortOrder: params.sortOrder ?? 0,
      version: 1,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      deletedAt: null,
    });
  }

  /**
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResult {
    return new KeyResult({
      id: KeyResultId.of(dto.id),
      title: dto.title,
      description: dto.description ?? null,
      progress: dto.progress,
      weight: dto.weight,
      sortOrder: dto.sortOrder,
      version: dto.version ?? 1,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
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

    return new KeyResult({
      id: KeyResultId.of(dto.id),
      title: dto.title,
      description: dto.description ?? null,
      progress,
      weight: dto.weight,
      sortOrder: dto.sortOrder,
      version: dto.version ?? 1,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
    });
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
    this._props.title = trimmed;
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 更新描述
   */
  public updateDescription(description: string): void {
    this._props.description = description.trim() || null;
    this._props.updatedAt = new Date();
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
    this._props.weight = weight;
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 更新目标值
   */
  public updateTargetValue(targetValue: number): void {
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      throw new Error('Target value must be a positive number');
    }
    this._props.progress = {
      ...this._props.progress,
      targetValue,
    };
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 更新单位
   */
  public updateUnit(unit?: string | null): void {
    this._props.progress = {
      ...this._props.progress,
      unit: unit?.trim() || null,
    };
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 添加进度记录并重新计算进度
   */
  public addRecord(recordData: { value: number }): void {
    this._props.updatedAt = new Date();
    this.recalculateProgress(recordData.value);
  }

  /**
   * 📊 根据聚合方式重新计算进度
   */
  public recalculateProgress(value: number): void {
    this._props.progress = {
      ...this._props.progress,
      currentValue: value,
    };
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 更新进度值
   */
  public updateProgress(value: number): void {
    this.recalculateProgress(value);
  }

  /**
   * 📊 计算完成百分比（0-100）
   */
  public calculatePercentage(): number {
    const start = (this._props.progress as any).initialValue ?? 0;
    const range = this._props.progress.targetValue - start;
    
    if (this._props.progress.targetValue <= 0 || range <= 0) {
      return 0;
    }
    
    const percentage = ((this._props.progress.currentValue - start) / range) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * 📊 是否已完成
   */
  public isCompleted(): boolean {
    return this._props.progress.currentValue >= this._props.progress.targetValue;
  }

  /**
   * ✅ 更新排序
   */
  public updateSortOrder(sortOrder: number): void {
    this._props.sortOrder = sortOrder;
    this._props.updatedAt = new Date();
  }

  /**
   * 🗑️ 软删除
   */
  public softDelete(): void {
    if (this._props.deletedAt) {
      return; // 已经删除
    }
    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();
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
      title: this._props.title,
      description: this._props.description,
      progress: this._props.progress,
      weight: this._props.weight,
      sortOrder: this._props.sortOrder,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): import('@dailyuse/contracts/goal').KeyResultClientDTO {
    return {
      id: String(this.id),
      title: this._props.title,
      description: this._props.description,
      progress: this._props.progress,
      weight: this._props.weight,
      order: this._props.sortOrder,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(goalId: string): KeyResultPersistenceDTO {
    const progressPersistence = {
      initialValue: (this._props.progress as any).initialValue,
      currentValue: this._props.progress.currentValue,
      targetValue: this._props.progress.targetValue,
      valueType: this._props.progress.valueType,
      aggregationMethod: this._props.progress.aggregationMethod,
      unit: this._props.progress.unit,
    };

    return {
      id: this.id,
      goalId,
      title: this._props.title,
      description: this._props.description,
      progress: JSON.stringify(progressPersistence),
      weight: this._props.weight,
      sortOrder: this._props.sortOrder,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt,
    };
  }
}
