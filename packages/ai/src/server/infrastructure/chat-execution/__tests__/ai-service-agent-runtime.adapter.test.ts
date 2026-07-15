import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AIServiceAgentRuntimeAdapter,
  INTERNAL_CONTENT_HASH_HEADER,
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
  signInternalRequest,
} from '..';

const runResult = {
  run: {
    runId: 'run-1',
    threadId: 'thread-1',
    conversationId: null,
    identityId: 'identity-1',
    agentType: 'goal.create',
    status: 'waiting_approval',
    createdAt: 1,
    updatedAt: 2,
  },
  state: {
    stage: 'approval',
    intent: 'goal-create',
    pendingActions: [{ tool: 'create_goal', index: 0 }],
  },
  events: [],
  interrupts: [],
};

function createAdapter(): AIServiceAgentRuntimeAdapter {
  return new AIServiceAgentRuntimeAdapter({
    baseUrl: 'http://127.0.0.1:8100',
    serviceSecret: 'shared-secret',
    serviceName: 'dailyuse-api',
    timeoutMs: 5_000,
  });
}

function expectSignedRequest(
  init: RequestInit,
  options: {
    method: 'GET' | 'POST';
    path: string;
    requestId: string;
    identityId: string;
    body: string;
  },
): void {
  const headers = init.headers as Record<string, string>;
  const timestamp = Number(headers[INTERNAL_TIMESTAMP_HEADER]);
  const signature = signInternalRequest({
    serviceName: 'dailyuse-api',
    method: options.method,
    path: options.path,
    timestamp,
    body: options.body,
    secret: 'shared-secret',
  });

  expect(init.method).toBe(options.method);
  expect(headers[INTERNAL_SERVICE_HEADER]).toBe('dailyuse-api');
  expect(headers['X-Request-Id']).toBe(options.requestId);
  expect(headers['X-Identity-Id']).toBe(options.identityId);
  expect(headers[INTERNAL_CONTENT_HASH_HEADER]).toBe(signature.contentSha256);
  expect(headers[INTERNAL_SIGNATURE_HEADER]).toBe(signature.signature);
}

describe('AIServiceAgentRuntimeAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a run via a signed internal POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => runResult,
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createAdapter();
    await expect(
      adapter.startRun({
        requestId: 'request-1',
        request: {
          runId: 'run-1',
          threadId: 'thread-1',
          conversationId: null,
          identityId: 'identity-1',
          agentType: 'goal.create',
          locale: 'zh-CN',
          input: { prompt: 'Create an implementation goal' },
        },
      }),
    ).resolves.toMatchObject(runResult);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:8100/internal/agents/runs');
    expectSignedRequest(init, {
      method: 'POST',
      path: '/internal/agents/runs',
      requestId: 'request-1',
      identityId: 'identity-1',
      body: String(init.body),
    });
  });

  it('lists runs via a signed internal GET request with query filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [runResult.run],
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createAdapter();
    await expect(
      adapter.listRuns({
        identityId: 'identity-1',
        conversationId: 'conversation-1',
        status: ['waiting_approval', 'waiting_execution'],
        activeOnly: true,
        limit: 5,
        requestId: 'request-list',
      }),
    ).resolves.toEqual([runResult.run]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const path =
      '/internal/agents/runs?conversationId=conversation-1&status=waiting_approval&status=waiting_execution&activeOnly=true&limit=5';
    expect(url).toBe(`http://127.0.0.1:8100${path}`);
    expect(init.body).toBeUndefined();
    expectSignedRequest(init, {
      method: 'GET',
      path: '/internal/agents/runs',
      requestId: 'request-list',
      identityId: 'identity-1',
      body: '',
    });
  });

  it('resumes a run via a signed internal POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => runResult,
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createAdapter();
    await expect(
      adapter.resumeRun({
        identityId: 'identity-1',
        runId: 'run-1',
        requestId: 'request-2',
        payload: {
          userDecision: 'confirm',
          approvedActions: [{ tool: 'create_goal', index: 0 }],
        },
      }),
    ).resolves.toMatchObject(runResult);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:8100/internal/agents/runs/run-1/resume');
    expectSignedRequest(init, {
      method: 'POST',
      path: '/internal/agents/runs/run-1/resume',
      requestId: 'request-2',
      identityId: 'identity-1',
      body: String(init.body),
    });
  });

  it('gets a run via a signed internal GET request with an empty-body signature', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => runResult,
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createAdapter();
    await expect(
      adapter.getRun({
        identityId: 'identity-1',
        runId: 'run-1',
        requestId: 'request-3',
      }),
    ).resolves.toMatchObject(runResult);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:8100/internal/agents/runs/run-1');
    expect(init.body).toBeUndefined();
    expectSignedRequest(init, {
      method: 'GET',
      path: '/internal/agents/runs/run-1',
      requestId: 'request-3',
      identityId: 'identity-1',
      body: '',
    });
  });

  it('gets run events via a signed internal GET request with an empty-body signature', async () => {
    const events = [
      {
        eventId: 'event-1',
        runId: 'run-1',
        sequence: 0,
        type: 'approval.required',
        createdAt: 2,
        data: {},
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => events,
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createAdapter();
    await expect(
      adapter.getEvents({
        identityId: 'identity-1',
        runId: 'run-1',
        requestId: 'request-4',
      }),
    ).resolves.toEqual(events);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:8100/internal/agents/runs/run-1/events');
    expect(init.body).toBeUndefined();
    expectSignedRequest(init, {
      method: 'GET',
      path: '/internal/agents/runs/run-1/events',
      requestId: 'request-4',
      identityId: 'identity-1',
      body: '',
    });
  });
});
