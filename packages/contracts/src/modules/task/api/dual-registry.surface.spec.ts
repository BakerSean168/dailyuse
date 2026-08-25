/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 13 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: recurrence-rule-dual.surface.spec.ts, subtask-client-dto-dual.surface.spec.ts, task-dependency-transport-dual.surface.spec.ts, task-folder-history-client-dto-dual.surface.spec.ts, task-folder-history-server-dto-dual.surface.spec.ts, task-goal-binding-dual.surface.spec.ts, task-goal-binding-reminder-dual.surface.spec.ts, task-graph-dependency-dto-dual.surface.spec.ts, task-instance-dependency-schedule-task-client-dto-dual.surface.spec.ts, task-instance-range-op-res-dual.surface.spec.ts, task-instance-res-dual.surface.spec.ts, task-time-config-dual.surface.spec.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// --- merged from recurrence-rule-dual.surface.spec.ts ---
{
  /**
   * Residual 743: task recurrence-rule dual body retired.
   * RecurrenceRuleDTO reuses RecurrenceConfigSchema only.
   * Domain RecurrenceRule (Instant endDate) stays separate interface from transfer DTO schema.
   */
  describe('task recurrence-rule dual retired (residual 743)', () => {
    const apiDir = __dirname;
    const vo = readFileSync(resolve(apiDir, '../value-objects/recurrence-rule.ts'), 'utf8');
    const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');

    it('exports RecurrenceConfigSchema as sole shape from VO module', () => {
      expect(vo).toContain('Residual 743');
      expect(vo).toContain('export const RecurrenceConfigSchema = z');
    });

    it('semantic DTO is z.infer alias without interface dual body', () => {
      expect(vo).toContain(
        'export type RecurrenceRuleDTO = z.infer<typeof RecurrenceConfigSchema>',
      );
      expect(vo).not.toMatch(/export interface RecurrenceRuleDTO\b/);
      expect(vo).toContain('export interface RecurrenceRule {');
    });

    it('task-template.dto re-exports VO-owned schema (no local dual body)', () => {
      expect(templateDto).toContain('Residual 743');
      expect(templateDto).toContain("from '../value-objects/recurrence-rule'");
      expect(templateDto).toContain('export { RecurrenceConfigSchema }');
      expect(templateDto).not.toMatch(/const RecurrenceConfigSchema(?::[^=]+)? = z/);
      expect(templateDto).toContain('recurrenceRule: RecurrenceConfigSchema');
    });
  });
}

// --- merged from subtask-client-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 841: SubtaskClientDTO dual body retired.
   * Sole SubtaskResponseSchema + z.infer. SubtaskServerDTO remains retired (residual 649).
   */
  describe('subtask client dto dual retired (residual 841)', () => {
    const apiDir = __dirname;
    const client = readFileSync(resolve(apiDir, '../entities/subtask-client.ts'), 'utf8');
    const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
    const entities = resolve(apiDir, '../entities');

    it('owns SubtaskClientDTO as z.infer of SubtaskResponseSchema', () => {
      expect(client).toContain('Residual 841');
      expect(client).toContain(
        'export type SubtaskClientDTO = z.infer<typeof SubtaskResponseSchema>',
      );
      expect(client).not.toMatch(/export interface SubtaskClientDTO\b/);
      expect(schemas).toContain('Residual 841');
      expect(schemas).toContain('export const SubtaskResponseSchema = z.object({');
      expect(schemas).toContain('isCompleted: z.boolean()');
    });

    it('keeps SubtaskServerDTO retired (client-only track)', () => {
      expect(existsSync(resolve(entities, 'subtask-server.ts'))).toBe(false);
      const entitiesIndex = readFileSync(resolve(entities, 'index.ts'), 'utf8');
      expect(entitiesIndex).not.toMatch(/SubtaskServerDTO/);
      expect(entitiesIndex).toContain('SubtaskClientDTO');
    });

    it('client imports response-schemas only (no manual field dual)', () => {
      expect(client).toContain("from '../api/response-schemas'");
      expect(client).not.toContain('TransferDate');
      expect(client).not.toContain('createdAt: TransferDate');
    });
  });
}

