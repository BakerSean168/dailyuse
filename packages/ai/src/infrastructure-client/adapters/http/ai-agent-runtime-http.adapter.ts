import type { AIAgentRuntimeApiClient, IResultHttpClient } from '../types';
import type {
  AgentEvent,
  AgentRun,
  AgentRunListParams,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

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

/** HTTP adapter — returns Result, never throws (residual 100). */
export class AIAgentRuntimeHttpAdapter implements AIAgentRuntimeApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async listAgentRuns(params: AgentRunListParams = {}): Promise<Result<AgentRun[]>> {
    return this.httpClient.get<AgentRun[]>(`/ai/agents/runs${runListQuery(params)}`);
  }

  async startAgentRun(request: AgentStartRunClientRequest): Promise<Result<AgentRunResult>> {
    return this.httpClient.post<AgentRunResult>('/ai/agents/runs', request);
  }

  async resumeAgentRun(
    runId: string,
    payload: AgentResumePayload,
  ): Promise<Result<AgentRunResult>> {
    return this.httpClient.post<AgentRunResult>(
      `/ai/agents/runs/${encodeURIComponent(runId)}/resume`,
      payload,
    );
  }

  async getAgentRun(runId: string): Promise<Result<AgentRunResult>> {
    return this.httpClient.get<AgentRunResult>(
      `/ai/agents/runs/${encodeURIComponent(runId)}`,
    );
  }

  async getAgentEvents(runId: string): Promise<Result<AgentEvent[]>> {
    return this.httpClient.get<AgentEvent[]>(
      `/ai/agents/runs/${encodeURIComponent(runId)}/events`,
    );
  }
}
