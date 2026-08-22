import {
  AIWorkflowCancelClientRequestSchema,
  AIWorkflowGetClientRequestSchema,
  AIWorkflowListClientRequestSchema,
  AIWorkflowResumeClientRequestSchema,
  AIWorkflowRunViewSchema,
  AIWorkflowStartClientRequestSchema,
  type AIWorkflowCancelClientRequest,
  type AIWorkflowGetClientRequest,
  type AIWorkflowListClientRequest,
  type AIWorkflowResumeClientRequest,
  type AIWorkflowRunView,
  type AIWorkflowStartClientRequest,
} from '@memoflow/contracts/ai';
import { AIChannels } from '@memoflow/contracts/electron';
import { unwrapOrThrowError } from '@memoflow/contracts/result';
import type { IResultHttpClient } from '@memoflow/http-client';
import type { IResultIpcClient } from '@memoflow/ipc-client';
import { createResultClientError } from '../infrastructure-client/adapters/result-client-error';

/** Canonical cross-host Workflow client. No Mastra private type crosses this seam. */
export interface WorkflowRuntimeClient {
  start(request: AIWorkflowStartClientRequest): Promise<AIWorkflowRunView>;
  resume(request: AIWorkflowResumeClientRequest): Promise<AIWorkflowRunView>;
  get(request: AIWorkflowGetClientRequest): Promise<AIWorkflowRunView | null>;
  list(request?: AIWorkflowListClientRequest): Promise<readonly AIWorkflowRunView[]>;
  cancel(request: AIWorkflowCancelClientRequest): Promise<AIWorkflowRunView | null>;
}

function invalidRequest(kind: string): never {
  throw createResultClientError(`Invalid AI workflow ${kind} request`, 'VALIDATION_ERROR');
}

function parseRun(value: unknown): AIWorkflowRunView {
  const parsed = AIWorkflowRunViewSchema.safeParse(value);
  if (!parsed.success) {
    throw createResultClientError('Invalid AI workflow run response', 'AI_RUNTIME_PROTOCOL_ERROR');
  }
  return parsed.data;
}

function parseOptionalRun(value: unknown): AIWorkflowRunView | null {
  if (value === null) return null;
  return parseRun(value);
}

function parseRuns(value: unknown): readonly AIWorkflowRunView[] {
  if (!Array.isArray(value)) {
    throw createResultClientError('Invalid AI workflow list response', 'AI_RUNTIME_PROTOCOL_ERROR');
  }
  return value.map(parseRun);
}

export class WorkflowRuntimeHttpClient implements WorkflowRuntimeClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async start(request: AIWorkflowStartClientRequest): Promise<AIWorkflowRunView> {
    const parsed = AIWorkflowStartClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('start');
    const result = await this.httpClient.post<unknown>('/ai/runtime/workflow/start', parsed.data);
    return parseRun(unwrapOrThrowError(result));
  }

  async resume(request: AIWorkflowResumeClientRequest): Promise<AIWorkflowRunView> {
    const parsed = AIWorkflowResumeClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('resume');
    const result = await this.httpClient.post<unknown>('/ai/runtime/workflow/resume', parsed.data);
    return parseRun(unwrapOrThrowError(result));
  }

  async get(request: AIWorkflowGetClientRequest): Promise<AIWorkflowRunView | null> {
    const parsed = AIWorkflowGetClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('get');
    const result = await this.httpClient.post<unknown>('/ai/runtime/workflow/get', parsed.data);
    return parseOptionalRun(unwrapOrThrowError(result));
  }

  async list(request: AIWorkflowListClientRequest = {}): Promise<readonly AIWorkflowRunView[]> {
    const parsed = AIWorkflowListClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('list');
    const result = await this.httpClient.post<unknown>('/ai/runtime/workflow/list', parsed.data);
    return parseRuns(unwrapOrThrowError(result));
  }

  async cancel(request: AIWorkflowCancelClientRequest): Promise<AIWorkflowRunView | null> {
    const parsed = AIWorkflowCancelClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('cancel');
    const result = await this.httpClient.post<unknown>('/ai/runtime/workflow/cancel', parsed.data);
    return parseOptionalRun(unwrapOrThrowError(result));
  }
}

export class WorkflowRuntimeIpcClient implements WorkflowRuntimeClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async start(request: AIWorkflowStartClientRequest): Promise<AIWorkflowRunView> {
    const parsed = AIWorkflowStartClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('start');
    const result = await this.ipcClient.invoke<unknown>(
      AIChannels.RUNTIME_WORKFLOW_START,
      parsed.data,
    );
    return parseRun(unwrapOrThrowError(result));
  }

  async resume(request: AIWorkflowResumeClientRequest): Promise<AIWorkflowRunView> {
    const parsed = AIWorkflowResumeClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('resume');
    const result = await this.ipcClient.invoke<unknown>(
      AIChannels.RUNTIME_WORKFLOW_RESUME,
      parsed.data,
    );
    return parseRun(unwrapOrThrowError(result));
  }

  async get(request: AIWorkflowGetClientRequest): Promise<AIWorkflowRunView | null> {
    const parsed = AIWorkflowGetClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('get');
    const result = await this.ipcClient.invoke<unknown>(
      AIChannels.RUNTIME_WORKFLOW_GET,
      parsed.data,
    );
    return parseOptionalRun(unwrapOrThrowError(result));
  }

  async list(request: AIWorkflowListClientRequest = {}): Promise<readonly AIWorkflowRunView[]> {
    const parsed = AIWorkflowListClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('list');
    const result = await this.ipcClient.invoke<unknown>(
      AIChannels.RUNTIME_WORKFLOW_LIST,
      parsed.data,
    );
    return parseRuns(unwrapOrThrowError(result));
  }

  async cancel(request: AIWorkflowCancelClientRequest): Promise<AIWorkflowRunView | null> {
    const parsed = AIWorkflowCancelClientRequestSchema.safeParse(request);
    if (!parsed.success) invalidRequest('cancel');
    const result = await this.ipcClient.invoke<unknown>(
      AIChannels.RUNTIME_WORKFLOW_CANCEL,
      parsed.data,
    );
    return parseOptionalRun(unwrapOrThrowError(result));
  }
}

export function createWorkflowRuntimeHttpClient(
  httpClient: IResultHttpClient,
): WorkflowRuntimeClient {
  return new WorkflowRuntimeHttpClient(httpClient);
}

export function createWorkflowRuntimeIpcClient(ipcClient: IResultIpcClient): WorkflowRuntimeClient {
  return new WorkflowRuntimeIpcClient(ipcClient);
}
