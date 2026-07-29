import { AIChannels } from '@memoflow/contracts/electron';
import type {
  AgentEvent,
  AgentRun,
  AgentRunListParams,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@memoflow/contracts/ai';
import type { Result } from '@memoflow/contracts/result';
import type { AIAgentRuntimeApiClient, IResultIpcClient } from '../types';

/** IPC adapter — returns Result, never throws (residual 100). */
export class AIAgentRuntimeIpcAdapter implements AIAgentRuntimeApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async listAgentRuns(params: AgentRunListParams = {}): Promise<Result<AgentRun[]>> {
    return this.ipcClient.invoke<AgentRun[]>(AIChannels.AGENT_RUN_LIST, params);
  }

  async startAgentRun(request: AgentStartRunClientRequest): Promise<Result<AgentRunResult>> {
    return this.ipcClient.invoke<AgentRunResult>(AIChannels.AGENT_RUN_START, request);
  }

  async resumeAgentRun(
    runId: string,
    payload: AgentResumePayload,
  ): Promise<Result<AgentRunResult>> {
    return this.ipcClient.invoke<AgentRunResult>(AIChannels.AGENT_RUN_RESUME, {
      runId,
      payload,
    });
  }

  async getAgentRun(runId: string): Promise<Result<AgentRunResult>> {
    return this.ipcClient.invoke<AgentRunResult>(AIChannels.AGENT_RUN_GET, runId);
  }

  async getAgentEvents(runId: string): Promise<Result<AgentEvent[]>> {
    return this.ipcClient.invoke<AgentEvent[]>(AIChannels.AGENT_EVENTS_GET, runId);
  }
}
