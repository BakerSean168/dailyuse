/**
 * TaskTemplateHistory Entity - Server Interface
 * 任务模板历史记录实体
 */

import type {
  TaskTemplateId,
  DomainDate,
  TransferDate,
  PersistenceDate,
} from '@/primitives';

// 导入 ClientDTO 类型
import type { TaskTemplateHistoryClientDTO } from './task-template-history-client';

// ============ 接口定义 ============

/**
 * 任务模板历史 - Server 接口
 */
export interface TaskTemplateHistoryServer {
  id: string;
  templateId: TaskTemplateId;
  action: string; // "created" | "updated" | "paused" | "resumed" | "archived"
  changes: any | null; // 变更内容（JSON�?
  createdAt: DomainDate;
}

// ============ DTO 定义 ============

/**
 * TaskTemplateHistory Server DTO
 */
export interface TaskTemplateHistoryServerDTO {
  id: string;
  templateId: string;
  action: string;
  changes: any | null;
  createdAt: TransferDate;
}

/**
 * TaskTemplateHistory Persistence DTO
 */
export interface TaskTemplateHistoryPersistenceDTO {
  id: string;
  templateId: string;
  action: string;
  changes: string | null; // JSON string
  createdAt: PersistenceDate;
}
