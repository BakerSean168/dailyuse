/**
 * Assistant Host dispatch contract freeze (plan §4.1).
 * Assistant Host dispatch 契约冻结（计划 §4.1）。
 *
 * These specs pin the runtime schemas and the derived TypeScript shapes as the
 * single cross-boundary source for the server controller, the Web HTTP adapter
 * and the Desktop IPC adapter. Positive and negative cases cover the identity
 * invariant, unknown-discriminator fail-closed behavior and the result shape.
 *
 * 本测试冻结这些 runtime schema 与推导出的 TypeScript 形状，作为 server
 * controller、Web HTTP adapter 与 Desktop IPC adapter 的唯一跨边界来源。
 * 正/负向用例覆盖 identity 不变量、未知 discriminator fail-closed 行为与
 * 结果形状。
 */
import { describe, expect, it } from 'vitest';
import {
  AssistantClientCommandSchema,
  AssistantDispatchResultSchema,
  AssistantEventSchema,
  type AssistantClientCommand,
  type AssistantDispatchHandlers,
  type AssistantDispatchResult,
  type AssistantEvent,
  type AssistantOpenChatCommand,
} from './assistant-dispatch';

function parse(schema: typeof AssistantClientCommandSchema, input: unknown) {
  return schema.safeParse(input);
}

describe('AssistantClientCommandSchema', () => {
  it('accepts a full message command with every optional field', () => {
    const result = parse(AssistantClientCommandSchema, {
      type: 'message',
      conversationId: 'conv-1',
      content: 'hello',
      surface: 'desktop',
      runId: 'run-1',
      executionProfileId: 'pi_readonly',
      providerId: 'provider-x',
      model: 'model-y',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        type: 'message',
        conversationId: 'conv-1',
        content: 'hello',
        surface: 'desktop',
        runId: 'run-1',
        executionProfileId: 'pi_readonly',
        providerId: 'provider-x',
        model: 'model-y',
      });
    }
  });

  it('accepts a minimal message command', () => {
    const result = parse(AssistantClientCommandSchema, {
      type: 'message',
      conversationId: 'conv-1',
      content: 'hello',
      surface: 'web',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.executionProfileId).toBeUndefined();
    }
  });

  it('rejects a message missing required fields', () => {
    expect(parse(AssistantClientCommandSchema, { type: 'message', content: '' }).success).toBe(
      false,
    );
    expect(
      parse(AssistantClientCommandSchema, { type: 'message', conversationId: 'c', content: 'x' })
        .success,
    ).toBe(false);
  });

  it('rejects an unknown discriminator', () => {
    expect(
      parse(AssistantClientCommandSchema, { type: 'teleport', runId: 'r' }).success,
    ).toBe(false);
  });

  it('rejects a message body smuggling identityId as a validation failure', () => {
    const result = parse(AssistantClientCommandSchema, {
      type: 'message',
      conversationId: 'conv-1',
      content: 'hello',
      surface: 'web',
      identityId: 'attacker',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'identityId')).toBe(
        true,
      );
    }
  });

  it('rejects identityId on every proposal/cancel variant, not just message', () => {
    const commands = [
      { type: 'approve_proposal', runId: 'r', proposalId: 'p', revision: 1 },
      { type: 'revise_proposal', runId: 'r', proposalId: 'p', revision: 1 },
      { type: 'reject_proposal', runId: 'r', proposalId: 'p', revision: 1, reason: 'no' },
      { type: 'cancel_run', runId: 'r' },
    ];
    for (const command of commands) {
      const result = parse(AssistantClientCommandSchema, { ...command, identityId: 'attacker' });
      expect(result.success, JSON.stringify(command)).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.join('.') === 'identityId')).toBe(
          true,
        );
      }
    }
  });

  it('accepts proposal lifecycle and cancel commands', () => {
    expect(
      parse(AssistantClientCommandSchema, {
        type: 'approve_proposal',
        runId: 'r',
        proposalId: 'p',
        revision: 2,
      }).success,
    ).toBe(true);
    expect(
      parse(AssistantClientCommandSchema, {
        type: 'revise_proposal',
        runId: 'r',
        proposalId: 'p',
        revision: 1,
        patch: { title: 'Edited' },
      }).success,
    ).toBe(true);
    expect(
      parse(AssistantClientCommandSchema, {
        type: 'reject_proposal',
        runId: 'r',
        proposalId: 'p',
        revision: 3,
        reason: 'rework',
      }).success,
    ).toBe(true);
    expect(parse(AssistantClientCommandSchema, { type: 'cancel_run', runId: 'r' }).success).toBe(
      true,
    );
  });

  it('defaults revise_proposal patch to an empty object', () => {
    const result = parse(AssistantClientCommandSchema, {
      type: 'revise_proposal',
      runId: 'r',
      proposalId: 'p',
      revision: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patch).toEqual({});
    }
  });

  it('rejects a non-positive revision', () => {
    expect(
      parse(AssistantClientCommandSchema, {
        type: 'approve_proposal',
        runId: 'r',
        proposalId: 'p',
        revision: 0,
      }).success,
    ).toBe(false);
  });
});

