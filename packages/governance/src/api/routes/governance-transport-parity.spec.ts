/**
 * Governance transport parity spec (Phase 4 pilot).
 *
 * One representative mutation — create rule — is fed the SAME canonical
 * fixture through both the real `expressAdapterWithValidation` (HTTP) and the
 * real `ipcAdapterWithValidation` (IPC). Both transports must:
 * 1. validate the contract schema before the controller runs,
 * 2. reach the same `GovernanceApplicationPort.createRule` spy with
 *    byte-for-byte equivalent parsed input and the same canonical context,
 * 3. produce equivalent success envelopes.
 *
 * This is the reference-module proof that validation is adapter-owned before
 * the Goal/Task/Notification rollout (plan Step 1 gate).
 *
 * 治理 transport parity 测试（Phase 4 pilot）：同一个 canonical fixture 通过
 * 真实 `expressAdapterWithValidation`（HTTP）与真实 `ipcAdapterWithValidation`
 * （IPC）喂给同一个 create rule mutation。两条 transport 必须：在 controller
 * 前完成 contract 校验；以逐字节等价的解析输入与相同 canonical context 调用
 * 同一个 `GovernanceApplicationPort.createRule` spy；返回等价成功 envelope。
 * 这是参考模块在 Goal/Task/Notification 推广前的 adapter 校验证明。
 */
import { describe, expect, it, vi } from 'vitest';
import { expressAdapterWithValidation } from '@memoflow/utils/result';
import { ipcAdapterWithValidation } from '@memoflow/utils/result';
import { ok } from '@memoflow/contracts/result';
import { CreateRuleSchema } from '@memoflow/contracts/governance';
import type { ExecutionContext, RequestContext } from '@memoflow/contracts/shared';
import type { GovernanceApplicationPort } from '../../server/application';
import { GovernanceController } from '../../server/transport/governance.controller';

const CARRIER: RequestContext = {
  requestId: 'req-governance-parity',
  traceId: 'req-governance-parity',
  startedAt: 1_700_000_000_123,
  source: 'ipc',
};

const fixtureContext: ExecutionContext = {
  ...CARRIER,
  identityId: 'identity-1',
  deviceId: 'desktop-app',
};

const validCreateRule = {
  code: 'DDD-100',
  title: 'Parity rule',
  description: 'Valid governance rule for the transport parity test.',
  severity: 'Mandatory',
  tags: ['parity'],
  goodExamples: [{ language: 'TypeScript', content: 'class Example {}' }],
  badExamples: [{ language: 'TypeScript', content: 'const broken = true' }],
};

const malformedCreateRule = {
  code: 'DDD-100',
  title: '', // fails title min length
  description: 'Valid governance rule for the transport parity test.',
  severity: 'Mandatory',
  tags: ['parity'],
  goodExamples: [],
  badExamples: [],
};

function createPortStub(): GovernanceApplicationPort {
  return {
    createRule: vi.fn(async (_input: unknown, _ctx: ExecutionContext) =>
      ok({ id: 'rule-1', code: 'DDD-100' }),
    ),
    updateRule: vi.fn(() => ok(null as never)),
    deleteRule: vi.fn(() => ok(null as never)),
    getRule: vi.fn(() => ok(null as never)),
    listRules: vi.fn(() => ok([] as never)),
    searchRules: vi.fn(() => ok([] as never)),
    getRevisions: vi.fn(() => ok(null as never)),
  } as GovernanceApplicationPort;
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

describe('governance transport parity — create rule (Phase 4 pilot)', () => {
  it('HTTP and IPC reach the same port method with equivalent parsed input and context', async () => {
    const httpPort = createPortStub();
    const httpController = new GovernanceController(httpPort);
    const httpHandler = expressAdapterWithValidation(
      CreateRuleSchema,
      (data, ctx) => httpController.createRule(data, ctx),
      { successStatus: 201, extractContext: () => fixtureContext },
    );
    const httpRes = createRes();
    await httpHandler(
      { body: validCreateRule, user: { identityId: 'identity-1' }, requestContext: fixtureContext },
      httpRes,
    );

    const ipcPort = createPortStub();
    const ipcController = new GovernanceController(ipcPort);
    const ipcHandler = ipcAdapterWithValidation(
      CreateRuleSchema,
      (data, ctx) => ipcController.createRule(data, ctx),
      { extractContext: () => fixtureContext },
    );
    const ipcResult = await ipcHandler({ sender: {}, senderFrame: {} }, validCreateRule);

    // Same canonical input reaches the same application seam method.
    expect(httpPort.createRule).toHaveBeenCalledTimes(1);
    expect(ipcPort.createRule).toHaveBeenCalledTimes(1);
    const [httpInput, httpCtx] = (httpPort.createRule as ReturnType<typeof vi.fn>).mock
      .calls[0] as [unknown, ExecutionContext];
    const [ipcInput, ipcCtx] = (ipcPort.createRule as ReturnType<typeof vi.fn>).mock.calls[0] as [
      unknown,
      ExecutionContext,
    ];
    expect(httpInput).toEqual(ipcInput);
    expect(httpCtx).toEqual(ipcCtx);

    // Equivalent success envelope / payload.
    expect(httpRes.statusCode).toBe(201);
    expect(httpRes.body.ok).toBe(true);
    expect(ipcResult.ok).toBe(true);
    expect(httpRes.body.data).toEqual(ipcResult.data);
  });

  it('malformed input is rejected by the adapter before the controller on both transports', async () => {
    const httpPort = createPortStub();
    const httpController = new GovernanceController(httpPort);
    const httpHandler = expressAdapterWithValidation(
      CreateRuleSchema,
      (data, ctx) => httpController.createRule(data, ctx),
      { extractContext: () => fixtureContext },
    );
    const httpRes = createRes();
    await httpHandler(
      {
        body: malformedCreateRule,
        user: { identityId: 'identity-1' },
        requestContext: fixtureContext,
      },
      httpRes,
    );

    const ipcPort = createPortStub();
    const ipcController = new GovernanceController(ipcPort);
    const ipcHandler = ipcAdapterWithValidation(
      CreateRuleSchema,
      (data, ctx) => ipcController.createRule(data, ctx),
      { extractContext: () => fixtureContext },
    );
    const ipcResult = await ipcHandler({ sender: {}, senderFrame: {} }, malformedCreateRule);

    expect(httpPort.createRule).not.toHaveBeenCalled();
    expect(ipcPort.createRule).not.toHaveBeenCalled();
    expect(httpRes.statusCode).toBe(400);
    expect(httpRes.body.error.code).toBe('VALIDATION_ERROR');
    expect(ipcResult.ok).toBe(false);
    expect(ipcResult.error?.code).toBe('VALIDATION_ERROR');
  });
});