// --- merged from task-dependency-transport-dual.surface.spec.ts ---
{
  /**
   * Residual 711: task dependency transport dual bodies retired.
   * Create/Update/Validate *Body + ValidateDependencyResponse reuse *Schema only.
   * Internal use-case request types with identityId remain explicit.
   * Soft residual 797: TaskGraphDependencyDTO dual retired via TaskDependencyResponseSchema
   * (see task-graph-dependency-dto-dual surface; not asserted here to avoid dual-surface lock drift).
   */
  describe('task dependency transport dual retired (residual 711)', () => {
    const apiDir = __dirname;
    const dto = readFileSync(resolve(apiDir, 'task-dependency.dto.ts'), 'utf8');
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
    const routes = readFileSync(
      resolve(apiDir, '../../../../../task/src/api/routes/task-dependency.routes.ts'),
      'utf8',
    );
    const controller = readFileSync(
      resolve(apiDir, '../../../../../task/src/server/transport/task-dependency.controller.ts'),
      'utf8',
    );

    it('exports body/response schemas as sole transport shapes', () => {
      expect(dto).toContain('Residual 711');
      expect(dto).toContain('export const CreateDependencyBodySchema = z.object({');
      expect(dto).toContain('export const UpdateDependencyBodySchema = z.object({');
      expect(dto).toContain('export const ValidateDependencyBodySchema = z.object({');
      expect(responseSchemas).toContain('Residual 711');
      expect(responseSchemas).toContain('export const ValidateDependencyResponseSchema');
    });

    it('semantic transport types are z.infer aliases without interface dual bodies', () => {
      expect(dto).toContain(
        'export type CreateTaskDependencyBody = z.infer<typeof CreateDependencyBodySchema>',
      );
      expect(dto).toContain(
        'export type UpdateTaskDependencyBody = z.infer<typeof UpdateDependencyBodySchema>',
      );
      expect(dto).toContain(
        'export type ValidateDependencyBody = z.infer<typeof ValidateDependencyBodySchema>',
      );
      expect(dto).toContain(
        'export type ValidateDependencyResponse = z.infer<typeof ValidateDependencyResponseSchema>',
      );
      expect(dto).not.toMatch(/export interface CreateTaskDependencyBody\b/);
      expect(dto).not.toMatch(/export interface UpdateTaskDependencyBody\b/);
      expect(dto).not.toMatch(/export interface ValidateDependencyBody\b/);
      expect(dto).not.toMatch(/export interface ValidateDependencyResponse\b/);
    });

    it('keeps internal identity use-case request interfaces', () => {
      expect(dto).toContain('export interface CreateTaskDependencyRequest');
      expect(dto).toContain('identityId: IdentityId');
      expect(dto).toContain('export interface UpdateTaskDependencyRequest');
    });

    it('routes bind dependency body schemas; controller delegates (Phase 4)', () => {
      // Phase 4: dependency request schemas are bound through the validation
      // adapters (routeWithValidation binds invocation schemas that nest the
      // body schemas); the controller accepts inferred input without safeParse.
      expect(routes).toContain('CreateTaskDependencyInvocationSchema');
      expect(routes).toContain('UpdateTaskDependencyInvocationSchema');
      expect(routes).toContain('ValidateTaskDependencyInvocationSchema');
      expect(routes).toContain('ValidateDependencyResponseSchema');
      expect(controller).toContain('CreateTaskDependencyBody');
      expect(controller).toContain('UpdateTaskDependencyBody');
      expect(controller).toContain('ValidateDependencyBody');
      expect(controller).not.toContain('CreateDependencyBodySchema.safeParse');
      expect(controller).not.toContain('UpdateDependencyBodySchema.safeParse');
      expect(controller).not.toContain('ValidateDependencyBodySchema.safeParse');
    });
  });
}