describe('AssistantEventSchema', () => {
  const validEvents: unknown[] = [
    { type: 'run.started', runId: 'r', engineId: 'engine.direct_turn', profile: 'direct_turn' },
    { type: 'run.started', runId: 'r', engineId: 'engine.pi_readonly', profile: 'pi_readonly', conversationId: 'c' },
    { type: 'message.delta', runId: 'r', content: 'delta' },
    {
      type: 'message.completed',
      runId: 'r',
      status: 'completed',
      content: 'final',
      userMessage: { id: 'u1', content: 'hello' },
      assistantMessage: { id: 'a1', content: 'final' },
    },
    { type: 'message.completed', runId: 'r', status: 'aborted' },
    { type: 'message.completed', runId: 'r', status: 'failed', error: 'boom' },
    { type: 'message.completed', runId: 'r', status: 'waiting_approval' },
    { type: 'proposal.approved', runId: 'r', proposalId: 'p', revision: 1 },
    { type: 'proposal.revised', runId: 'r', proposalId: 'p', revision: 2, kind: 'goal.create', title: 't' },
    { type: 'proposal.rejected', runId: 'r', proposalId: 'p', revision: 3, reason: 'no' },
    { type: 'run.cancelled', runId: 'r' },
    { type: 'error', code: 'E', message: 'm' },
    { type: 'error', code: 'E', message: 'm', runId: 'r' },
  ];

  it('accepts every frozen event shape', () => {
    for (const event of validEvents) {
      expect(AssistantEventSchema.safeParse(event).success, JSON.stringify(event)).toBe(true);
    }
  });

  it('rejects an unknown event type as a protocol failure', () => {
    const result = AssistantEventSchema.safeParse({ type: 'fallback.started', runId: 'r' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed known events', () => {
    expect(AssistantEventSchema.safeParse({ type: 'run.started', runId: 'r' }).success).toBe(false);
    expect(
      AssistantEventSchema.safeParse({ type: 'message.completed', runId: 'r', status: 'paused' })
        .success,
    ).toBe(false);
    expect(
      AssistantEventSchema.safeParse({ type: 'message.delta', runId: 'r' }).success,
    ).toBe(false);
  });
});

describe('AssistantDispatchResultSchema', () => {
  it('accepts a nonnegative integer eventCount', () => {
    expect(AssistantDispatchResultSchema.safeParse({ eventCount: 0 }).success).toBe(true);
    expect(AssistantDispatchResultSchema.safeParse({ eventCount: 5 }).success).toBe(true);
  });

  it('rejects negative, fractional or missing eventCount', () => {
    expect(AssistantDispatchResultSchema.safeParse({ eventCount: -1 }).success).toBe(false);
    expect(AssistantDispatchResultSchema.safeParse({ eventCount: 1.5 }).success).toBe(false);
    expect(AssistantDispatchResultSchema.safeParse({}).success).toBe(false);
  });
});

describe('derived named types', () => {
  it('derives AssistantClientCommand from the schema only', () => {
    const message: AssistantClientCommand = {
      type: 'message',
      conversationId: 'c',
      content: 'x',
      surface: 'web',
    };
    expect(message.type).toBe('message');
  });

  it('derives AssistantOpenChatCommand as the message variant', () => {
    const openChat: AssistantOpenChatCommand = {
      type: 'message',
      conversationId: 'c',
      content: 'x',
      surface: 'desktop',
    };
    expect(openChat.conversationId).toBe('c');
  });

  it('derives AssistantEvent as a discriminated union', () => {
    const event: AssistantEvent = { type: 'run.cancelled', runId: 'r' };
    expect(event.type).toBe('run.cancelled');
  });

  it('exposes the AssistantDispatchHandlers shape', () => {
    const handlers: AssistantDispatchHandlers = {
      onEvent: (event) => event,
      onDone: (result) => result.eventCount,
    };
    expect(typeof handlers.onEvent).toBe('function');
    expect(typeof handlers.onDone).toBe('function');
  });

  it('exposes AssistantDispatchResult with eventCount', () => {
    const result: AssistantDispatchResult = { eventCount: 1 };
    expect(result.eventCount).toBeGreaterThanOrEqual(0);
  });
});
