import { describe, expect, it } from 'vitest';
import { createAssistantExecutionLog, projectAssistantUsage } from './assistant-observability';

const model = {
  providerId: 'provider-1',
  providerName: 'OpenAI Compatible',
  modelId: 'gpt-4o-mini',
};
const usage = {
  promptTokens: 1_000,
  completionTokens: 500,
  totalTokens: 1_500,
};

describe('Mastra Assistant observability projection', () => {
  it('projects token usage with the same static catalog cost used by persisted execution logs', () => {
    expect(projectAssistantUsage(model.modelId, usage)).toEqual({
      ...usage,
      estimatedCost: 0.00045,
    });
  });

  it('records correlation, resolved model, tokens and cost without serializing raw prompt content', () => {
    const log = createAssistantExecutionLog({
      identityId: 'identity-1',
      context: { requestId: 'req-1', traceId: 'trace-1' },
      conversationId: 'conversation-1',
      contentLength: 42,
      model,
      runId: 'run-1',
      assistantMessageId: 'message-1',
      responseLength: 128,
      outcome: 'assistant.run.completed',
      usage,
      processingMs: 27,
    });

    expect(log).toEqual(
      expect.objectContaining({
        identityId: 'identity-1',
        taskType: 'MASTRA_ASSISTANT_TURN',
        status: 'COMPLETED',
        requestId: 'req-1',
        traceId: 'trace-1',
        providerId: 'provider-1',
        providerName: 'OpenAI Compatible',
        model: 'gpt-4o-mini',
        input: { conversationId: 'conversation-1', contentLength: 42 },
        result: {
          runId: 'run-1',
          assistantMessageId: 'message-1',
          responseLength: 128,
          outcome: 'assistant.run.completed',
        },
        tokenUsage: usage,
        costEstimate: expect.objectContaining({
          pricingModel: 'gpt-4o-mini',
          totalCostUsd: 0.00045,
        }),
        processingMs: 27,
      }),
    );
    expect(log.input).not.toHaveProperty('content');
    expect(log.error).toBeUndefined();
    expect(log.errorCategory).toBeUndefined();
  });

  it('classifies cancellation and runtime failure without leaking raw provider errors', () => {
    const cancelled = createAssistantExecutionLog({
      identityId: 'identity-1',
      conversationId: 'conversation-1',
      contentLength: 10,
      model,
      runId: 'run-cancelled',
      responseLength: 0,
      outcome: 'assistant.run.cancelled',
      processingMs: -1,
    });
    expect(cancelled).toEqual(
      expect.objectContaining({
        status: 'FAILED',
        errorCategory: 'aborted',
        error: 'aborted',
        processingMs: 0,
      }),
    );

    const failed = createAssistantExecutionLog({
      identityId: 'identity-1',
      conversationId: 'conversation-1',
      contentLength: 10,
      model,
      runId: 'run-failed',
      responseLength: 0,
      outcome: 'assistant.run.failed',
      runtimeErrorCode: 'PROVIDER_500',
      processingMs: 12,
    });
    expect(failed).toEqual(
      expect.objectContaining({
        status: 'FAILED',
        errorCategory: 'PROVIDER_500',
        error: 'AI runtime request failed',
      }),
    );
    expect(JSON.stringify(failed)).not.toContain('apiKey');
  });

  it('omits cost when the model is not in the static pricing catalog', () => {
    expect(projectAssistantUsage('custom-model', usage)).toEqual(usage);
    const log = createAssistantExecutionLog({
      identityId: 'identity-1',
      conversationId: 'conversation-1',
      contentLength: 1,
      model: { ...model, modelId: 'custom-model' },
      runId: 'run-1',
      responseLength: 1,
      outcome: 'assistant.run.completed',
      usage,
      processingMs: 1,
    });
    expect(log.costEstimate).toBeUndefined();
  });
});
