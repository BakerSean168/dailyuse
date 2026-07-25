import { describe, expect, it, vi } from 'vitest';
import { AIAssistantHttpAdapter } from './ai-assistant-http.adapter';
import type { IResultHttpClient } from '../types';

function createHttpClientStub(overrides?: Partial<IResultHttpClient>): IResultHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    stream: vi.fn(),
    ...overrides,
  };
}

function createSseResponse(events: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(event));
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    },
  );
}

describe('AIAssistantHttpAdapter', () => {
  it('streams assistant events and done payload without sending identityId', async () => {
    const stream = vi.fn().mockResolvedValue(
      createSseResponse([
        `event: assistant\ndata: ${JSON.stringify({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        })}\n\n`,
        `event: assistant\ndata: ${JSON.stringify({
          type: 'message.completed',
          runId: 'run-1',
          status: 'completed',
          content: 'hi',
        })}\n\n`,
        `event: done\ndata: ${JSON.stringify({ eventCount: 2 })}\n\n`,
      ]),
    );
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    const events: unknown[] = [];
    let done: { eventCount: number } | undefined;

    await adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'conv-1',
        content: 'hello',
        surface: 'web',
      },
      {
        onEvent: (event) => events.push(event),
        onDone: (result) => {
          done = result;
        },
      },
    );

    expect(stream).toHaveBeenCalledWith(
      '/ai/assistant/dispatch/sse',
      expect.objectContaining({
        method: 'POST',
        body: {
          type: 'message',
          conversationId: 'conv-1',
          content: 'hello',
          surface: 'web',
        },
      }),
    );
    expect(JSON.stringify(stream.mock.calls[0][1].body)).not.toContain('identityId');
    expect(events).toHaveLength(2);
    expect(done).toEqual({ eventCount: 2 });
  });

  it('rejects client commands that attempt to smuggle identityId', async () => {
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub());
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'cancel_run',
          runId: 'r1',
          identityId: 'attacker',
        } as never,
        {},
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('surfaces SSE error events as ResultClientError', async () => {
    const adapter = new AIAssistantHttpAdapter(
      createHttpClientStub({
        stream: vi.fn().mockResolvedValue(
          createSseResponse([
            `event: error\ndata: ${JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'bad command',
            })}\n\n`,
          ]),
        ),
      }),
    );
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'approve_proposal',
          runId: 'run-p',
          proposalId: 'prop-1',
          revision: 1,
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'bad command',
    });
  });

  it('forwards executionProfileId pi_readonly without identityId (residual 377)', async () => {
    const stream = vi.fn().mockResolvedValue(
      createSseResponse([
        `event: assistant\ndata: ${JSON.stringify({
          type: 'run.started',
          runId: 'run-ro',
          engineId: 'engine.pi_readonly',
          profile: 'pi_readonly',
        })}\n\n`,
        `event: assistant\ndata: ${JSON.stringify({
          type: 'message.completed',
          runId: 'run-ro',
          status: 'completed',
        })}\n\n`,
        `event: done\ndata: ${JSON.stringify({ eventCount: 2 })}\n\n`,
      ]),
    );
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    const events: unknown[] = [];
    let done: { eventCount: number } | undefined;

    await adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'conv-ro',
        content: 'analyze',
        surface: 'web',
        executionProfileId: 'pi_readonly',
      },
      {
        onEvent: (event) => events.push(event),
        onDone: (result) => {
          done = result;
        },
      },
    );

    expect(stream).toHaveBeenCalledWith(
      '/ai/assistant/dispatch/sse',
      expect.objectContaining({
        method: 'POST',
        body: {
          type: 'message',
          conversationId: 'conv-ro',
          content: 'analyze',
          surface: 'web',
          executionProfileId: 'pi_readonly',
        },
      }),
    );
    expect(JSON.stringify(stream.mock.calls[0][1].body)).not.toContain('identityId');
    expect(events).toEqual([
      {
        type: 'run.started',
        runId: 'run-ro',
        engineId: 'engine.pi_readonly',
        profile: 'pi_readonly',
      },
      {
        type: 'message.completed',
        runId: 'run-ro',
        status: 'completed',
      },
    ]);
    expect(done).toEqual({ eventCount: 2 });
  });

});
