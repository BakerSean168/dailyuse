/**
 * KeyResult 实体
 * 关键结果实体
 *
 * DDD 实体职责：
 * - 管理关键结果的进度追踪
 * - 管理进度记录（GoalRecord）
 * - 执行进度计算和更新逻辑
 */

import { GoalRecord } from './GoalRecord';
import { Entity } from '@dailyuse/utils';
import type {
  AggregationMethod,
  GoalRecordServerDTO,
  KeyResultClientDTO,
  KeyResultPersistenceDTO,
  KeyResultProgressClientDTO,
  KeyResultProgressServerDTO,
  KeyResultServer,
  KeyResultServerDTO,
  KeyResultValueType,
} from '@dailyuse/contracts/goal';

// 用于解析持久化 DTO 中的 progress（JSON 字符串）
interface ProgressPersistence {
  initialValue?: number;
  currentValue: number;
  targetValue: number;
  valueType: string;
  aggregationMethod: string;
  unit?: string | null;
}

/**
 * KeyResult 实体
 */
export class KeyResult extends Entity implements KeyResultServer {
  // ===== 私有字段 =====
  private _goalUuid: string;
  private _title: string;
  private _description: string | null;
  private _progress: KeyResultProgressServerDTO;
  private _weight: number; // 权重 (0-100)
  private _order: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _records: GoalRecordServerDTO[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    description?: string | null;
    progress: KeyResultProgressServerDTO;
    weight?: number;
    order: number;
    createdAt: number;
    updatedAt: number;
    records?: GoalRecordServerDTO[];
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._description = params.description ?? null;
    this._progress = params.progress;
    this._weight = params.weight ?? 0; // 默认权重为 0
    this._order = params.order;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._records = params.records ?? [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null {
    return this._description;
  }
  public get progress(): KeyResultProgressServerDTO {
    return this._progress;
  }
  public get weight(): number {
    return this._weight;
  }
  public get order(): number {
    return this._order;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }
  public get records(): GoalRecordServerDTO[] | null {
    return this._records.length > 0 ? this._records : null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 KeyResult 实体
   */
  public static create(params: {
    goalUuid: string;
    title: string;
    description?: string;
    progress: KeyResultProgressServerDTO;
    weight?: number;
    order?: number;
  }): KeyResult {
    // 验证
    if (!params.goalUuid) {
      throw new Error('Goal UUID is required');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    const now = Date.now();

    return new KeyResult({
      goalUuid: params.goalUuid,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      progress: params.progress,
      weight: params.weight,
      order: params.order ?? 0,
      createdAt: now,
      updatedAt: now,
      records: [],
    });
  }

  /**
   * 从 Server DTO 重建实体
   */
  public static fromServerDTO(dto: KeyResultServerDTO): KeyResult {
    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description ?? null,
      progress: dto.progress,
      weight: dto.weight,
      order: dto.order,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      records: dto.records ?? [],
    });
  }

  /**
   * 从持久化 DTO 重建实体
   */
  public static fromPersistenceDTO(dto: KeyResultPersistenceDTO): KeyResult {
    // 解析 JSON 字符串
    const progressData = JSON.parse(dto.progress) as ProgressPersistence;

    const progress: KeyResultProgressServerDTO = {
      initialValue: progressData.initialValue,
      currentValue: progressData.currentValue,
      targetValue: progressData.targetValue,
      valueType: progressData.valueType as any,
      aggregationMethod: progressData.aggregationMethod as any,
      unit: progressData.unit,
    };

    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description ?? null,
      progress,
      weight: dto.weight,
      order: dto.order,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      records: [],
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新标题
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
   * 更新描述
   */
  public updateDescription(description: string): void {
    this._description = description.trim() || null;
    this._updatedAt = new Date();
  }

  /**
   * 更新权重
   */
  public updateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }
    this._weight = weight;
    this._updatedAt = new Date();
  }

  /**
   * @deprecated 使用 addRecord + recalculateProgress 代替
   * 更新进度并创建记录（保留用于向后兼容）
   */
  public updateProgress(newValue: number, note?: string): GoalRecordServerDTO {
    // 创建记录（只需要value）
    const record = GoalRecord.create({
      keyResultUuid: this.uuid,
      goalUuid: this._goalUuid,
      value: newValue,
      note: note?.trim() || undefined,
      recordedAt: Date.now(),
    });

    // 添加记录并重新计算
    this.addRecord(record.toServerDTO());

    return record.toServerDTO();
  }

  /**
   * 计算完成百分比
   */
  public calculatePercentage(): number {
    const start = (this._progress as any).initialValue ?? 0;
    const range = this._progress.targetValue - start;
    
    // 如果目标值无效或范围无效，返回 0
    if (this._progress.targetValue <= 0 || range <= 0) {
      return 0;
    }
    
    const percentage = ((this._progress.currentValue - start) / range) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * 是否已完成
   */
  public isCompleted(): boolean {
    return this._progress.currentValue >= this._progress.targetValue;
  }

  /**
   * 更新排序
   */
  public updateOrder(order: number): void {
    this._order = order;
    this._updatedAt = new Date();
  }

  /**
   * 添加记录并重新计算进度
   */
  public addRecord(record: GoalRecordServerDTO): void {
    this._records.push(record);
    this._updatedAt = new Date();
    this.recalculateProgress();
  }

  /**
   * 删除记录
   */
  public removeRecord(recordUuid: string): void {
    const index = this._records.findIndex(r => r.uuid === recordUuid);
    if (index === -1) {
      throw new Error(`Record with uuid ${recordUuid} not found`);
    }
    this._records.splice(index, 1);
    this._updatedAt = new Date();
    // 删除后重新计算进度
    this.recalculateProgress();
  }

  /**
   * 根据聚合方式重新计算进度
   */
  public recalculateProgress(): void {
    if (this._records.length === 0) {
      this._progress.currentValue = 0;
      this._updatedAt = new Date();
      return;
    }

    const values = this._records.map((record) => record.value);
    let newValue = 0;

    switch (this._progress.aggregationMethod) {
      case 'SUM':
        // 累加所有记录的值
        newValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'AVERAGE':
        // 计算平均值
        newValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'MAX':
        // 取最大值
        newValue = Math.max(...values);
        break;
      case 'MIN':
        // 取最小值
        newValue = Math.min(...values);
        break;
      case 'LAST':
        // 取最后一次
        newValue = values[values.length - 1];
        break;
    }

    this._progress = {
      ...this._progress,
      currentValue: newValue,
    };
    this._updatedAt = new Date();
  }

  /**
   * 获取所有记录的值
   */
  public getRecordValues(): number[] {
    return this._records.map((record) => record.value);
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): KeyResultServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: this._progress,
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      records: this._records.length > 0 ? this._records : null,
    };
  }

  public toClientDTO(): KeyResultClientDTO {
    const progressClientDTO: KeyResultProgressClientDTO = {
      valueType: this._progress.valueType,
      aggregationMethod: this._progress.aggregationMethod,
      initialValue: this._progress.initialValue,
      targetValue: this._progress.targetValue,
      currentValue: this._progress.currentValue,
      unit: this._progress.unit,
    };

    const recordsClientDTO = this._records.map((recordDTO) => {
      return GoalRecord.fromServerDTO(recordDTO).toClientDTO();
    });

    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: progressClientDTO,
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      records: recordsClientDTO.length > 0 ? recordsClientDTO : null,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): KeyResultPersistenceDTO {
    const progressPersistence: ProgressPersistence = {
      initialValue: (this._progress as any).initialValue,
      currentValue: this._progress.currentValue,
      targetValue: this._progress.targetValue,
      valueType: this._progress.valueType,
      aggregationMethod: this._progress.aggregationMethod,
      unit: this._progress.unit,
    };

    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: JSON.stringify(progressPersistence),
      weight: this._weight,
      order: this._order,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }
}
