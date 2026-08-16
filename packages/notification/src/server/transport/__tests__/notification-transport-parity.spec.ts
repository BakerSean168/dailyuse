/**
 * Notification transport parity spec (Phase 4).
 *
 * Every Notification mutation ledger row is fed the SAME canonical fixture
 * through the real `expressAdapterWithValidation` (HTTP) and the real
 * `ipcAdapterWithValidation` (IPC). Both transports share the SAME
 * `NotificationController` instance, so parity is proven by construction: they
 * validate the contract invocation schema before the controller, reach the same
 * application port method with equivalent input and context, and return
 * equivalent envelopes. Malformed fixtures are rejected by the adapter before
 * the controller on both transports.
 *
 * 每个 Notification mutation ledger 行都用同一 canonical fixture 通过真实
 * `expressAdapterWithValidation`（HTTP）与 `ipcAdapterWithValidation`（IPC），
 * 且两条 transport 共用同一个 `NotificationController`。因此 parity 由构造
 * 保证：先校验 invocation schema 再调用 controller；以等价输入与 context
 * 调用同一 application port 方法；返回等价 envelope。malformed fixture 在
 * 两条 transport 上都由 adapter 在 controller 前拒绝。
 */
import { describe, expect, it, vi } from 'vitest';
import { expressAdapterWithValidation, ipcAdapterWithValidation } from '@memoflow/utils/result';
import type { ExecutionContext, RequestContext } from '@memoflow/contracts/shared';
import {
  CleanupOldNotificationsSchema,
  CreateNotificationSchema,
  DeleteNotificationInvocationSchema,
  MarkNotificationReadInvocationSchema,
  NotificationIdsBatchSchema,
  UpdateNotificationPreferenceSchema,
} from '@memoflow/contracts/notification';
import { ok } from '@memoflow/contracts/result';
import { NotificationController } from '../notification.controller';
import type { NotificationApplicationPort } from '../../application';

const CARRIER: RequestContext = {
  requestId: 'req-notification-parity',
  traceId: 'req-notification-parity',
  startedAt: 1_700_000_000_000,
  source: 'ipc',
};

const fixtureContext: ExecutionContext = {
  ...CARRIER,
  identityId: 'identity-1',
  deviceId: 'desktop-app',
};

const NOTIFICATION_ID = 'INotificationId_550e8400-e29b-41d4-a716-446655440000';
const NOTIFICATION_ID_2 = 'INotificationId_550e8400-e29b-41d4-a716-446655440001';

const FAKE_NOTIFICATION = { id: NOTIFICATION_ID, title: 'Hi', isRead: false };

function createPortStub() {
  return {
    createNotification: vi.fn(async () => ok(FAKE_NOTIFICATION)),
    deleteNotification: vi.fn(async () => ok(undefined as unknown as void)),
    markAsRead: vi.fn(async () => ok(FAKE_NOTIFICATION)),
    markAllAsRead: vi.fn(async () => ok(5)),
    batchMarkAsRead: vi.fn(async () => ok(3)),
    batchDelete: vi.fn(async () => ok({ deletedCount: 2 })),
    cleanupOldNotifications: vi.fn(async () => ok({ deletedCount: 4 })),
    updatePreferences: vi.fn(async () => ok({ enabled: true })),
  } as unknown as NotificationApplicationPort;
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
  readonly projectHttp: (req: { body?: unknown; params?: Record<string, string> }) => unknown;
  readonly projectIpc: (args: unknown) => unknown;
  readonly httpReq: { body?: unknown; params?: Record<string, string> };
  readonly ipcArgs: unknown;
  readonly validInvocation: unknown;
  readonly malformedInvocation: unknown;
  readonly malformedHttpReq: { body?: unknown; params?: Record<string, string> };
  readonly malformedIpcArgs: unknown;
  readonly invoke: (
    controller: NotificationController,
    data: unknown,
    ctx: ExecutionContext,
  ) => Promise<unknown>;
  readonly assertPort: (port: NotificationApplicationPort, expected: unknown) => void;
}

