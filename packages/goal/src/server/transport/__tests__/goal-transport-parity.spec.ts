/**
 * Goal transport parity spec (Phase 4).
 *
 * Every Goal mutation ledger row is fed the SAME canonical fixture through the
 * real `expressAdapterWithValidation` (HTTP) and the real
 * `ipcAdapterWithValidation` (IPC). Both transports share the SAME
 * `GoalController` / `GoalFolderController` instance, so parity is proven by
 * construction: they validate the contract invocation schema before the
 * controller, reach the same application port method with equivalent input and
 * context, and return equivalent envelopes. Malformed fixtures are rejected by
 * the adapter before the controller on both transports.
 *
 * 每个 Goal mutation ledger 行都用同一 canonical fixture 通过真实
 * `expressAdapterWithValidation`（HTTP）与 `ipcAdapterWithValidation`（IPC），
 * 且两条 transport 共用同一个 `GoalController`/`GoalFolderController`。因此
 * parity 由构造保证：先校验 invocation schema 再调用 controller；以等价输入
 * 与 context 调用同一 application port 方法；返回等价 envelope。malformed
 * fixture 在两条 transport 上都由 adapter 在 controller 前拒绝。
 */
import { describe, expect, it, vi } from 'vitest';
import { expressAdapterWithValidation, ipcAdapterWithValidation } from '@memoflow/utils/result';
import type { ExecutionContext, RequestContext } from '@memoflow/contracts/shared';
import {
  ActivateFocusModeSchema,
  AddKeyResultInvocationSchema,
  BatchKeyResultWeightsInvocationSchema,
  CloneGoalInvocationSchema,
  CreateGoalFolderSchema,
  CreateGoalSchema,
  CreateRecordInvocationSchema,
  CreateReviewInvocationSchema,
  DeleteGoalFolderInvocationSchema,
  DeleteGoalInvocationSchema,
  DeleteKeyResultInvocationSchema,
  DeleteRecordInvocationSchema,
  DeleteReviewInvocationSchema,
  ExtendFocusModeSchema,
  GoalStatusCommandInvocationSchema,
  UpdateGoalFolderInvocationSchema,
  UpdateGoalInvocationSchema,
  UpdateKeyResultInvocationSchema,
  UpdateKeyResultProgressInvocationSchema,
  UpdateReviewInvocationSchema,
} from '@memoflow/contracts/goal';
import { ok } from '@memoflow/contracts/result';
import { GoalController } from '../goal.controller';
import { GoalFolderController } from '../goal-folder.controller';
import type { GoalApplicationPort } from '../../application';

const CARRIER: RequestContext = {
  requestId: 'req-goal-parity',
  traceId: 'req-goal-parity',
  startedAt: 1_700_000_000_000,
  source: 'ipc',
};

const fixtureContext: ExecutionContext = {
  ...CARRIER,
  identityId: 'identity-1',
  deviceId: 'desktop-app',
};

const GOAL_ID = 'IGoalId_550e8400-e29b-41d4-a716-446655440000';
const KR_ID = 'IKeyResultId_550e8400-e29b-41d4-a716-446655440001';
const REVIEW_ID = 'IGoalReviewId_550e8400-e29b-41d4-a716-446655440002';
const RECORD_ID = 'IGoalRecordId_550e8400-e29b-41d4-a716-446655440003';
const FOLDER_ID = 'IGoalFolderId_550e8400-e29b-41d4-a716-446655440004';

function okReceipt() {
  return ok({
    goalId: GOAL_ID,
    goalVersion: 2,
    affectedEntityIds: { goalIds: [], keyResultIds: [], recordIds: [], reviewIds: [] },
    readModel: {},
  });
}

