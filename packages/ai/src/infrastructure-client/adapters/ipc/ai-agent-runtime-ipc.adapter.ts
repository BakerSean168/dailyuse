import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  AgentEvent,
  AgentRun,
  AgentRunListParams,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import type { AIAgentRuntimeApiClient, IResultIpcClient } from '../types';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIAgentRuntimeIpcAdapter implements AIAgentRuntimeApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async listAgentRuns(params: AgentRunListParams = {}): Promise<AgentRun[]> {
    const result = await this.ipcClient.invoke<AgentRun[]>(
      AIChannels.AGENT_RUN_LIST,
      params,
    );
    return unwrapResultOrThrow(result);
  }

  async startAgentRun(request: AgentStartRunClientRequest): Promise<AgentRunResult> {
    const result = await this.ipcClient.invoke<AgentRunResult>(
      AIChannels.AGENT_RUN_START,
      request,
    );
    return unwrapResultOrThrow(result);
  }

  async resumeAgentRun(
    runId: string,
    payload: AgentResumePayload,
  ): Promise<AgentRunResult> {
    const result = await this.ipcClient.invoke<AgentRunResult>(
      AIChannels.AGENT_RUN_RESUME,
      { runId, payload },
    );
    return unwrapResultOrThrow(result);
  }

  async getAgentRun(runId: string): Promise<AgentRunResult> {
    const result = await this.ipcClient.invoke<AgentRunResult>(
      AIChannels.AGENT_RUN_GET,
      runId,
    );
    return unwrapResultOrThrow(result);
  }

  async getAgentEvents(runId: string): Promise<AgentEvent[]> {
    const result = await this.ipcClient.invoke<AgentEvent[]>(
      AIChannels.AGENT_EVENTS_GET,
      runId,
    );
    return unwrapResultOrThrow(result);
  }
}