// --- merged from task-folder-history-client-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 837: TaskFolderClientDTO / TaskTemplateHistoryClientDTO dual bodies retired.
   * Sole *ResponseSchema + z.infer.
   * Soft residual 841: SubtaskClientDTO dual also retired via SubtaskResponseSchema.
   * Soft residual 843: Server DTOs also z.infer of same *ResponseSchema (see task-folder-history-server-dto-dual).
   */
  describe('task folder/history client dto duals retired (residual 837)', () => {
    const apiDir = __dirname;
    const folder = readFileSync(resolve(apiDir, '../aggregates/task-folder-client.ts'), 'utf8');
    const history = readFileSync(
      resolve(apiDir, '../entities/task-template-history-client.ts'),
      'utf8',
    );
    const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
    const folderServer = readFileSync(
      resolve(apiDir, '../aggregates/task-folder-server.ts'),
      'utf8',
    );
    const historyServer = readFileSync(
      resolve(apiDir, '../entities/task-template-history-server.ts'),
      'utf8',
    );

    it('owns TaskFolderClientDTO as z.infer of TaskFolderResponseSchema', () => {
      expect(folder).toContain('Residual 837');
      expect(folder).toContain(
        'export type TaskFolderClientDTO = z.infer<typeof TaskFolderResponseSchema>',
      );
      expect(folder).not.toMatch(/export interface TaskFolderClientDTO\b/);
      expect(schemas).toContain('Residual 837');
      expect(schemas).toContain('export const TaskFolderResponseSchema = z.object({');
      expect(schemas).toContain('icon: z.string().nullable()');
      // Soft residual 843: Server is z.infer of same schema (no interface dual body).
      expect(folderServer).toContain(
        'export type TaskFolderServerDTO = z.infer<typeof TaskFolderResponseSchema>',
      );
      expect(folderServer).not.toMatch(/export interface TaskFolderServerDTO\b/);
    });

    it('owns TaskTemplateHistoryClientDTO as z.infer of TaskTemplateHistoryResponseSchema', () => {
      expect(history).toContain('Residual 837');
      expect(history).toContain(
        'export type TaskTemplateHistoryClientDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
      );
      expect(history).not.toMatch(/export interface TaskTemplateHistoryClientDTO\b/);
      expect(schemas).toContain('export const TaskTemplateHistoryResponseSchema = z.object({');
      expect(schemas).toContain('changes: z.unknown()');
      // Soft residual 843: Server is z.infer of same schema (no interface dual body).
      expect(historyServer).toContain(
        'export type TaskTemplateHistoryServerDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
      );
      expect(historyServer).not.toMatch(/export interface TaskTemplateHistoryServerDTO\b/);
    });

    it('client and server both use response-schemas (no interface dual bodies)', () => {
      expect(folderServer).not.toMatch(/export interface TaskFolderClientDTO\b/);
      expect(historyServer).not.toMatch(/export interface TaskTemplateHistoryClientDTO\b/);
      expect(folderServer).not.toMatch(/export interface TaskFolderServerDTO\b/);
      expect(historyServer).not.toMatch(/export interface TaskTemplateHistoryServerDTO\b/);
      expect(folder).toContain("from '../api/response-schemas'");
      expect(history).toContain("from '../api/response-schemas'");
      expect(folderServer).toContain("from '../api/response-schemas'");
      expect(historyServer).toContain("from '../api/response-schemas'");
    });
  });
}

// --- merged from task-folder-history-server-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 843: TaskFolderServerDTO / TaskTemplateHistoryServerDTO dual bodies retired.
   * Same *ResponseSchema + z.infer as Client (residual 837). Full client+server single-track.
   */
  describe('task folder/history server dto duals retired (residual 843)', () => {
    const apiDir = __dirname;
    const folderServer = readFileSync(
      resolve(apiDir, '../aggregates/task-folder-server.ts'),
      'utf8',
    );
    const historyServer = readFileSync(
      resolve(apiDir, '../entities/task-template-history-server.ts'),
      'utf8',
    );
    const folderClient = readFileSync(
      resolve(apiDir, '../aggregates/task-folder-client.ts'),
      'utf8',
    );
    const historyClient = readFileSync(
      resolve(apiDir, '../entities/task-template-history-client.ts'),
      'utf8',
    );
    const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

    it('owns TaskFolderServerDTO as z.infer of TaskFolderResponseSchema', () => {
      expect(folderServer).toContain('Residual 843');
      expect(folderServer).toContain(
        'export type TaskFolderServerDTO = z.infer<typeof TaskFolderResponseSchema>',
      );
      expect(folderServer).not.toMatch(/export interface TaskFolderServerDTO\b/);
      expect(schemas).toContain('Residual 843');
      expect(schemas).toContain('export const TaskFolderResponseSchema = z.object({');
      expect(folderClient).toContain(
        'export type TaskFolderClientDTO = z.infer<typeof TaskFolderResponseSchema>',
      );
    });

    it('owns TaskTemplateHistoryServerDTO as z.infer of TaskTemplateHistoryResponseSchema', () => {
      expect(historyServer).toContain('Residual 843');
      expect(historyServer).toContain(
        'export type TaskTemplateHistoryServerDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
      );
      expect(historyServer).not.toMatch(/export interface TaskTemplateHistoryServerDTO\b/);
      expect(schemas).toContain('export const TaskTemplateHistoryResponseSchema = z.object({');
      expect(historyClient).toContain(
        'export type TaskTemplateHistoryClientDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
      );
    });

    it('server files import response-schemas only (no manual field dual)', () => {
      expect(folderServer).toContain("from '../api/response-schemas'");
      expect(historyServer).toContain("from '../api/response-schemas'");
      expect(folderServer).not.toContain('TransferDate');
      expect(historyServer).not.toContain('changes: unknown');
    });
  });
}

