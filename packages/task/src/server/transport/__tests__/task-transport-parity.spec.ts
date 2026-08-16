/**
 * Task transport parity spec (Phase 4).
 *
 * Every Task mutation ledger row is fed the SAME canonical fixture through the
 * real `expressAdapterWithValidation` (HTTP) and the real
 * `ipcAdapterWithValidation` (IPC). Both transports share the SAME controller
 * instance, so parity is proven by construction: they validate the contract
 * invocation schema before the controller, reach the same application use-case
 * with equivalent input and context, and return equivalent envelopes. Malformed
 * fixtures are rejected by the adapter before the controller on both
 * transports.
 *
 * 每个 Task mutation ledger 行都用同一 canonical fixture 通过真实
 * `expressAdapterWithValidation`（HTTP）与 `ipcAdapterWithValidation`（IPC），
 * 且两条 transport 共用同一个 controller。因此 parity 由构造保证：先校验
 * invocation schema 再调用 controller；以等价输入与 context 调用同一
 * application use-case；返回等价 envelope。malformed fixture 在两条 transport
 * 上都由 adapter 在 controller 前拒绝。
 */
import { describe, expect, it, vi } from 'vitest';
import { expressAdapterWithValidation, ipcAdapterWithValidation } from '@memoflow/utils/result';
import type { ExecutionContext, RequestContext } from '@memoflow/contracts/shared';
import {
  BindTaskToGoalInvocationSchema,
  CompleteTaskInstanceInvocationSchema,
  CreateTaskDependencyInvocationSchema,
  CreateTaskTemplateSchema,
  DeleteTaskDependencyInvocationSchema,
  GenerateInstancesInvocationSchema,
  SkipTaskInstanceInvocationSchema,
  TaskInstanceIdCommandInvocationSchema,
  TaskTemplateIdCommandInvocationSchema,
  UpdateTaskDependencyInvocationSchema,
  UpdateTaskTemplateInvocationSchema,
  ValidateTaskDependencyInvocationSchema,
} from '@memoflow/contracts/task';
import { ok } from '@memoflow/contracts/result';
import { TaskTemplateController } from '../task-template.controller';
import { TaskInstanceController } from '../task-instance.controller';
import { TaskDependencyController } from '../task-dependency.controller';

const CARRIER: RequestContext = {
  requestId: 'req-task-parity',
  traceId: 'req-task-parity',
  startedAt: 1_700_000_000_000,
  source: 'ipc',
};

const fixtureContext: ExecutionContext = {
  ...CARRIER,
  identityId: 'identity-1',
  deviceId: 'desktop-app',
};

const TEMPLATE_ID = 'ITaskTemplateId_550e8400-e29b-41d4-a716-446655440000';
const INSTANCE_ID = 'ITaskInstanceId_550e8400-e29b-41d4-a716-446655440001';
const DEPENDENCY_ID = 'ITaskDependencyId_550e8400-e29b-41d4-a716-446655440002';
const GOAL_ID = 'IGoalId_550e8400-e29b-41d4-a716-446655440003';
const KR_ID = 'IKeyResultId_550e8400-e29b-41d4-a716-446655440004';

const FAKE_TEMPLATE = { id: TEMPLATE_ID, name: 'Template', status: 'Active' };
const FAKE_INSTANCE = { id: INSTANCE_ID, status: 'Scheduled' };
const FAKE_DEPENDENCY = { id: DEPENDENCY_ID, dependencyType: 'FS' };