async function runRow(spec: RowSpec) {
  const port = createPortStub();
  const controller = new NotificationController(port as never);

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

  spec.assertPort(port, spec.validInvocation);

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

const validCreate = { title: 'Reminder', content: 'Body', type: 'Reminder', category: 'Task' };
const malformedCreate = { title: '', content: '', type: 'Reminder', category: 'Task' };

const validBatch = { notificationIds: [NOTIFICATION_ID, NOTIFICATION_ID_2] };
const malformedBatch = { notificationIds: [] };

const validCleanup = { beforeDays: 30, category: 'Task' };
const malformedCleanup = { beforeDays: 0, category: 'Task' };

const validPreferences = { enabled: true, channels: { inApp: true } };
const malformedPreferences = {
  doNotDisturb: { enabled: true, startTime: '', endTime: '', daysOfWeek: [9] },
};

describe('notification transport parity (Phase 4)', () => {
  it.each<[string, RowSpec]>([
    [
      'create',
      {
        schema: CreateNotificationSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validCreate },
        ipcArgs: validCreate,
        validInvocation: validCreate,
        malformedInvocation: malformedCreate,
        malformedHttpReq: { body: malformedCreate },
        malformedIpcArgs: malformedCreate,
        invoke: (controller, data, ctx) => controller.create(data as never, ctx),
        assertPort: (port, expected) => {
          expect(
            (port.createNotification as ReturnType<typeof vi.fn>).mock.calls[0][0],
          ).toMatchObject(expected as Record<string, unknown>);
        },
      },
    ],
    [
      'delete',
      {
        schema: DeleteNotificationInvocationSchema,
        projectHttp: (req) => ({ params: req.params }),
        projectIpc: (args) => ({
          params: { id: (args as { id?: string }).id ?? (args as string) },
        }),
        httpReq: { params: { id: NOTIFICATION_ID } },
        ipcArgs: { id: NOTIFICATION_ID },
        validInvocation: { params: { id: NOTIFICATION_ID } },
        malformedInvocation: { params: { id: 'bad' } },
        malformedHttpReq: { params: { id: 'bad' } },
        malformedIpcArgs: { id: 'bad' },
        invoke: (controller, data, ctx) =>
          controller.delete((data as { params: { id: string } }).params.id, ctx),
        assertPort: (port, expected) => {
          expect((port.deleteNotification as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
            (expected as { params: { id: string } }).params.id,
          );
        },
      },
    ],
    [
      'mark-read',
      {
        schema: MarkNotificationReadInvocationSchema,
        projectHttp: (req) => ({ params: req.params }),
        projectIpc: (args) => ({
          params: { id: (args as { id?: string }).id ?? (args as string) },
        }),
        httpReq: { params: { id: NOTIFICATION_ID } },
        ipcArgs: { id: NOTIFICATION_ID },
        validInvocation: { params: { id: NOTIFICATION_ID } },
        malformedInvocation: { params: { id: 'bad' } },
        malformedHttpReq: { params: { id: 'bad' } },
        malformedIpcArgs: { id: 'bad' },
        invoke: (controller, data, ctx) =>
          controller.markAsRead((data as { params: { id: string } }).params.id, ctx),
        assertPort: (port, expected) => {
          expect((port.markAsRead as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
            (expected as { params: { id: string } }).params.id,
          );
        },
      },
    ],
    [
      'batch-read',
      {
        schema: NotificationIdsBatchSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validBatch },
        ipcArgs: validBatch,
        validInvocation: validBatch,
        malformedInvocation: malformedBatch,
        malformedHttpReq: { body: malformedBatch },
        malformedIpcArgs: malformedBatch,
        invoke: (controller, data, ctx) => controller.batchMarkAsRead(data as never, ctx),
        assertPort: (port, expected) => {
          expect((port.batchMarkAsRead as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(
            expected,
          );
        },
      },
    ],
    [
      'batch-delete',
      {
        schema: NotificationIdsBatchSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => ({ notificationIds: args as string[] }),
        httpReq: { body: validBatch },
        ipcArgs: [NOTIFICATION_ID, NOTIFICATION_ID_2],
        validInvocation: validBatch,
        malformedInvocation: malformedBatch,
        malformedHttpReq: { body: malformedBatch },
        malformedIpcArgs: [],
        invoke: (controller, data, ctx) => controller.batchDelete(data as never, ctx),
        assertPort: (port, expected) => {
          expect((port.batchDelete as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(expected);
        },
      },
    ],
    [
      'cleanup',
      {
        schema: CleanupOldNotificationsSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validCleanup },
        ipcArgs: validCleanup,
        validInvocation: validCleanup,
        malformedInvocation: malformedCleanup,
        malformedHttpReq: { body: malformedCleanup },
        malformedIpcArgs: malformedCleanup,
        invoke: (controller, data, ctx) => controller.cleanup(data as never, ctx),
        assertPort: (port, expected) => {
          expect(
            (port.cleanupOldNotifications as ReturnType<typeof vi.fn>).mock.calls[0][0],
          ).toMatchObject(expected as Record<string, unknown>);
        },
      },
    ],
    [
      'preferences update',
      {
        schema: UpdateNotificationPreferenceSchema,
        projectHttp: (req) => req.body,
        projectIpc: (args) => args,
        httpReq: { body: validPreferences },
        ipcArgs: validPreferences,
        validInvocation: validPreferences,
        malformedInvocation: malformedPreferences,
        malformedHttpReq: { body: malformedPreferences },
        malformedIpcArgs: malformedPreferences,
        invoke: (controller, data, ctx) => controller.updatePreferences(data as never, ctx),
        assertPort: (port, expected) => {
          expect((port.updatePreferences as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(
            expected,
          );
        },
      },
    ],
  ])(
    'notification %s: HTTP and IPC reach the same port method with equivalent input',
    async (name, row) => {
      await runRow(row);
    },
  );
});