// --- merged from task-goal-binding-dual.surface.spec.ts ---
{
  /**
   * Residual 667: bind-to-goal request dual body retired.
   * Live bind-goal OpenAPI/controller parse TaskGoalBindingSchema only.
   * Residual 739: TaskGoalBindingSchema ownership moved to value-objects;
   * task-template.dto re-exports the VO-owned schema (no local dual body).
   */
  describe('task bind-to-goal request dual retired (residual 667)', () => {
    const apiDir = __dirname;
    const dto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');
    const routes = readFileSync(
      resolve(apiDir, '../../../../../task/src/api/routes/task-template.routes.ts'),
      'utf8',
    );
    const controller = readFileSync(
      resolve(apiDir, '../../../../../task/src/server/transport/task-template.controller.ts'),
      'utf8',
    );

    it('does not export a separate bind-to-goal zod dual body', () => {
      expect(dto).toContain('Residual 667');
      // Residual 739: schema is re-exported from VO (not a local export const dual).
      expect(dto).toMatch(
        /export \{[^}]*TaskGoalBindingSchema[^}]*\}|export const TaskGoalBindingSchema\b/,
      );
      expect(dto).toContain('export type BindToGoalReq = z.infer<typeof TaskGoalBindingSchema>');
      expect(dto).not.toMatch(/export const BindToGoalSchema\b/);
    });

    it('routes and controller use TaskGoalBindingSchema for bind-goal (Phase 4)', () => {
      expect(routes).toContain('BindTaskToGoalInvocationSchema');
      expect(routes).not.toContain('BindToGoalSchema');
      expect(controller).toContain('BindToGoalReq');
      expect(controller).not.toContain('BindToGoalSchema');
      // The invocation schema nests the VO-owned TaskGoalBindingSchema.
      expect(routes).toMatch(/BindTaskToGoalInvocationSchema\.shape\.body/);
    });
  });
}

// --- merged from task-goal-binding-reminder-dual.surface.spec.ts ---
{
  /**
   * Residual 739: task goal-binding / reminder-config dual bodies retired.
   * TaskGoalBindingDTO / TaskReminderConfigDTO reuse *Schema only.
   * (TaskTimeConfig Instant dual names remain separate interfaces.)
   */
  describe('task goal-binding/reminder dual retired (residual 739)', () => {
    const apiDir = __dirname;
    const binding = readFileSync(resolve(apiDir, '../value-objects/task-goal-binding.ts'), 'utf8');
    const reminder = readFileSync(
      resolve(apiDir, '../value-objects/task-reminder-config.ts'),
      'utf8',
    );
    const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');

    it('exports binding/reminder schemas as sole shapes from VO modules', () => {
      expect(binding).toContain('Residual 739');
      expect(binding).toContain('export const TaskGoalBindingSchema = z.object({');
      expect(reminder).toContain('Residual 739');
      expect(reminder).toContain('export const TaskReminderConfigSchema = z');
    });

    it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
      expect(binding).toContain(
        'export type TaskGoalBindingDTO = z.infer<typeof TaskGoalBindingSchema>',
      );
      expect(binding).not.toMatch(/export interface TaskGoalBindingDTO\b/);
      expect(reminder).toContain(
        'export type TaskReminderConfigDTO = z.infer<typeof TaskReminderConfigSchema>',
      );
      expect(reminder).not.toMatch(/export interface TaskReminderConfigDTO\b/);
    });

    it('task-template.dto re-exports VO-owned schemas (no local dual bodies)', () => {
      expect(templateDto).toContain('Residual 739');
      expect(templateDto).toContain("from '../value-objects/task-goal-binding'");
      expect(templateDto).toContain("from '../value-objects/task-reminder-config'");
      expect(templateDto).toContain('export { TaskReminderConfigSchema, TaskGoalBindingSchema }');
      expect(templateDto).not.toMatch(/const TaskGoalBindingSchema = z\.object\(\{/);
      expect(templateDto).not.toMatch(/const TaskReminderConfigSchema(?::[^=]+)? = z/);
      expect(templateDto).toContain('goalBinding: TaskGoalBindingSchema');
      expect(templateDto).toContain('reminderConfig: TaskReminderConfigSchema');
      expect(templateDto).toContain(
        'export type BindToGoalReq = z.infer<typeof TaskGoalBindingSchema>',
      );
    });
  });
}

