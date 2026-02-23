/**
 * Task Metadata Value Object
 * 任务元数据值对�?
 */

import type { TaskPriority } from './task-priority';

// ============ 接口定义 ============

/**
 * 任务元数�?- Server 接口
 */
export interface ITaskMetadataServer {
  /** 业务数据（JSON�?*/
  payload: Record<string, unknown>;

  /** 标签列表 */
  tags: string[];

  /** 优先�?*/
  priority: TaskPriority;

  /** 超时时间（毫秒，null 表示不超时） */
  timeout: number | null;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        ITaskMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITaskMetadataServer;

  // DTO 转换方法
}

/**
 * 任务元数�?- Client 接口
 */
export interface ITaskMetadataClient {
  /** 业务数据 */
  payload: Record<string, unknown>;

  /** 标签列表 */
  tags: string[];

  /** 优先�?*/
  priority: TaskPriority;

  /** 超时时间 */
  timeout: number | null;

  // UI 辅助属�?
  /** 优先级显�?*/
  priorityDisplay: string; // "�? | "普�? | "�? | "紧�?

  /** 优先级颜�?*/
  priorityColor: string; // "gray" | "blue" | "orange" | "red"

  /** 标签显示 */
  tagsDisplay: string; // "tag1, tag2, tag3"

  /** 超时时间格式�?*/
  timeoutFormatted: string; // "30 �? | "无限�?

  /** Payload 摘要 */
  payloadSummary: string; // "3 个字�?

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Task Metadata Server DTO
 */
export interface TaskMetadataServerDTO {
  payload: Record<string, unknown>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
}

/**
 * Task Metadata Client DTO
 */
export interface TaskMetadataClientDTO {
  payload: Record<string, unknown>;
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
