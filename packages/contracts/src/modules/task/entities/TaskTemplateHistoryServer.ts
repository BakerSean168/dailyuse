/**
 * TaskTemplateHistory Entity - Server Interface
 * 任务模板历史记录实体
 */

// 导入 ClientDTO 类型
import type { TaskTemplateHistoryClientDTO } from './TaskTemplateHistoryClient';

// ============ 接口定义 ============

/**
 * 任务模板历史 - Server 接口
 */
export interface TaskTemplateHistoryServer {
  uuid: string;
  templateUuid: string;
  action: string; // "created" | "updated" | "paused" | "resumed" | "archived"
  changes?: any | null; // 变更内容（JSON）
  createdAt: Date;

  toServerDTO(): TaskTemplateHistoryServerDTO;
  toClientDTO(): TaskTemplateHistoryClientDTO;
  toPersistenceDTO(): TaskTemplateHistoryPersistenceDTO;
}

// ============ DTO 定义 ============

/**
 * TaskTemplateHistory Server DTO
 */
export interface TaskTemplateHistoryServerDTO {
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: any | null;
  createdAt: number;
}

/**
 * TaskTemplateHistory Persistence DTO
 */
export interface TaskTemplateHistoryPersistenceDTO {
  uuid: string;
  templateUuid: string;
  action: string;
  changes?: string | null; // JSON string
  createdAt: Date;
}