// --- merged from task-graph-dependency-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 797: TaskGraphDependencyDTO dual body retired.
   * Sole TaskDependencyResponseSchema + z.infer (optional title fields are schema-owned superset).
   * QueryTaskTemplateGraphRes stays interface (TaskTemplateClientDTO vs TaskTemplateResponseSchema mismatch).
   */
  describe('task graph dependency dto dual retired (residual 797)', () => {
    const apiDir = __dirname;
    const dto = readFileSync(resolve(apiDir, 'task-dependency.dto.ts'), 'utf8');
    const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

    it('owns TaskGraphDependencyDTO as z.infer of TaskDependencyResponseSchema', () => {
      expect(dto).toContain('Residual 797');
      expect(dto).toContain('TaskDependencyResponseSchema');
      expect(dto).toContain(
        'export type TaskGraphDependencyDTO = z.infer<typeof TaskDependencyResponseSchema>',
      );
      expect(dto).not.toMatch(/export interface TaskGraphDependencyDTO\b/);
      expect(templateDto).not.toMatch(/export interface TaskGraphDependencyDTO\b/);
    });

    it('re-exports TaskGraphDependencyDTO from task-template.dto for graph consumers', () => {
      expect(templateDto).toContain('Residual 797');
      expect(templateDto).toContain(
        "import type { TaskGraphDependencyDTO } from './task-dependency.dto'",
      );
      expect(templateDto).toContain('export type { TaskGraphDependencyDTO }');
      expect(templateDto).toContain('dependencies: TaskGraphDependencyDTO[]');
      expect(templateDto).toContain('export interface QueryTaskTemplateGraphRes');
    });

    it('TaskDependencyResponseSchema owns optional title fields as superset', () => {
      expect(responseSchemas).toContain('Residual 797');
      expect(responseSchemas).toContain('export const TaskDependencyResponseSchema = z.object({');
      expect(responseSchemas).toContain('predecessorTaskTitle: z.string().optional()');
      expect(responseSchemas).toContain('successorTaskTitle: z.string().optional()');
      expect(responseSchemas).toContain('predecessorTaskId: brandedId<TaskTemplateId>()');
      expect(responseSchemas).toContain('successorTaskId: brandedId<TaskTemplateId>()');
    });
  });
}

