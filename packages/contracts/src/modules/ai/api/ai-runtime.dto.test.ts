import { describe, expect, it } from 'vitest';
import {
  AssistantRuntimeClientCommandSchema,
  AssistantRuntimeEventSchema,
  AIWorkflowCancelClientRequestSchema,
  AIWorkflowGetClientRequestSchema,
  AIWorkflowListClientRequestSchema,
  AIWorkflowResumeClientRequestSchema,
  AIWorkflowRunViewSchema,
  AIWorkflowStartClientRequestSchema,
} from './ai-runtime.dto';

describe('AI vNext runtime contracts', () => {
  it('rejects client identity injection for assistant commands', () => {
    const result = AssistantRuntimeClientCommandSchema.safeParse({
      type: 'message',
      conversationId: 'conversation-1',
      content: 'hello',
      surface: 'web',
      identityId: 'attacker-controlled',
    });

    expect(result.success).toBe(false);
  });

  it('requires strictly monotonic-capable positive event sequences, rejects unknown event types, and strips credential-shaped extras', () => {
    const valid = AssistantRuntimeEventSchema.safeParse({
      eventId: 'run-1:1',
      runId: 'run-1',
      conversationId: 'conversation-1',
      sequence: 1,
      createdAt: 1,
      type: 'assistant.message.delta',
      data: { content: 'hi' },
    });
    const invalidSequence = AssistantRuntimeEventSchema.safeParse({
      eventId: 'run-1:0',
      runId: 'run-1',
      conversationId: 'conversation-1',
      sequence: 0,
      createdAt: 1,
      type: 'assistant.message.delta',
      data: { content: 'hi' },
    });
    const unknownType = AssistantRuntimeEventSchema.safeParse({
      eventId: 'run-1:2',
      runId: 'run-1',
      conversationId: 'conversation-1',
      sequence: 2,
      createdAt: 1,
      type: 'assistant.private.mastra.event',
      data: {},
    });

    expect(valid.success).toBe(true);
    expect(invalidSequence.success).toBe(false);
    expect(unknownType.success).toBe(false);

    const credentialAttempt = AssistantRuntimeEventSchema.parse({
      eventId: 'run-1:3',
      runId: 'run-1',
      conversationId: 'conversation-1',
      sequence: 3,
      createdAt: 1,
      type: 'assistant.run.started',
      data: { providerId: 'provider-1', apiKey: 'must-not-cross-boundary' },
      apiKey: 'must-not-cross-boundary',
    });
    expect(JSON.stringify(credentialAttempt)).not.toContain('must-not-cross-boundary');
    expect(JSON.stringify(credentialAttempt)).not.toContain('apiKey');
  });

  it('rejects identity injection on workflow resume and keeps resume commands typed', () => {
    expect(
      AIWorkflowResumeClientRequestSchema.safeParse({
        runId: 'workflow-1',
        command: { type: 'approve' },
        identityId: 'attacker-controlled',
      }).success,
    ).toBe(false);

    expect(
      AIWorkflowResumeClientRequestSchema.safeParse({
        runId: 'workflow-1',
        command: { type: 'revise_natural_language', instruction: 'make it smaller' },
      }).success,
    ).toBe(true);
  });

  it('rejects identity injection across every workflow transport request', () => {
    for (const result of [
      AIWorkflowStartClientRequestSchema.safeParse({
        kind: 'goal.create',
        conversationId: 'conversation-1',
        input: {},
        identityId: 'attacker-controlled',
      }),
      AIWorkflowGetClientRequestSchema.safeParse({
        runId: 'workflow-1',
        identityId: 'attacker-controlled',
      }),
      AIWorkflowListClientRequestSchema.safeParse({
        conversationId: 'conversation-1',
        identityId: 'attacker-controlled',
      }),
      AIWorkflowCancelClientRequestSchema.safeParse({
        runId: 'workflow-1',
        identityId: 'attacker-controlled',
      }),
    ]) {
      expect(result.success).toBe(false);
    }
  });

  it('projects only product workflow state and not framework snapshots', () => {
    const parsed = AIWorkflowRunViewSchema.parse({
      runId: 'workflow-1',
      kind: 'goal.create',
      conversationId: 'conversation-1',
      status: 'suspended',
      suspension: {
        type: 'clarification_required',
        questions: ['How much time can you spend each day?'],
      },
      createdAt: 1,
      updatedAt: 2,
    });

    expect(parsed.status).toBe('suspended');
    expect('snapshot' in parsed).toBe(false);
    expect('steps' in parsed).toBe(false);
  });
});
