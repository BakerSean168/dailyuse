/**
 * Task Invocation Schemas
 * 任务操作调用契约
 *
 * Named composite request schemas that bind path params + body/query into the
 * canonical contract input validated by the shared validation adapters
 * (`expressAdapterWithValidation` / `ipcAdapterWithValidation`). Each schema is
 * the single source of truth for BOTH the OpenAPI request registration (via
 * `.shape`) and the runtime validator — never inline `z.object` in route
 * callbacks. Identity never appears in these bodies; it is supplied by the
 * canonical `ExecutionContext`.
 *
 * 命名复合请求 schema：把 path params + body/query 组合成 shared validation
 * adapter 校验的 canonical contract 输入。每个 schema 同时是 OpenAPI request
 * 注册（通过 `.shape`）与 runtime 校验器的唯一事实来源——绝不在 route callback
 * 内拼内联 `z.object`。identity 永不出现于这些 body，而是由 canonical
 * `ExecutionContext` 提供。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { TaskDependencyId, TaskInstanceId, TaskTemplateId } from '../../../primitives';
import {
  GenerateInstancesSchema,
  TaskGoalBindingSchema,
  UpdateTaskTemplateSchema,
} from './task-template.dto';
import {
  CompleteTaskInstanceSchema,
  MarkTaskInstanceMissedSchema,
  SkipTaskInstanceSchema,
} from './task-instance.dto';
import {
  CreateDependencyBodySchema,
  UpdateDependencyBodySchema,
  ValidateDependencyBodySchema,
} from './task-dependency.dto';

// ============================================================================
// Shared route params
// ============================================================================

/** `:id` path param for a task-template-scoped route. 任务模板作用域路由的 `:id` path 参数。 */
export const TaskTemplateIdParamsSchema = z.object({ id: brandedId<TaskTemplateId>() });
export type TaskTemplateIdParams = z.infer<typeof TaskTemplateIdParamsSchema>;

/** `:id` path param for a task-instance-scoped route. 任务实例作用域路由的 `:id` path 参数。 */
export const TaskInstanceIdParamsSchema = z.object({ id: brandedId<TaskInstanceId>() });
export type TaskInstanceIdParams = z.infer<typeof TaskInstanceIdParamsSchema>;

/** `:taskId` path param for a dependency route. 依赖路由的 `:taskId` path 参数。 */
export const TaskDependencyTaskIdParamsSchema = z.object({ taskId: brandedId<TaskTemplateId>() });
export type TaskDependencyTaskIdParams = z.infer<typeof TaskDependencyTaskIdParamsSchema>;

/** `:id` path param for a dependency-scoped route. 依赖作用域路由的 `:id` path 参数。 */
export const TaskDependencyIdParamsSchema = z.object({ id: brandedId<TaskDependencyId>() });
export type TaskDependencyIdParams = z.infer<typeof TaskDependencyIdParamsSchema>;

// ============================================================================
// Template mutations
// ============================================================================

/** PUT/PATCH /:id — update a template. 更新任务模板。 */
export const UpdateTaskTemplateInvocationSchema = z.object({
  params: TaskTemplateIdParamsSchema,
  body: UpdateTaskTemplateSchema,
});
export type UpdateTaskTemplateInvocation = z.infer<typeof UpdateTaskTemplateInvocationSchema>;

/** POST /:id/generate-instances — generate instances for a template. 为模板生成实例。 */
export const GenerateInstancesInvocationSchema = z.object({
  params: TaskTemplateIdParamsSchema,
  body: GenerateInstancesSchema,
});
export type GenerateInstancesInvocation = z.infer<typeof GenerateInstancesInvocationSchema>;

/** POST /:id/bind-goal — bind a template to a goal. 绑定模板到目标。 */
export const BindTaskToGoalInvocationSchema = z.object({
  params: TaskTemplateIdParamsSchema,
  body: TaskGoalBindingSchema,
});
export type BindTaskToGoalInvocation = z.infer<typeof BindTaskToGoalInvocationSchema>;

/** POST /:id/activate | /pause | /archive | /unbind-goal — id-only template commands. 模板 id-only 命令。 */
export const TaskTemplateIdCommandInvocationSchema = z.object({
  params: TaskTemplateIdParamsSchema,
});
export type TaskTemplateIdCommandInvocation = z.infer<typeof TaskTemplateIdCommandInvocationSchema>;

// ============================================================================
// Instance mutations
// ============================================================================

/** POST /:id/complete — complete an instance. 完成任务实例。 */
export const CompleteTaskInstanceInvocationSchema = z.object({
  params: TaskInstanceIdParamsSchema,
  body: CompleteTaskInstanceSchema,
});
export type CompleteTaskInstanceInvocation = z.infer<typeof CompleteTaskInstanceInvocationSchema>;

/** POST /:id/skip — skip an instance. 跳过任务实例。 */
export const SkipTaskInstanceInvocationSchema = z.object({
  params: TaskInstanceIdParamsSchema,
  body: SkipTaskInstanceSchema,
});
export type SkipTaskInstanceInvocation = z.infer<typeof SkipTaskInstanceInvocationSchema>;

/** POST /:id/missed — explicitly record a missed occurrence. */
export const MarkTaskInstanceMissedInvocationSchema = z.object({
  params: TaskInstanceIdParamsSchema,
  body: MarkTaskInstanceMissedSchema,
});
export type MarkTaskInstanceMissedInvocation = z.infer<
  typeof MarkTaskInstanceMissedInvocationSchema
>;

/** POST /:id/start | /uncomplete — id-only instance commands. 实例 id-only 命令。 */
export const TaskInstanceIdCommandInvocationSchema = z.object({
  params: TaskInstanceIdParamsSchema,
});
export type TaskInstanceIdCommandInvocation = z.infer<typeof TaskInstanceIdCommandInvocationSchema>;

// ============================================================================
// Dependency mutations
// ============================================================================

/** POST /:taskId/dependencies — create a dependency (successor from path). 创建依赖。 */
export const CreateTaskDependencyInvocationSchema = z.object({
  params: TaskDependencyTaskIdParamsSchema,
  body: CreateDependencyBodySchema,
});
export type CreateTaskDependencyInvocation = z.infer<typeof CreateTaskDependencyInvocationSchema>;

/** PUT /dependencies/:id — update a dependency. 更新依赖。 */
export const UpdateTaskDependencyInvocationSchema = z.object({
  params: TaskDependencyIdParamsSchema,
  body: UpdateDependencyBodySchema,
});
export type UpdateTaskDependencyInvocation = z.infer<typeof UpdateTaskDependencyInvocationSchema>;

/** DELETE /dependencies/:id — delete a dependency (id-only). 删除依赖。 */
export const DeleteTaskDependencyInvocationSchema = z.object({
  params: TaskDependencyIdParamsSchema,
});
export type DeleteTaskDependencyInvocation = z.infer<typeof DeleteTaskDependencyInvocationSchema>;

/** POST /dependencies/validate — validate a potential dependency. 验证依赖。 */
export const ValidateTaskDependencyInvocationSchema = ValidateDependencyBodySchema;
export type ValidateTaskDependencyInvocation = z.infer<
  typeof ValidateTaskDependencyInvocationSchema
>;
