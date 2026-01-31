/**
 * Key Result Progress Value Object
 * 关键成果进度值对象
 */

import type { KeyResultValueType, AggregationMethod } from '../enums';

// ============ 接口定义 ============

/**
 * 关键成果进度 - Server 接口
 */
export interface IKeyResultProgressServer {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod; // 聚合计算方式
  /**
   * 起始值（可选，默认为 0）
   * 用于计算进度百分比：(currentValue - initialValue) / (targetValue - initialValue)
   * 
   * 示例：
   * - 用户从 10K 增长到 20K：initialValue = 10000, targetValue = 20000
   * - 减重 10kg：initialValue = 0, targetValue = 10（表述为"减重10kg"而非"从60kg减到50kg"）
   */
  initialValue?: number;
  targetValue: number;
  currentValue: number;
  unit?: string | null;

  // 值对象方法
  equals(other: IKeyResultProgressServer): boolean;
  with(
    updates: Partial<
      Omit<
        IKeyResultProgressServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IKeyResultProgressServer;

  // 业务方法
  calculatePercentage(): number; // 计算完成百分比
  isCompleted(): boolean; // 是否已完成
  updateProgress(newValue: number): IKeyResultProgressServer; // 更新进度
  recalculateFromRecords(recordValues: number[]): number; // 根据记录重新计算当前值

  // DTO 转换方法}

/**
 * 关键成果进度 - Client 接口
 */
export interface IKeyResultProgressClient {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  /**
   * 起始值（可选，默认为 0）
   */
  initialValue?: number;
  targetValue: number;
  currentValue: number;
  unit?: string | null;

  // 值对象方法
  equals(other: IKeyResultProgressClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Key Result Progress Server DTO
 */
export interface KeyResultProgressServerDTO {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  /** 起始值（可选，默认为 0） */
  initialValue?: number;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}

/**
 * Key Result Progress Client DTO
 */
export interface KeyResultProgressClientDTO {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  /** 起始值（可选，默认为 0） */
  initialValue?: number;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}

/**
 * Key Result Progress Persistence DTO
 * 持久化层使用 camelCase 命名（与数据库 snake_case 的映射在仓储层处理）
 */
export interface KeyResultProgressPersistenceDTO {
  valueType: KeyResultValueType;
  aggregationMethod: AggregationMethod;
  /** 起始值（可选，默认为 0） */
  initialValue?: number;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}

// ============ 类型导出 ============

export type KeyResultProgressServer = IKeyResultProgressServer;
export type KeyResultProgressClient = IKeyResultProgressClient;
