/**
 * Task Metadata Value Object
 * 任务元数据值对象
 */

import type { TaskPriority } from '../enums';

// ============ 接口定义 ============

/**
 * 任务元数据 - Server 接口
 */
export interface ITaskMetadataServer {
  /** 业务数据（JSON） */
  payload: Record<string, any>;

  /** 标签列表 */
  tags: string[];

  /** 优先级 */
  priority: TaskPriority;

  /** 超时时间（毫秒，null 表示不超时） */
  timeout: number | null;

  // 值对象方法
  equals(other: ITaskMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        ITaskMetadataServer,
        'equals' | 'with' | 'validate' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITaskMetadataServer;
  validate(): { isValid: boolean; errors: string[] };

  // DTO 转换方法}

/**
 * 任务元数据 - Client 接口
 */
export interface ITaskMetadataClient {
  /** 业务数据 */
  payload: Record<string, any>;

  /** 标签列表 */
  tags: string[];

  /** 优先级 */
  priority: TaskPriority;

  /** 超时时间 */
  timeout: number | null;

  // UI 辅助属性
  /** 优先级显示 */
  priorityDisplay: string; // "低" | "普通" | "高" | "紧急"

  /** 优先级颜色 */
  priorityColor: string; // "gray" | "blue" | "orange" | "red"

  /** 标签显示 */
  tagsDisplay: string; // "tag1, tag2, tag3"

  /** 超时时间格式化 */
  timeoutFormatted: string; // "30 秒" | "无限制"

  /** Payload 摘要 */
  payloadSummary: string; // "3 个字段"

  // 值对象方法
  equals(other: ITaskMetadataClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Task Metadata Server DTO
 */
export interface TaskMetadataServerDTO {
  payload: Record<string, any>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
}

/**
 * Task Metadata Client DTO
 */
export interface TaskMetadataClientDTO {
  payload: Record<string, any>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
  priorityDisplay: string;
  priorityColor: string;
  tagsDisplay: string;
  timeoutFormatted: string;
  payloadSummary: string;
}

/**
 * Task Metadata Persistence DTO
 */
export interface TaskMetadataPersistenceDTO {
  payload: string; // JSON.stringify(payload)
  tags: string; // JSON.stringify(tags)
  priority: string;
  timeout: number | null;
}

// ============ 类型导出 ============

export type TaskMetadataServer = ITaskMetadataServer;
export type TaskMetadataClient = ITaskMetadataClient;
