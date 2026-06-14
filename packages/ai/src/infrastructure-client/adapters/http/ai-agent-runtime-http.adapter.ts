import type { AIAgentRuntimeApiClient, IResultHttpClient } from '../types';
import type {
  AgentEvent,
  AgentRun,
  AgentRunListParams,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

function runListQuery(params: AgentRunListParams = {}): string {
  const search = new URLSearchParams();
  if (params.conversationId) {
    search.set('conversationId', params.conversationId);
  }
  if (Array.isArray(params.status)) {
    for (const status of params.status) {
      search.append('status', status);
    }
  }
  if (typeof params.activeOnly === 'boolean') {
    search.set('activeOnly', String(params.activeOnly));
  }
  if (typeof params.limit === 'number') {
    search.set('limit', String(params.limit));
  }

  return search.size > 0 ? `?${search.toString()}` : '';
}

export class AIAgentRuntimeHttpAdapter implements AIAgentRuntimeApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async listAgentRuns(params: AgentRunListParams = {}): Promise<AgentRun[]> {
    const result = await this.httpClient.get<AgentRun[]>(
      `/ai/agents/runs${runListQuery(params)}`,
    );
    return unwrapResultOrThrow(result);
  }

  async startAgentRun(request: AgentStartRunClientRequest): Promise<AgentRunResult> {
    const result = await this.httpClient.post<AgentRunResult>('/ai/agents/runs', request);
    return unwrapResultOrThrow(result);
  }

  async resumeAgentRun(
    runId: string,
    payload: AgentResumePayload,
  ): Promise<AgentRunResult> {
    const result = await this.httpClient.post<AgentRunResult>(
      `/ai/agents/runs/${encodeURIComponent(runId)}/resume`,
      payload,
    );
    return unwrapResultOrThrow(result);
  }

  async getAgentRun(runId: string): Promise<AgentRunResult> {
    const result = await this.httpClient.get<AgentRunResult>(
      `/ai/agents/runs/${encodeURIComponent(runId)}`,
    );
    return unwrapResultOrThrow(result);
  }

  async getAgentEvents(runId: string): Promise<AgentEvent[]> {
    const result = await this.httpClient.get<AgentEvent[]>(
      `/ai/agents/runs/${encodeURIComponent(runId)}/events`,
    );
    return unwrapResultOrThrow(result);
  }
}