// --- merged from task-instance-dependency-schedule-task-client-dto-dual.surface.spec.ts ---
{
  /**
   * Residual 831: TaskDependencyClientDTO / TaskInstanceClientDTO / ScheduleTaskClientDTO
   * dual bodies retired. Sole *ResponseSchema + z.infer.
   * DependencyChainClientDTO remains interface (shape mismatch vs DependencyChainResponseSchema).
   * Soft residual 837: TaskFolderClientDTO / TaskTemplateHistoryClientDTO duals also retired
   * via TaskFolderResponseSchema / TaskTemplateHistoryResponseSchema (see task-folder-history-client-dto-dual surface).
   */
  describe('task/schedule client dto duals retired (residual 831)', () => {
    const taskApi = __dirname;
    const scheduleApi = resolve(taskApi, '../../schedule/api');
    const dep = readFileSync(resolve(taskApi, '../aggregates/task-dependency-client.ts'), 'utf8');
    const instance = readFileSync(
      resolve(taskApi, '../aggregates/task-instance-client.ts'),
      'utf8',
    );
    const scheduleTask = readFileSync(
      resolve(taskApi, '../../schedule/aggregates/schedule-task-client.ts'),
      'utf8',
    );
    const taskSchemas = readFileSync(resolve(taskApi, 'response-schemas.ts'), 'utf8');
    const scheduleSchemas = readFileSync(resolve(scheduleApi, 'response-schemas.ts'), 'utf8');

    it('owns TaskDependencyClientDTO as z.infer; keeps DependencyChain interface dual', () => {
      expect(dep).toContain('Residual 831');
      expect(dep).toContain(
        'export type TaskDependencyClientDTO = z.infer<typeof TaskDependencyResponseSchema>',
      );
      expect(dep).not.toMatch(/export interface TaskDependencyClientDTO\b/);
      expect(dep).toMatch(/export interface DependencyChainClientDTO\b/);
      expect(dep).toContain('estimatedCompletionDate?: Instant');
      expect(taskSchemas).toContain('Residual 831');
      expect(taskSchemas).toContain('export const TaskDependencyResponseSchema = z.object({');
      const depRoutes = readFileSync(
        resolve(taskApi, '../../../../../task/src/api/routes/task-dependency.routes.ts'),
        'utf8',
      );
      expect(depRoutes).toContain("successResponse(TaskDependencyResponseSchema, '创建成功')");
    });

    it('owns TaskInstanceClientDTO as z.infer of TaskInstanceResponseSchema', () => {
      expect(instance).toContain('Residual 831');
      expect(instance).toContain(
        'export type TaskInstanceClientDTO = z.infer<typeof TaskInstanceResponseSchema>',
      );
      expect(instance).not.toMatch(/export interface TaskInstanceClientDTO\b/);
      expect(taskSchemas).toContain('export const TaskInstanceResponseSchema = z.object({');
      expect(taskSchemas).toContain('timeConfig: TaskTimeConfigSchema');
      const instRoutes = readFileSync(
        resolve(taskApi, '../../../../../task/src/api/routes/task-instance.routes.ts'),
        'utf8',
      );
      expect(instRoutes).toContain('TaskInstanceResponseSchema');
      expect(instRoutes).toContain("successResponse(TaskInstanceResponseSchema, '获取成功')");
    });

    it('owns ScheduleTaskClientDTO as z.infer of ScheduleTaskResponseSchema', () => {
      expect(scheduleTask).toContain('Residual 831');
      expect(scheduleTask).toContain(
        'export type ScheduleTaskClientDTO = z.infer<typeof ScheduleTaskResponseSchema>',
      );
      expect(scheduleTask).not.toMatch(/export interface ScheduleTaskClientDTO\b/);
      expect(scheduleSchemas).toContain('Residual 831');
      expect(scheduleSchemas).toContain('export const ScheduleTaskResponseSchema = z.object({');
      expect(scheduleSchemas).toContain(
        'executions: z.array(ScheduleExecutionResponseSchema).nullable()',
      );
      const routes = readFileSync(
        resolve(scheduleApi, '../../../../../schedule/src/api/routes.ts'),
        'utf8',
      );
      expect(routes).toContain("successResponse(ScheduleTaskResponseSchema, '创建成功')");
    });
  });
}

// --- merged from task-instance-range-op-res-dual.surface.spec.ts ---
{
  /**
   * Residual 789: GetTaskInstancesByRangeRes / TaskInstanceOperationRes dual bodies retired.
   * Sole *ResSchema + z.infer nesting TaskInstanceResponseSchema.
   */
  describe('task instance range/op res duals retired (residual 789)', () => {
    const apiDir = __dirname;
    const dto = readFileSync(resolve(apiDir, 'task-instance.dto.ts'), 'utf8');
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

    it('owns by-range and operation ResSchema + z.infer aliases', () => {
      expect(dto).toContain('Residual 789');
      expect(dto).toContain('export const GetTaskInstancesByRangeResSchema = z.object({');
      expect(dto).toContain(
        'export type GetTaskInstancesByRangeRes = z.infer<typeof GetTaskInstancesByRangeResSchema>',
      );
      expect(dto).toContain('export const TaskInstanceOperationResSchema = z.object({');
      expect(dto).toContain(
        'export type TaskInstanceOperationRes = z.infer<typeof TaskInstanceOperationResSchema>',
      );
      expect(dto).toContain('data: z.array(TaskInstanceResponseSchema)');
      expect(dto).toContain('instance: TaskInstanceResponseSchema');
      expect(dto).not.toMatch(/export interface GetTaskInstancesByRangeRes\b/);
      expect(dto).not.toMatch(/export interface TaskInstanceOperationRes\b/);
    });

    it('nests TaskInstanceResponseSchema from response-schemas', () => {
      expect(responseSchemas).toContain('export const TaskInstanceResponseSchema = z.object({');
      expect(dto).toContain("from './response-schemas'");
      expect(dto).toContain('TaskInstanceResponseSchema');
    });
  });
}

