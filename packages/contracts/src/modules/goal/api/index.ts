/**
 * Goal API - Unified Exports
 *
 * 统一导出所有目标相关的 API 定义
 * 使用方式: import { CreateGoalReq, AddKeyResultReq } from '@contracts/goal/api';
 */

// 从 feature-based DTO files 导出
export * from './goal-crud.dto';
export * from './key-result.dto';
export * from './goal-record.dto';
export * from './focus-session.dto';
export * from './goal-folder.dto';
export * from './goal-review.dto';
export * from './goal-invocation.schemas';
export * from './response-schemas';

// Focus-mode request/response aliases surface on the API boundary so the RPC
// map imports inferred types from `../api` only (ADR-047).
// 专注模式请求/响应类型别名暴露在 API 边界，使 RPC map 只从 `../api` 导入
// 推导类型（ADR-047）。
export type {
  ActivateFocusModeReq,
  ExtendFocusModeReq,
  FocusModeDTO,
} from '../value-objects/focus-mode';
