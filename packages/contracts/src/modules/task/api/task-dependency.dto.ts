/**
 * Task Dependency - API Transport DTOs
 * 依赖关系请求/响应类型（属于 api 层，不属于 aggregates）
 *
 * 分层说明：
 * - CreateTaskDependencyBody: 外部 HTTP 请求体（无 identityId，successorTaskId 可选）
 * - CreateTaskDependencyRequest: 内部 use case 输入（含 identityId，全部必填）
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  TaskTemplateId,
  IdentityId,
} from '../../../primitives';
import type { DependencyType } from '../value-objects/dependency-type';
import type { TaskDependencyClientDTO } from '../aggregates/task-dependency-client';
import {
  TaskDependencyResponseSchema,
  ValidateDependencyResponseSchema,
} from './response-schemas';

// ============ Zod Schemas (route request bodies) ============

export const CreateDependencyBodySchema = z.object({
  predecessorTaskId: brandedId<TaskTemplateId>(),
  successorTaskId: brandedId<TaskTemplateId>().optional(),
  dependencyType: z.string().optional(),
  lagDays: z.number().optional(),
});

export const UpdateDependencyBodySchema = z.object({
  dependencyType: z.string().optional(),
  lagDays: z.number().optional(),
});

export const ValidateDependencyBodySchema = z.object({
  predecessorTaskId: brandedId<TaskTemplateId>(),
  successorTaskId: brandedId<TaskTemplateId>(),
});

// ============ Transport types (external HTTP body) ============
// Residual 711: transport dual bodies retired — OpenAPI + transport use *BodySchema only.

/**
 * 创建依赖 — 外部请求体（HTTP body）
 * 不含 identityId（由 Context 注入），successorTaskId 可选
 */
export type CreateTaskDependencyBody = z.infer<typeof CreateDependencyBodySchema>;

/**
 * 更新依赖 — 外部请求体
 */
export type UpdateTaskDependencyBody = z.infer<typeof UpdateDependencyBodySchema>;

/**
 * 验证依赖 — 外部请求体
 */
export type ValidateDependencyBody = z.infer<typeof ValidateDependencyBodySchema>;

// ============ Internal types (use case input) ============

/**
 * 创建依赖 — 内部 use case 输入（含 identityId）
 */
export interface CreateTaskDependencyRequest {
  identityId: IdentityId;
  predecessorTaskId: TaskTemplateId;
  successorTaskId: TaskTemplateId;
  dependencyType: DependencyType;
  lagDays?: number;
}

/**
 * 更新依赖 — 内部 use case 输入
 */
export interface UpdateTaskDependencyRequest {
  dependencyType?: DependencyType;
  lagDays?: number;
}

// Residual 711: validate response dual body retired — OpenAPI + transport use ValidateDependencyResponseSchema.
/** 验证依赖响应 */
export type ValidateDependencyResponse = z.infer<typeof ValidateDependencyResponseSchema>;

// Residual 797: TaskGraphDependencyDTO dual retired — graph edges reuse TaskDependencyResponseSchema only
// (optional predecessor/successor titles are schema-owned superset).
export type TaskGraphDependencyDTO = z.infer<typeof TaskDependencyResponseSchema>;

/**
 * 批量创建依赖请求
 */
export interface BatchCreateDependenciesRequest {
  dependencies: CreateTaskDependencyRequest[];
}

/**
 * 批量创建依赖响应
 */
export interface BatchCreateDependenciesResponse {
  created: TaskDependencyClientDTO[];
  failed: {
    request: CreateTaskDependencyRequest;
    error: string;
  }[];
}