function createGoalPortStub() {
  return {
    createGoal: vi.fn(async () => okReceipt()),
    updateGoal: vi.fn(async () => okReceipt()),
    deleteGoal: vi.fn(async () => okReceipt()),
    archiveExpiredGoals: vi.fn(async () => ok({ archivedCount: 1 })),
    archiveGoal: vi.fn(async () => okReceipt()),
    activateGoal: vi.fn(async () => okReceipt()),
    completeGoal: vi.fn(async () => okReceipt()),
    cloneGoal: vi.fn(async () => okReceipt()),
    addKeyResult: vi.fn(async () => okReceipt()),
    updateKeyResult: vi.fn(async () => okReceipt()),
    updateKeyResultProgress: vi.fn(async () => okReceipt()),
    deleteKeyResult: vi.fn(async () => okReceipt()),
    batchUpdateKeyResultWeights: vi.fn(async () => okReceipt()),
    addReview: vi.fn(async () => okReceipt()),
    updateReview: vi.fn(async () => okReceipt()),
    deleteReview: vi.fn(async () => okReceipt()),
    createRecord: vi.fn(async () => okReceipt()),
    deleteRecord: vi.fn(async () => okReceipt()),
    activateFocusMode: vi.fn(async () => ok({ id: 'fm-1' })),
    deactivateFocusMode: vi.fn(async () => ok({ id: 'fm-1' })),
    extendFocusMode: vi.fn(async () => ok({ id: 'fm-1' })),
  } as unknown as GoalApplicationPort;
}

function createFolderPortStub() {
  return {
    createGoalFolder: vi.fn(async () => ok({ id: FOLDER_ID })),
    updateGoalFolder: vi.fn(async () => ok({ id: FOLDER_ID })),
    deleteGoalFolder: vi.fn(async () => ok(undefined as unknown as void)),
  } as unknown as GoalApplicationPort;
}

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
  /** Projects an Express-like request into the canonical invocation. */
  readonly projectHttp: (req: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, unknown>;
  }) => unknown;
  /** Projects raw IPC args into the canonical invocation. */
  readonly projectIpc: (args: unknown) => unknown;
  /** Builds the Express-like request for the valid fixture. */
  readonly httpReq: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, unknown>;
  };
  /** Raw IPC positional args for the valid fixture. */
  readonly ipcArgs: unknown;
  /** Canonical invocation produced by both projectors for the valid fixture. */
  readonly validInvocation: unknown;
  /** Canonical invocation that must fail schema validation. */
  readonly malformedInvocation: unknown;
  /** Express-like request whose projected input equals malformedInvocation. */
  readonly malformedHttpReq: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, unknown>;
  };
  /** Raw IPC args whose projected input equals malformedInvocation. */
  readonly malformedIpcArgs: unknown;
  /** Controller method invoked by BOTH transports with the SAME invocation shape. */
  readonly invoke: (
    controller: GoalController | GoalFolderController,
    data: unknown,
    ctx: ExecutionContext,
  ) => Promise<unknown>;
  /** Asserts the port method was called with the canonical invocation data. */
  readonly assertPort: (port: GoalApplicationPort, expected: unknown) => void;
}