function createRes() {
  const res: any = {
    statusCode: 0,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
}

type AnySchema = { safeParse(data: unknown): { success: boolean; data?: unknown } };

interface RowSpec {
  readonly schema: AnySchema;
  readonly projectHttp: (req: { body?: unknown; params?: Record<string, string> }) => unknown;
  readonly projectIpc: (args: unknown) => unknown;
  readonly httpReq: { body?: unknown; params?: Record<string, string> };
  readonly ipcArgs: unknown;
  readonly validInvocation: unknown;
  readonly malformedInvocation: unknown;
  readonly malformedHttpReq: { body?: unknown; params?: Record<string, string> };
  readonly malformedIpcArgs: unknown;
  readonly invoke: (controller: unknown, data: unknown, ctx: ExecutionContext) => Promise<unknown>;
  readonly assertUseCase: (useCase: ReturnType<typeof vi.fn>, expected: unknown) => void;
}

async function runRow(
  spec: RowSpec,
  buildController: () => { controller: unknown; useCase: ReturnType<typeof vi.fn> },
) {
  const { controller, useCase } = buildController();

  const httpHandler = expressAdapterWithValidation(
    spec.schema as never,
    async (data, ctx) => spec.invoke(controller, data, ctx),
    {
      successStatus: 200,
      extractContext: () => fixtureContext,
      projectInput: spec.projectHttp as never,
    },
  );
  const httpRes = createRes();
  await httpHandler(
    {
      ...spec.httpReq,
      user: { identityId: 'identity-1' },
      requestContext: fixtureContext,
    } as never,
    httpRes,
  );
  expect(httpRes.statusCode).toBe(200);
  expect(httpRes.body.ok).toBe(true);

  const ipcHandler = ipcAdapterWithValidation(
    spec.schema as never,
    async (data, ctx) => spec.invoke(controller, data, ctx),
    { extractContext: () => fixtureContext, projectArgs: spec.projectIpc as never },
  );
  const ipcResult = await ipcHandler({ sender: {}, senderFrame: {} }, spec.ipcArgs);
  expect(ipcResult.ok).toBe(true);

  spec.assertUseCase(useCase, spec.validInvocation);

  // Malformed rejected before controller on both transports.
  const badHttpRes = createRes();
  await httpHandler(
    {
      ...spec.malformedHttpReq,
      user: { identityId: 'identity-1' },
      requestContext: fixtureContext,
    } as never,
    badHttpRes,
  );
  expect(badHttpRes.statusCode).toBe(400);
  expect(badHttpRes.body.error.code).toBe('VALIDATION_ERROR');

  const badIpcResult = await ipcHandler({ sender: {}, senderFrame: {} }, spec.malformedIpcArgs);
  expect(badIpcResult.ok).toBe(false);
  expect(badIpcResult.error?.code).toBe('VALIDATION_ERROR');
}

function okTemplate() {
  return ok(FAKE_TEMPLATE);
}

function templateUseCases() {
  const useCase = vi.fn(async () => okTemplate());
  return {
    controller: new TaskTemplateController({
      createTemplate: useCase,
      updateTemplate: useCase,
      deleteTemplate: useCase,
      activateTemplate: useCase,
      pauseTemplate: useCase,
      archiveTemplate: useCase,
      generateInstances: useCase,
      bindToGoal: useCase,
      unbindFromGoal: useCase,
      getTemplate: vi.fn(),
      listTemplates: vi.fn(),
      getTaskGraph: vi.fn(),
      listByPriority: vi.fn(),
      listInstancesByTemplate: vi.fn(),
    } as never),
    useCase,
  };
}

function instanceUseCases() {
  const useCase = vi.fn(async () => ok(FAKE_INSTANCE));
  return {
    controller: new TaskInstanceController({
      complete: useCase,
      uncomplete: useCase,
      skip: useCase,
      start: useCase,
      deleteInstance: useCase,
      getTaskInstance: vi.fn(),
      listByAccount: vi.fn(),
      listByTemplate: vi.fn(),
      listByStatus: vi.fn(),
      getByDateRange: vi.fn(),
      checkExpired: vi.fn(),
    } as never),
    useCase,
  };
}

function dependencyUseCases() {
  const useCase = vi.fn(async () => ok(FAKE_DEPENDENCY));
  return {
    controller: new TaskDependencyController({
      createDependency: useCase,
      updateDependency: useCase,
      deleteDependency: useCase,
      getDependencies: vi.fn(),
      getDependents: vi.fn(),
      getDependencyChain: vi.fn(),
      validateDependency: useCase,
    } as never),
    useCase,
  };
}

const validCreateTemplate = {
  name: 'My Task',
  taskType: 'OneTime',
  timeConfig: { timeType: 'AllDay', startDate: null, timePoint: null },
  importance: 'Moderate',
};
const malformedCreateTemplate = { name: '' };

const validUpdateTemplate = { name: 'Updated Name' };
const malformedUpdateTemplate = { name: '' };

const validGenerate = { fromDate: 1_700_000_000_000, toDate: 1_700_000_086_400 };
const malformedGenerate = { fromDate: 'not-a-number', toDate: 1_700_000_086_400 };

const validBindGoal = { goalId: GOAL_ID, keyResultId: KR_ID, goalRecordValue: 1 };
const malformedBindGoal = { goalId: GOAL_ID, keyResultId: KR_ID, goalRecordValue: -1 };

const validComplete = { duration: 30, rating: 5 };
const malformedComplete = { rating: 99 };

const validSkip = { reason: 'Too tired' };
const malformedSkip = { reason: 42 };

const validCreateDep = { predecessorTaskId: TEMPLATE_ID };
const malformedCreateDep = { predecessorTaskId: 'bad' };

const validUpdateDep = { lagDays: 2 };
const malformedUpdateDep = { lagDays: 'not-a-number' };

const validValidateDep = { predecessorTaskId: TEMPLATE_ID, successorTaskId: TEMPLATE_ID };
const malformedValidateDep = { predecessorTaskId: 'bad', successorTaskId: TEMPLATE_ID };

describe('task transport parity (Phase 4)', () => {
  it.each<[string, RowSpec]>([
    [
      'template create',
      {
        schema: CreateTaskTemplateSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validCreateTemplate },
        ipcArgs: validCreateTemplate,
        validInvocation: validCreateTemplate,
        malformedInvocation: malformedCreateTemplate,
        malformedHttpReq: { body: malformedCreateTemplate },
        malformedIpcArgs: malformedCreateTemplate,
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).createTemplate(data as never, ctx),
        assertUseCase: (useCase, expected) => {
          expect(useCase).toHaveBeenCalledTimes(2);
          expect(useCase.mock.calls[0][0]).toMatchObject(expected as Record<string, unknown>);
        },
      },
    ],
    [
      'template update',
      {
        schema: UpdateTaskTemplateInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as { id?: string }).id },
          body: (args as { request?: unknown }).request,
        }),
        httpReq: { params: { id: TEMPLATE_ID }, body: validUpdateTemplate },
        ipcArgs: { id: TEMPLATE_ID, request: validUpdateTemplate },
        validInvocation: { params: { id: TEMPLATE_ID }, body: validUpdateTemplate },
        malformedInvocation: { params: { id: TEMPLATE_ID }, body: malformedUpdateTemplate },
        malformedHttpReq: { params: { id: TEMPLATE_ID }, body: malformedUpdateTemplate },
        malformedIpcArgs: { id: TEMPLATE_ID, request: malformedUpdateTemplate },
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).updateTemplate(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertUseCase: (useCase, expected) => {
          const call = useCase.mock.calls[0];
          expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
          expect(call[2]).toMatchObject((expected as { body: Record<string, unknown> }).body);
        },
      },
    ],
    [
      'template delete',
      {
        schema: TaskTemplateIdCommandInvocationSchema,
        projectHttp: (req) => ({ params: req.params }),
        projectIpc: (args) => ({
          params: { id: (args as { id?: string }).id ?? (args as string) },
        }),
        httpReq: { params: { id: TEMPLATE_ID } },
        ipcArgs: { id: TEMPLATE_ID },
        validInvocation: { params: { id: TEMPLATE_ID } },
        malformedInvocation: { params: { id: 'bad' } },
        malformedHttpReq: { params: { id: 'bad' } },
        malformedIpcArgs: { id: 'bad' },
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).deleteTemplate(
            (data as { params: { id: string } }).params.id,
            ctx,
          ),
        assertUseCase: (useCase, expected) => {
          expect(useCase).toHaveBeenCalledTimes(2);
          expect(useCase.mock.calls[0][0]).toBe((expected as { params: { id: string } }).params.id);
        },
      },
    ],
    [
      'template activate',
      {
        schema: TaskTemplateIdCommandInvocationSchema,
        projectHttp: (req) => ({ params: req.params }),
        projectIpc: (args) => ({
          params: { id: (args as { id?: string }).id ?? (args as string) },
        }),
        httpReq: { params: { id: TEMPLATE_ID } },
        ipcArgs: { id: TEMPLATE_ID },
        validInvocation: { params: { id: TEMPLATE_ID } },
        malformedInvocation: { params: { id: 'bad' } },
        malformedHttpReq: { params: { id: 'bad' } },
        malformedIpcArgs: { id: 'bad' },
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).activateTemplate(
            (data as { params: { id: string } }).params.id,
            ctx,
          ),
        assertUseCase: (useCase, expected) => {
          expect(useCase).toHaveBeenCalledTimes(2);
          expect(useCase.mock.calls[0][0]).toBe((expected as { params: { id: string } }).params.id);
        },
      },
    ],
    [
      'template generate-instances',
      {
        schema: GenerateInstancesInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as { templateId?: string }).templateId },
          body: (args as { request?: unknown }).request,
        }),
        httpReq: { params: { id: TEMPLATE_ID }, body: validGenerate },
        ipcArgs: { templateId: TEMPLATE_ID, request: validGenerate },
        validInvocation: { params: { id: TEMPLATE_ID }, body: validGenerate },
        malformedInvocation: { params: { id: TEMPLATE_ID }, body: malformedGenerate },
        malformedHttpReq: { params: { id: TEMPLATE_ID }, body: malformedGenerate },
        malformedIpcArgs: { templateId: TEMPLATE_ID, request: malformedGenerate },
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).generateInstances(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertUseCase: (useCase, expected) => {
          const call = useCase.mock.calls[0];
          expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
          expect(call[2]).toEqual((expected as { body: unknown }).body);
        },
      },
    ],
    [
      'template bind-goal',
      {
        schema: BindTaskToGoalInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as { templateId?: string }).templateId },
          body: (args as { request?: unknown }).request,
        }),
        httpReq: { params: { id: TEMPLATE_ID }, body: validBindGoal },
        ipcArgs: { templateId: TEMPLATE_ID, request: validBindGoal },
        validInvocation: { params: { id: TEMPLATE_ID }, body: validBindGoal },
        malformedInvocation: { params: { id: TEMPLATE_ID }, body: malformedBindGoal },
        malformedHttpReq: { params: { id: TEMPLATE_ID }, body: malformedBindGoal },
        malformedIpcArgs: { templateId: TEMPLATE_ID, request: malformedBindGoal },
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).bindToGoal(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertUseCase: (useCase, expected) => {
          const call = useCase.mock.calls[0];
          expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
          // TaskGoalBindingSchema applies a default progressTrigger, so the
          // parsed body is a superset of the wire fixture.
          expect(call[2]).toMatchObject((expected as { body: Record<string, unknown> }).body);
        },
      },
    ],
    [
      'template unbind-goal',
      {
        schema: TaskTemplateIdCommandInvocationSchema,
        projectHttp: (req) => ({ params: req.params }),
        projectIpc: (args) => ({ params: { id: (args as { templateId?: string }).templateId } }),
        httpReq: { params: { id: TEMPLATE_ID } },
        ipcArgs: { templateId: TEMPLATE_ID },
        validInvocation: { params: { id: TEMPLATE_ID } },
        malformedInvocation: { params: { id: 'bad' } },
        malformedHttpReq: { params: { id: 'bad' } },
        malformedIpcArgs: { templateId: 'bad' },
        invoke: (controller, data, ctx) =>
          (controller as TaskTemplateController).unbindFromGoal(
            (data as { params: { id: string } }).params.id,
            ctx,
          ),
        assertUseCase: (useCase, expected) => {
          expect(useCase).toHaveBeenCalledTimes(2);
          expect(useCase.mock.calls[0][0]).toBe((expected as { params: { id: string } }).params.id);
        },
      },
    ],
  ])('task %s: HTTP and IPC reach the same use case with equivalent input', async (name, row) => {
    await runRow(row, templateUseCases);
  });

  describe('task instance mutations', () => {
    it.each<[string, RowSpec]>([
      [
        'instance complete',
        {
          schema: CompleteTaskInstanceInvocationSchema,
          projectHttp: (req) => ({ params: req.params, body: req.body }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id ?? (args as string) },
            body: (args as { request?: unknown }).request,
          }),
          httpReq: { params: { id: INSTANCE_ID }, body: validComplete },
          ipcArgs: { id: INSTANCE_ID, request: validComplete },
          validInvocation: { params: { id: INSTANCE_ID }, body: validComplete },
          malformedInvocation: { params: { id: INSTANCE_ID }, body: malformedComplete },
          malformedHttpReq: { params: { id: INSTANCE_ID }, body: malformedComplete },
          malformedIpcArgs: { id: INSTANCE_ID, request: malformedComplete },
          invoke: (controller, data, ctx) =>
            (controller as TaskInstanceController).completeInstance(
              (data as { params: { id: string } }).params.id,
              (data as { body: never }).body,
              ctx,
            ),
          assertUseCase: (useCase, expected) => {
            const call = useCase.mock.calls[0];
            expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
            expect(call[2]).toMatchObject((expected as { body: Record<string, unknown> }).body);
          },
        },
      ],
      [
        'instance skip',
        {
          schema: SkipTaskInstanceInvocationSchema,
          projectHttp: (req) => ({ params: req.params, body: req.body }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id ?? (args as string) },
            body: (args as { request?: unknown }).request,
          }),
          httpReq: { params: { id: INSTANCE_ID }, body: validSkip },
          ipcArgs: { id: INSTANCE_ID, request: validSkip },
          validInvocation: { params: { id: INSTANCE_ID }, body: validSkip },
          malformedInvocation: { params: { id: INSTANCE_ID }, body: malformedSkip },
          malformedHttpReq: { params: { id: INSTANCE_ID }, body: malformedSkip },
          malformedIpcArgs: { id: INSTANCE_ID, request: malformedSkip },
          invoke: (controller, data, ctx) =>
            (controller as TaskInstanceController).skipInstance(
              (data as { params: { id: string } }).params.id,
              (data as { body: never }).body,
              ctx,
            ),
          assertUseCase: (useCase, expected) => {
            const call = useCase.mock.calls[0];
            expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
            expect(call[2]).toMatchObject((expected as { body: Record<string, unknown> }).body);
          },
        },
      ],
      [
        'instance start',
        {
          schema: TaskInstanceIdCommandInvocationSchema,
          projectHttp: (req) => ({ params: req.params }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id ?? (args as string) },
          }),
          httpReq: { params: { id: INSTANCE_ID } },
          ipcArgs: { id: INSTANCE_ID },
          validInvocation: { params: { id: INSTANCE_ID } },
          malformedInvocation: { params: { id: 'bad' } },
          malformedHttpReq: { params: { id: 'bad' } },
          malformedIpcArgs: { id: 'bad' },
          invoke: (controller, data, ctx) =>
            (controller as TaskInstanceController).startInstance(
              (data as { params: { id: string } }).params.id,
              ctx,
            ),
          assertUseCase: (useCase, expected) => {
            expect(useCase).toHaveBeenCalledTimes(2);
            expect(useCase.mock.calls[0][0]).toBe(
              (expected as { params: { id: string } }).params.id,
            );
          },
        },
      ],
      [
        'instance delete',
        {
          schema: TaskInstanceIdCommandInvocationSchema,
          projectHttp: (req) => ({ params: req.params }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id ?? (args as string) },
          }),
          httpReq: { params: { id: INSTANCE_ID } },
          ipcArgs: { id: INSTANCE_ID },
          validInvocation: { params: { id: INSTANCE_ID } },
          malformedInvocation: { params: { id: 'bad' } },
          malformedHttpReq: { params: { id: 'bad' } },
          malformedIpcArgs: { id: 'bad' },
          invoke: (controller, data, ctx) =>
            (controller as TaskInstanceController).deleteInstance(
              (data as { params: { id: string } }).params.id,
              ctx,
            ),
          assertUseCase: (useCase, expected) => {
            expect(useCase).toHaveBeenCalledTimes(2);
            expect(useCase.mock.calls[0][0]).toBe(
              (expected as { params: { id: string } }).params.id,
            );
          },
        },
      ],
      [
        'instance uncomplete',
        {
          schema: TaskInstanceIdCommandInvocationSchema,
          projectHttp: (req) => ({ params: req.params }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id ?? (args as string) },
          }),
          httpReq: { params: { id: INSTANCE_ID } },
          ipcArgs: { id: INSTANCE_ID },
          validInvocation: { params: { id: INSTANCE_ID } },
          malformedInvocation: { params: { id: 'bad' } },
          malformedHttpReq: { params: { id: 'bad' } },
          malformedIpcArgs: { id: 'bad' },
          invoke: (controller, data, ctx) =>
            (controller as TaskInstanceController).uncompleteInstance(
              (data as { params: { id: string } }).params.id,
              ctx,
            ),
          assertUseCase: (useCase, expected) => {
            expect(useCase).toHaveBeenCalledTimes(2);
            expect(useCase.mock.calls[0][0]).toBe(
              (expected as { params: { id: string } }).params.id,
            );
          },
        },
      ],
    ])('task %s: HTTP and IPC reach the same use case with equivalent input', async (name, row) => {
      await runRow(row, instanceUseCases);
    });
  });

  describe('task dependency mutations', () => {
    it.each<[string, RowSpec]>([
      [
        'dependency create',
        {
          schema: CreateTaskDependencyInvocationSchema,
          projectHttp: (req) => ({ params: req.params, body: req.body }),
          projectIpc: (args) => ({
            params: { taskId: (args as { taskId?: string }).taskId },
            body: (args as { request?: unknown }).request,
          }),
          httpReq: { params: { taskId: TEMPLATE_ID }, body: validCreateDep },
          ipcArgs: { taskId: TEMPLATE_ID, request: validCreateDep },
          validInvocation: { params: { taskId: TEMPLATE_ID }, body: validCreateDep },
          malformedInvocation: { params: { taskId: TEMPLATE_ID }, body: malformedCreateDep },
          malformedHttpReq: { params: { taskId: TEMPLATE_ID }, body: malformedCreateDep },
          malformedIpcArgs: { taskId: TEMPLATE_ID, request: malformedCreateDep },
          invoke: (controller, data, ctx) =>
            (controller as TaskDependencyController).createDependency(
              (data as { params: { taskId: string } }).params.taskId,
              (data as { body: never }).body,
              ctx.identityId,
            ),
          assertUseCase: (useCase, expected) => {
            const call = useCase.mock.calls[0];
            expect(call[0]).toMatchObject((expected as { body: Record<string, unknown> }).body);
          },
        },
      ],
      [
        'dependency update',
        {
          schema: UpdateTaskDependencyInvocationSchema,
          projectHttp: (req) => ({ params: req.params, body: req.body }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id },
            body: (args as { request?: unknown }).request,
          }),
          httpReq: { params: { id: DEPENDENCY_ID }, body: validUpdateDep },
          ipcArgs: { id: DEPENDENCY_ID, request: validUpdateDep },
          validInvocation: { params: { id: DEPENDENCY_ID }, body: validUpdateDep },
          malformedInvocation: { params: { id: DEPENDENCY_ID }, body: malformedUpdateDep },
          malformedHttpReq: { params: { id: DEPENDENCY_ID }, body: malformedUpdateDep },
          malformedIpcArgs: { id: DEPENDENCY_ID, request: malformedUpdateDep },
          invoke: (controller, data, ctx) =>
            (controller as TaskDependencyController).updateDependency(
              (data as { params: { id: string } }).params.id,
              (data as { body: never }).body,
              ctx.identityId,
            ),
          assertUseCase: (useCase, expected) => {
            const call = useCase.mock.calls[0];
            expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
            expect(call[2]).toMatchObject((expected as { body: Record<string, unknown> }).body);
          },
        },
      ],
      [
        'dependency delete',
        {
          schema: DeleteTaskDependencyInvocationSchema,
          projectHttp: (req) => ({ params: req.params }),
          projectIpc: (args) => ({
            params: { id: (args as { id?: string }).id ?? (args as string) },
          }),
          httpReq: { params: { id: DEPENDENCY_ID } },
          ipcArgs: { id: DEPENDENCY_ID },
          validInvocation: { params: { id: DEPENDENCY_ID } },
          malformedInvocation: { params: { id: 'bad' } },
          malformedHttpReq: { params: { id: 'bad' } },
          malformedIpcArgs: { id: 'bad' },
          invoke: (controller, data, ctx) =>
            (controller as TaskDependencyController).deleteDependency(
              (data as { params: { id: string } }).params.id,
              ctx.identityId,
            ),
          assertUseCase: (useCase, expected) => {
            expect(useCase).toHaveBeenCalledTimes(2);
            expect(useCase.mock.calls[0][0]).toBe(
              (expected as { params: { id: string } }).params.id,
            );
          },
        },
      ],
      [
        'dependency validate',
        {
          schema: ValidateTaskDependencyInvocationSchema,
          projectHttp: (req) => req.body,
          projectIpc: (args) => args,
          httpReq: { body: validValidateDep },
          ipcArgs: validValidateDep,
          validInvocation: validValidateDep,
          malformedInvocation: malformedValidateDep,
          malformedHttpReq: { body: malformedValidateDep },
          malformedIpcArgs: malformedValidateDep,
          invoke: (controller, data, ctx) =>
            (controller as TaskDependencyController).validateDependency(
              data as never,
              ctx.identityId,
            ),
          assertUseCase: (useCase, expected) => {
            expect(useCase).toHaveBeenCalledTimes(2);
            expect(useCase.mock.calls[0][0]).toBe(
              (expected as { predecessorTaskId: string }).predecessorTaskId,
            );
            expect(useCase.mock.calls[0][1]).toBe(
              (expected as { successorTaskId: string }).successorTaskId,
            );
          },
        },
      ],
    ])('task %s: HTTP and IPC reach the same use case with equivalent input', async (name, row) => {
      await runRow(row, dependencyUseCases);
    });
  });
});