// --- merged from task-instance-res-dual.surface.spec.ts ---
{
  /**
   * Residual 262: task contracts drop identity dual response aliases and
   * TaskDomainEvent alias of TaskCreatedEvent.
   */
  describe('task instance Res dual single-track surface', () => {
    const apiDir = __dirname;
    const instanceDto = readFileSync(resolve(apiDir, 'task-instance.dto.ts'), 'utf8');
    const rpcMap = readFileSync(resolve(apiDir, '../protocol/task-rpc-map.ts'), 'utf8');
    const eventsIndex = readFileSync(resolve(apiDir, '../domain/events/index.ts'), 'utf8');

    it('does not dual-alias Complete/Skip TaskInstanceRes', () => {
      expect(instanceDto).not.toMatch(/export type CompleteTaskInstanceRes\s*=/);
      expect(instanceDto).not.toMatch(/export type SkipTaskInstanceRes\s*=/);
      // Soft residual 789: operation Res dual retired — ResSchema + z.infer only.
      expect(instanceDto).toContain('Residual 789');
      expect(instanceDto).toContain('export const TaskInstanceOperationResSchema = z.object({');
      expect(instanceDto).toContain(
        'export type TaskInstanceOperationRes = z.infer<typeof TaskInstanceOperationResSchema>',
      );
      expect(instanceDto).not.toMatch(/export interface TaskInstanceOperationRes\b/);
    });

    it('rpc map uses shared TaskInstanceResponse alias for complete/skip (Phase 4)', () => {
      // Phase 4: the RPC map uses channel-aligned keys and the exported
      // inferred response alias (ADR-047: maps import inferred types from
      // `../api` only) instead of kebab keys + OperationRes or inline z.infer.
      expect(rpcMap).toMatch(
        /'task:instance:complete':\s*\[\s*CompleteTaskInstanceInvocation,\s*TaskInstanceResponse/,
      );
      expect(rpcMap).toMatch(
        /'task:instance:skip':\s*\[\s*SkipTaskInstanceInvocation,\s*TaskInstanceResponse/,
      );
      expect(rpcMap).toContain('TaskInstanceResponse');
      expect(rpcMap).not.toContain('z.infer');
      expect(rpcMap).not.toContain('CompleteTaskInstanceRes');
      expect(rpcMap).not.toContain('SkipTaskInstanceRes');
    });

    it('does not dual-export TaskDomainEvent = TaskCreatedEvent', () => {
      expect(eventsIndex).not.toContain('TaskDomainEvent');
      expect(eventsIndex).toContain('TaskCreatedEvent');
    });
  });
}

// --- merged from task-time-config-dual.surface.spec.ts ---
{
  /**
   * Residual 747: task time-config dual body retired.
   * TaskTimeConfigDTO reuses TaskTimeConfigSchema only.
   * Domain TaskTimeConfig (Instant startDate + startDay Ymd) — ADR-037; schema is transfer sole.
   *
   * Soft residual 831: TaskInstanceClientDTO dual retired via TaskInstanceResponseSchema
   * (see task-instance-dependency-schedule-task-client-dto-dual surface).
   */
  describe('task time-config dual retired (residual 747)', () => {
    const apiDir = __dirname;
    const vo = readFileSync(resolve(apiDir, '../value-objects/task-time-config.ts'), 'utf8');
    const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');

    it('exports TaskTimeConfigSchema as sole shape from VO module', () => {
      expect(vo).toContain('Residual 747');
      expect(vo).toContain('export const TaskTimeConfigSchema = z');
    });

    it('semantic DTO is z.infer alias without interface dual body', () => {
      expect(vo).toContain('export type TaskTimeConfigDTO = z.infer<typeof TaskTimeConfigSchema>');
      expect(vo).not.toMatch(/export interface TaskTimeConfigDTO\b/);
      expect(vo).toContain('export interface TaskTimeConfig {');
      expect(vo).toContain('startDate: Instant | null');
    });

    it('task-template.dto re-exports VO-owned schema (no local dual body)', () => {
      expect(templateDto).toContain('Residual 747');
      expect(templateDto).toContain("from '../value-objects/task-time-config'");
      expect(templateDto).toContain('export { TaskTimeConfigSchema }');
      expect(templateDto).not.toMatch(/const TaskTimeConfigSchema(?::[^=]+)? = z/);
      expect(templateDto).toContain('timeConfig: TaskTimeConfigSchema');
    });
  });
}
