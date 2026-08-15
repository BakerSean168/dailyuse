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

function createJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const runStarted = {
  type: 'run.started',
  runId: 'run-1',
  engineId: 'engine.direct_turn',
  profile: 'direct_turn',
};

function messageCommand() {
  return {
    type: 'message' as const,
    conversationId: 'conv-1',
    content: 'hello',
    surface: 'web' as const,
  };
}

describe('AIAssistantHttpAdapter', () => {
  it('streams assistant events and done payload without sending identityId', async () => {
    const stream = vi.fn().mockResolvedValue(
      createSseResponse([
        `event: assistant\ndata: ${JSON.stringify(runStarted)}\n\n`,
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

    await adapter.dispatchAssistant(messageCommand(), {
      onEvent: (event) => events.push(event),
      onDone: (result) => {
        done = result;
      },
    });

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

  it('handles events split across multiple network chunks and multi-line done data', async () => {
    const runStartedJson = JSON.stringify(runStarted);
    const stream = vi.fn().mockResolvedValue(
      createSseResponse([
        `event: assistant\ndata: ${runStartedJson.slice(0, 20)}`,
        `${runStartedJson.slice(20)}\n\n`,
        `event: done\ndata: {\ndata:   "eventCount": 1\ndata: }\n\n`,
      ]),
    );
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    const events: unknown[] = [];
    let done: { eventCount: number } | undefined;

    await adapter.dispatchAssistant(messageCommand(), {
      onEvent: (event) => events.push(event),
      onDone: (result) => {
        done = result;
      },
    });

    expect(events).toEqual([runStarted]);
    expect(done).toEqual({ eventCount: 1 });
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

  it('classifies bootstrap route absence 404/405/501 as dispatch unavailable', async () => {
    for (const status of [404, 405, 501]) {
      const stream = vi
        .fn()
        .mockResolvedValue(createJsonResponse(status, { message: 'not here' }));
      const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
      await expect(
        adapter.dispatchAssistant(messageCommand(), {}),
      ).rejects.toMatchObject({
        code: 'ASSISTANT_DISPATCH_UNAVAILABLE',
        statusCode: status,
      });
    }
  });

  it('keeps other bootstrap HTTP errors as their own code, not unavailable', async () => {
    const stream = vi
      .fn()
      .mockResolvedValue(createJsonResponse(500, { code: 'INTERNAL_ERROR', message: 'boom' }));
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(adapter.dispatchAssistant(messageCommand(), {})).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
    });
  });

  it('turns malformed assistant JSON into a protocol error', async () => {
    const stream = vi
      .fn()
      .mockResolvedValue(createSseResponse([`event: assistant\ndata: {not-json}\n\n`]));
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(adapter.dispatchAssistant(messageCommand(), {})).rejects.toMatchObject({
      code: 'ASSISTANT_PROTOCOL_ERROR',
    });
  });

  it('turns a well-formed but invalid assistant event into a protocol error', async () => {
    // run.started requires engineId/profile — missing them is a protocol failure.
    const stream = vi
      .fn()
      .mockResolvedValue(
        createSseResponse([
          `event: assistant\ndata: ${JSON.stringify({ type: 'run.started', runId: 'r1' })}\n\n`,
        ]),
      );
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(adapter.dispatchAssistant(messageCommand(), {})).rejects.toMatchObject({
      code: 'ASSISTANT_PROTOCOL_ERROR',
    });
  });

  it('turns a malformed done payload into a protocol error', async () => {
    const stream = vi
      .fn()
      .mockResolvedValue(
        createSseResponse([
          `event: assistant\ndata: ${JSON.stringify(runStarted)}\n\n`,
          `event: done\ndata: ${JSON.stringify({ eventCount: -1 })}\n\n`,
        ]),
      );
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(adapter.dispatchAssistant(messageCommand(), {})).rejects.toMatchObject({
      code: 'ASSISTANT_PROTOCOL_ERROR',
    });
  });

  it('rejects an unknown SSE event name as a protocol error', async () => {
    const stream = vi
      .fn()
      .mockResolvedValue(createSseResponse([`event: mystery\ndata: ${JSON.stringify({ a: 1 })}\n\n`]));
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(adapter.dispatchAssistant(messageCommand(), {})).rejects.toMatchObject({
      code: 'ASSISTANT_PROTOCOL_ERROR',
    });
  });

  it('classifies a premature EOF (no done) as STREAM_TERMINATED, not unavailable', async () => {
    const stream = vi
      .fn()
      .mockResolvedValue(
        createSseResponse([`event: assistant\ndata: ${JSON.stringify(runStarted)}\n\n`]),
      );
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(adapter.dispatchAssistant(messageCommand(), {})).rejects.toMatchObject({
      code: 'STREAM_TERMINATED',
    });
  });

  it('surfaces an abort as ABORTED', async () => {
    const controller = new AbortController();
    const stream = vi.fn().mockImplementation(async (_url: string, _init: unknown) => {
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    const adapter = new AIAssistantHttpAdapter(createHttpClientStub({ stream }));
    await expect(
      adapter.dispatchAssistant(messageCommand(), {}, controller.signal),
    ).rejects.toMatchObject({ code: 'ABORTED' });
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