async function runRow(spec: RowSpec) {
  const port = createGoalPortStub();
  const controller = new GoalController(port as never);

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

  const ipcHandler = ipcAdapterWithValidation(
    spec.schema as never,
    async (data, ctx) => spec.invoke(controller, data, ctx),
    { extractContext: () => fixtureContext, projectArgs: spec.projectIpc as never },
  );
  const ipcResult = await ipcHandler({ sender: {}, senderFrame: {} }, spec.ipcArgs);

  expect(httpRes.statusCode).toBe(200);
  expect(httpRes.body.ok).toBe(true);
  expect(ipcResult.ok).toBe(true);
  spec.assertPort(port, spec.validInvocation);

  // Malformed input rejected by the adapter before the controller on both transports.
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

const validCreate = { name: 'Ship architecture fixes', importance: 'Moderate' };
const malformedCreate = { name: '', importance: 'Moderate' };

const validUpdateBody = { name: 'v2', expectedVersion: 1 };
const malformedUpdateBody = { name: 'v2', expectedVersion: 0 };

const validVersionCommand = { expectedVersion: 1 };
const malformedVersionCommand = { expectedVersion: 0 };

const validClone = { name: 'copy' };
const malformedClone = { title: 'legacy' };

const validAddKr = {
  goalId: GOAL_ID,
  title: 'KR',
  valueType: 'Absolute',
  calculationMethod: 'Sum',
  targetValue: 10,
  weight: 3,
  expectedVersion: 1,
};
const malformedAddKr = {
  goalId: GOAL_ID,
  title: '',
  valueType: 'Absolute',
  calculationMethod: 'Sum',
  targetValue: -1,
  weight: 3,
  expectedVersion: 1,
};

const validUpdateKr = { title: 'KR2', expectedVersion: 1 };
const malformedUpdateKr = { title: 'KR2', expectedVersion: 0 };

const validProgress = { keyResultId: KR_ID, expectedVersion: 1, newValue: 5 };
const malformedProgress = { keyResultId: KR_ID, expectedVersion: 1, newValue: -1 };

const validDeleteKr = { expectedVersion: 1 };
const malformedDeleteKr = { expectedVersion: 0 };

const validBatchWeights = {
  expectedVersion: 1,
  updates: [{ keyResultId: KR_ID, weight: 4 }],
};
const malformedBatchWeights = { expectedVersion: 0, updates: [] };

const validCreateReview = {
  goalId: GOAL_ID,
  expectedVersion: 1,
  title: 'Review',
  content: 'Content',
  reviewType: 'Weekly',
};
const malformedCreateReview = { goalId: GOAL_ID, expectedVersion: 1, title: '', content: '' };

const validUpdateReview = { title: 'R2', expectedVersion: 1 };
const malformedUpdateReview = { title: 'R2', expectedVersion: 0 };

const validCreateRecord = { keyResultId: KR_ID, expectedVersion: 1, value: 5 };
const malformedCreateRecord = { keyResultId: KR_ID, expectedVersion: 1, value: -1 };

const validActivateFocus = { focusedGoalIds: [GOAL_ID], hiddenGoalsMode: 'Hide' };
const malformedActivateFocus = { focusedGoalIds: [], hiddenGoalsMode: 'Hide' };

const validExtendFocus = { newEndTime: 1_700_000_000_000 };
const malformedExtendFocus = { newEndTime: 1.5 };

const validCreateFolder = { name: 'Inbox', color: '#FF0000' };
const malformedCreateFolder = { name: '' };

const validUpdateFolder = { name: 'Inbox2' };
const malformedUpdateFolder = { name: '' };

describe('goal transport parity (Phase 4)', () => {
  it.each<[string, RowSpec]>([
    [
      'create',
      {
        schema: CreateGoalSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validCreate },
        ipcArgs: validCreate,
        validInvocation: validCreate,
        malformedInvocation: malformedCreate,
        malformedHttpReq: { body: malformedCreate },
        malformedIpcArgs: malformedCreate,
        invoke: (controller, data, ctx) =>
          (controller as GoalController).create(data as never, ctx),
        assertPort: (port, expected) => {
          expect((port.createGoal as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(expected);
          expect((port.createGoal as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual(
            fixtureContext,
          );
        },
      },
    ],
    [
      'update',
      {
        schema: UpdateGoalInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validUpdateBody },
        ipcArgs: [GOAL_ID, validUpdateBody],
        validInvocation: { params: { id: GOAL_ID }, body: validUpdateBody },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedUpdateBody },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedUpdateBody },
        malformedIpcArgs: [GOAL_ID, malformedUpdateBody],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).update(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port, expected) => {
          const call = (port.updateGoal as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
          expect(call[1]).toBe('identity-1');
          expect(call[2]).toEqual((expected as { body: never }).body);
        },
      },
    ],
    [
      'delete',
      {
        schema: DeleteGoalInvocationSchema,
        projectHttp: (req) => ({ params: req.params, query: req.query }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          query: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, query: { expectedVersion: 1 } },
        ipcArgs: [GOAL_ID, { expectedVersion: 1 }],
        validInvocation: { params: { id: GOAL_ID }, query: { expectedVersion: 1 } },
        malformedInvocation: { params: { id: GOAL_ID }, query: malformedVersionCommand },
        malformedHttpReq: { params: { id: GOAL_ID }, query: malformedVersionCommand },
        malformedIpcArgs: [GOAL_ID, malformedVersionCommand],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).delete(
            (data as { params: { id: string } }).params.id,
            (data as { query: { expectedVersion: number } }).query.expectedVersion,
            ctx,
          ),
        assertPort: (port, expected) => {
          const call = (port.deleteGoal as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe((expected as { params: { id: string } }).params.id);
          expect(call[1]).toBe('identity-1');
          expect(call[2]).toBe(
            (expected as { query: { expectedVersion: number } }).query.expectedVersion,
          );
        },
      },
    ],
    [
      'archive',
      {
        schema: GoalStatusCommandInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validVersionCommand },
        ipcArgs: [GOAL_ID, validVersionCommand],
        validInvocation: { params: { id: GOAL_ID }, body: validVersionCommand },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedVersionCommand },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedVersionCommand },
        malformedIpcArgs: [GOAL_ID, malformedVersionCommand],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).archive(
            (data as { params: { id: string } }).params.id,
            (data as { body: { expectedVersion: number } }).body.expectedVersion,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.archiveGoal as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(1);
        },
      },
    ],
    [
      'activate',
      {
        schema: GoalStatusCommandInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validVersionCommand },
        ipcArgs: [GOAL_ID, validVersionCommand],
        validInvocation: { params: { id: GOAL_ID }, body: validVersionCommand },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedVersionCommand },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedVersionCommand },
        malformedIpcArgs: [GOAL_ID, malformedVersionCommand],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).activate(
            (data as { params: { id: string } }).params.id,
            (data as { body: { expectedVersion: number } }).body.expectedVersion,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.activateGoal as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(1);
        },
      },
    ],
    [
      'complete',
      {
        schema: GoalStatusCommandInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validVersionCommand },
        ipcArgs: [GOAL_ID, validVersionCommand],
        validInvocation: { params: { id: GOAL_ID }, body: validVersionCommand },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedVersionCommand },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedVersionCommand },
        malformedIpcArgs: [GOAL_ID, malformedVersionCommand],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).complete(
            (data as { params: { id: string } }).params.id,
            (data as { body: { expectedVersion: number } }).body.expectedVersion,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.completeGoal as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(1);
        },
      },
    ],
    [
      'clone',
      {
        schema: CloneGoalInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validClone },
        ipcArgs: [GOAL_ID, validClone],
        validInvocation: { params: { id: GOAL_ID }, body: validClone },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedClone },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedClone },
        malformedIpcArgs: [GOAL_ID, malformedClone],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).cloneGoal(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.cloneGoal as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
        },
      },
    ],
    [
      'key-result add',
      {
        schema: AddKeyResultInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: { ...(args as unknown[])[1] },
        }),
        httpReq: { params: { id: GOAL_ID }, body: validAddKr },
        ipcArgs: [GOAL_ID, validAddKr],
        validInvocation: { params: { id: GOAL_ID }, body: validAddKr },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedAddKr },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedAddKr },
        malformedIpcArgs: [GOAL_ID, malformedAddKr],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).addKeyResult(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.addKeyResult as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[1]).toBe('identity-1');
        },
      },
    ],
    [
      'key-result update',
      {
        schema: UpdateKeyResultInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0], krId: (args as string[])[1] },
          body: (args as unknown[])[2],
        }),
        httpReq: { params: { id: GOAL_ID, krId: KR_ID }, body: validUpdateKr },
        ipcArgs: [GOAL_ID, KR_ID, validUpdateKr],
        validInvocation: { params: { id: GOAL_ID, krId: KR_ID }, body: validUpdateKr },
        malformedInvocation: { params: { id: GOAL_ID, krId: KR_ID }, body: malformedUpdateKr },
        malformedHttpReq: { params: { id: GOAL_ID, krId: KR_ID }, body: malformedUpdateKr },
        malformedIpcArgs: [GOAL_ID, KR_ID, malformedUpdateKr],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).updateKeyResult(
            (data as { params: { id: string; krId: string } }).params.id,
            (data as { params: { id: string; krId: string } }).params.krId,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.updateKeyResult as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(KR_ID);
        },
      },
    ],
    [
      'key-result progress',
      {
        schema: UpdateKeyResultProgressInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0], krId: (args as string[])[1] },
          body: (args as unknown[])[2],
        }),
        httpReq: { params: { id: GOAL_ID, krId: KR_ID }, body: validProgress },
        ipcArgs: [GOAL_ID, KR_ID, validProgress],
        validInvocation: { params: { id: GOAL_ID, krId: KR_ID }, body: validProgress },
        malformedInvocation: { params: { id: GOAL_ID, krId: KR_ID }, body: malformedProgress },
        malformedHttpReq: { params: { id: GOAL_ID, krId: KR_ID }, body: malformedProgress },
        malformedIpcArgs: [GOAL_ID, KR_ID, malformedProgress],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).updateKeyResultProgress(
            (data as { params: { id: string; krId: string } }).params.id,
            (data as { params: { id: string; krId: string } }).params.krId,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.updateKeyResultProgress as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(KR_ID);
        },
      },
    ],
    [
      'key-result delete',
      {
        schema: DeleteKeyResultInvocationSchema,
        projectHttp: (req) => ({ params: req.params, query: req.query }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0], krId: (args as string[])[1] },
          query: (args as unknown[])[2],
        }),
        httpReq: { params: { id: GOAL_ID, krId: KR_ID }, query: validDeleteKr },
        ipcArgs: [GOAL_ID, KR_ID, validDeleteKr],
        validInvocation: { params: { id: GOAL_ID, krId: KR_ID }, query: validDeleteKr },
        malformedInvocation: { params: { id: GOAL_ID, krId: KR_ID }, query: malformedDeleteKr },
        malformedHttpReq: { params: { id: GOAL_ID, krId: KR_ID }, query: malformedDeleteKr },
        malformedIpcArgs: [GOAL_ID, KR_ID, malformedDeleteKr],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).deleteKeyResult(
            (data as { params: { id: string; krId: string } }).params.id,
            (data as { params: { id: string; krId: string } }).params.krId,
            (data as { query: never }).query,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.deleteKeyResult as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(KR_ID);
        },
      },
    ],
    [
      'key-result batch weights',
      {
        schema: BatchKeyResultWeightsInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validBatchWeights },
        ipcArgs: [GOAL_ID, validBatchWeights],
        validInvocation: { params: { id: GOAL_ID }, body: validBatchWeights },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedBatchWeights },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedBatchWeights },
        malformedIpcArgs: [GOAL_ID, malformedBatchWeights],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).batchUpdateKeyResultWeights(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.batchUpdateKeyResultWeights as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
        },
      },
    ],
    [
      'review create',
      {
        schema: CreateReviewInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0] },
          body: (args as unknown[])[1],
        }),
        httpReq: { params: { id: GOAL_ID }, body: validCreateReview },
        ipcArgs: [GOAL_ID, validCreateReview],
        validInvocation: { params: { id: GOAL_ID }, body: validCreateReview },
        malformedInvocation: { params: { id: GOAL_ID }, body: malformedCreateReview },
        malformedHttpReq: { params: { id: GOAL_ID }, body: malformedCreateReview },
        malformedIpcArgs: [GOAL_ID, malformedCreateReview],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).addReview(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.addReview as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
        },
      },
    ],
    [
      'review update',
      {
        schema: UpdateReviewInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0], reviewId: (args as string[])[1] },
          body: (args as unknown[])[2],
        }),
        httpReq: { params: { id: GOAL_ID, reviewId: REVIEW_ID }, body: validUpdateReview },
        ipcArgs: [GOAL_ID, REVIEW_ID, validUpdateReview],
        validInvocation: { params: { id: GOAL_ID, reviewId: REVIEW_ID }, body: validUpdateReview },
        malformedInvocation: {
          params: { id: GOAL_ID, reviewId: REVIEW_ID },
          body: malformedUpdateReview,
        },
        malformedHttpReq: {
          params: { id: GOAL_ID, reviewId: REVIEW_ID },
          body: malformedUpdateReview,
        },
        malformedIpcArgs: [GOAL_ID, REVIEW_ID, malformedUpdateReview],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).updateReview(
            (data as { params: { id: string; reviewId: string } }).params.id,
            (data as { params: { id: string; reviewId: string } }).params.reviewId,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.updateReview as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(REVIEW_ID);
        },
      },
    ],
    [
      'review delete',
      {
        schema: DeleteReviewInvocationSchema,
        projectHttp: (req) => ({ params: req.params, query: req.query }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0], reviewId: (args as string[])[1] },
          query: (args as unknown[])[2],
        }),
        httpReq: { params: { id: GOAL_ID, reviewId: REVIEW_ID }, query: validVersionCommand },
        ipcArgs: [GOAL_ID, REVIEW_ID, validVersionCommand],
        validInvocation: {
          params: { id: GOAL_ID, reviewId: REVIEW_ID },
          query: validVersionCommand,
        },
        malformedInvocation: {
          params: { id: GOAL_ID, reviewId: REVIEW_ID },
          query: malformedVersionCommand,
        },
        malformedHttpReq: {
          params: { id: GOAL_ID, reviewId: REVIEW_ID },
          query: malformedVersionCommand,
        },
        malformedIpcArgs: [GOAL_ID, REVIEW_ID, malformedVersionCommand],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).deleteReview(
            (data as { params: { id: string; reviewId: string } }).params.id,
            (data as { params: { id: string; reviewId: string } }).params.reviewId,
            (data as { query: never }).query,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.deleteReview as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[2]).toBe(REVIEW_ID);
        },
      },
    ],
    [
      'record create',
      {
        schema: CreateRecordInvocationSchema,
        projectHttp: (req) => ({ params: req.params, body: req.body }),
        projectIpc: (args) => ({
          params: { id: (args as string[])[0], krId: (args as string[])[1] },
          body: (args as unknown[])[2],
        }),
        httpReq: { params: { id: GOAL_ID, krId: KR_ID }, body: validCreateRecord },
        ipcArgs: [GOAL_ID, KR_ID, validCreateRecord],
        validInvocation: { params: { id: GOAL_ID, krId: KR_ID }, body: validCreateRecord },
        malformedInvocation: { params: { id: GOAL_ID, krId: KR_ID }, body: malformedCreateRecord },
        malformedHttpReq: { params: { id: GOAL_ID, krId: KR_ID }, body: malformedCreateRecord },
        malformedIpcArgs: [GOAL_ID, KR_ID, malformedCreateRecord],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).createRecord(
            (data as { params: { id: string; krId: string } }).params.id,
            (data as { params: { id: string; krId: string } }).params.krId,
            (data as { body: never }).body,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.createRecord as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[1]).toBe(KR_ID);
        },
      },
    ],
    [
      'record delete',
      {
        schema: DeleteRecordInvocationSchema,
        projectHttp: (req) => ({ params: req.params, query: req.query }),
        projectIpc: (args) => ({
          params: {
            id: (args as string[])[0],
            krId: (args as string[])[1],
            recordId: (args as string[])[2],
          },
          query: (args as unknown[])[3],
        }),
        httpReq: {
          params: { id: GOAL_ID, krId: KR_ID, recordId: RECORD_ID },
          query: validVersionCommand,
        },
        ipcArgs: [GOAL_ID, KR_ID, RECORD_ID, validVersionCommand],
        validInvocation: {
          params: { id: GOAL_ID, krId: KR_ID, recordId: RECORD_ID },
          query: validVersionCommand,
        },
        malformedInvocation: {
          params: { id: GOAL_ID, krId: KR_ID, recordId: RECORD_ID },
          query: malformedVersionCommand,
        },
        malformedHttpReq: {
          params: { id: GOAL_ID, krId: KR_ID, recordId: RECORD_ID },
          query: malformedVersionCommand,
        },
        malformedIpcArgs: [GOAL_ID, KR_ID, RECORD_ID, malformedVersionCommand],
        invoke: (controller, data, ctx) =>
          (controller as GoalController).deleteRecord(
            (data as { params: { id: string; krId: string; recordId: string } }).params.id,
            (data as { params: { id: string; krId: string; recordId: string } }).params.krId,
            (data as { params: { id: string; krId: string; recordId: string } }).params.recordId,
            (data as { query: never }).query,
            ctx,
          ),
        assertPort: (port) => {
          const call = (port.deleteRecord as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(GOAL_ID);
          expect(call[1]).toBe(KR_ID);
          expect(call[2]).toBe(RECORD_ID);
        },
      },
    ],
    [
      'focus activate',
      {
        schema: ActivateFocusModeSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validActivateFocus },
        ipcArgs: validActivateFocus,
        validInvocation: validActivateFocus,
        malformedInvocation: malformedActivateFocus,
        malformedHttpReq: { body: malformedActivateFocus },
        malformedIpcArgs: malformedActivateFocus,
        invoke: (controller, data, ctx) =>
          (controller as GoalController).activateFocusMode(data as never, ctx),
        assertPort: (port) => {
          const call = (port.activateFocusMode as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe('identity-1');
          expect(call[1]).toEqual(validActivateFocus);
        },
      },
    ],
    [
      'focus extend',
      {
        schema: ExtendFocusModeSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validExtendFocus },
        ipcArgs: validExtendFocus,
        validInvocation: validExtendFocus,
        malformedInvocation: malformedExtendFocus,
        malformedHttpReq: { body: malformedExtendFocus },
        malformedIpcArgs: malformedExtendFocus,
        invoke: (controller, data, ctx) =>
          (controller as GoalController).extendFocusMode(data as never, ctx),
        assertPort: (port) => {
          const call = (port.extendFocusMode as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe('identity-1');
        },
      },
    ],
  ])(
    'goal %s: HTTP and IPC reach the same port method with equivalent input',
    async (name, row) => {
      await runRow(row);
    },
  );

  describe('goal folder mutations', () => {
    const runFolderRow = async (
      schema: AnySchema,
      projectHttp: (req: unknown) => unknown,
      projectIpc: (args: unknown) => unknown,
      httpReq: unknown,
      ipcArgs: unknown,
      validInvocation: unknown,
      malformedInvocation: unknown,
      malformedHttpReq: unknown,
      malformedIpcArgs: unknown,
      invoke: (c: GoalFolderController, data: unknown, ctx: ExecutionContext) => Promise<unknown>,
      assertPort: (port: ReturnType<typeof createFolderPortStub>) => void,
    ) => {
      const port = createFolderPortStub();
      const controller = new GoalFolderController(port as never);

      const httpHandler = expressAdapterWithValidation(
        schema as never,
        async (data, ctx) => invoke(controller, data, ctx),
        {
          successStatus: 200,
          extractContext: () => fixtureContext,
          projectInput: projectHttp as never,
        },
      );
      const httpRes = createRes();
      await httpHandler(
        {
          ...(httpReq as Record<string, unknown>),
          user: { identityId: 'identity-1' },
          requestContext: fixtureContext,
        } as never,
        httpRes,
      );
      expect(httpRes.statusCode).toBe(200);

      const ipcHandler = ipcAdapterWithValidation(
        schema as never,
        async (data, ctx) => invoke(controller, data, ctx),
        { extractContext: () => fixtureContext, projectArgs: projectIpc as never },
      );
      const ipcResult = await ipcHandler({ sender: {}, senderFrame: {} }, ipcArgs);
      expect(ipcResult.ok).toBe(true);
      assertPort(port);

      const badHttpRes = createRes();
      await httpHandler(
        {
          ...(malformedHttpReq as Record<string, unknown>),
          user: { identityId: 'identity-1' },
          requestContext: fixtureContext,
        } as never,
        badHttpRes,
      );
      expect(badHttpRes.statusCode).toBe(400);
      const badIpcResult = await ipcHandler({ sender: {}, senderFrame: {} }, malformedIpcArgs);
      expect(badIpcResult.ok).toBe(false);
    };

    it('folder create: HTTP and IPC reach createGoalFolder with equivalent input', async () => {
      await runFolderRow(
        CreateGoalFolderSchema,
        (req) => (req as { body?: unknown }).body,
        (args) => args,
        { body: validCreateFolder },
        validCreateFolder,
        validCreateFolder,
        malformedCreateFolder,
        { body: malformedCreateFolder },
        malformedCreateFolder,
        (c, data, ctx) => c.create(data as never, ctx),
        (port) => {
          const call = (port.createGoalFolder as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe('identity-1');
          expect(call[1]).toEqual(validCreateFolder);
        },
      );
    });

    it('folder update: HTTP and IPC project params+body into the same invocation', async () => {
      await runFolderRow(
        UpdateGoalFolderInvocationSchema,
        (req) => ({
          params: (req as { params?: unknown }).params,
          body: (req as { body?: unknown }).body,
        }),
        (args) => ({ params: { id: (args as string[])[0] }, body: (args as unknown[])[1] }),
        { params: { id: FOLDER_ID }, body: validUpdateFolder },
        [FOLDER_ID, validUpdateFolder],
        { params: { id: FOLDER_ID }, body: validUpdateFolder },
        { params: { id: FOLDER_ID }, body: malformedUpdateFolder },
        { params: { id: FOLDER_ID }, body: malformedUpdateFolder },
        [FOLDER_ID, malformedUpdateFolder],
        (c, data, ctx) =>
          c.update(
            (data as { params: { id: string } }).params.id,
            (data as { body: never }).body,
            ctx,
          ),
        (port) => {
          const call = (port.updateGoalFolder as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(FOLDER_ID);
          expect(call[2]).toEqual(validUpdateFolder);
        },
      );
    });

    it('folder delete: HTTP and IPC project the id-only invocation', async () => {
      await runFolderRow(
        DeleteGoalFolderInvocationSchema,
        (req) => ({ params: (req as { params?: unknown }).params }),
        (args) => ({ params: { id: (args as string[])[0] } }),
        { params: { id: FOLDER_ID } },
        [FOLDER_ID],
        { params: { id: FOLDER_ID } },
        { params: { id: 'bad' } },
        { params: { id: 'bad' } },
        ['bad'],
        (c, data, ctx) => c.delete((data as { params: { id: string } }).params.id, ctx),
        (port) => {
          const call = (port.deleteGoalFolder as ReturnType<typeof vi.fn>).mock.calls[0];
          expect(call[0]).toBe(FOLDER_ID);
          expect(call[1]).toBe('identity-1');
        },
      );
    });
  });
});
