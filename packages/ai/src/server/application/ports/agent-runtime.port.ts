import type {
  AgentEvent,
  AgentResumePayload,
  AgentRun,
  AgentRunListParams,
  AgentRunResult,
  AgentStartRunRequest,
} from '@memoflow/contracts/ai';

export interface AgentRuntimeStartInput {
  request: AgentStartRunRequest;
  requestId?: string;
  signal?: AbortSignal;
}

export interface AgentRuntimeRunInput {
  identityId: string;
  runId: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface AgentRuntimeListInput extends AgentRunListParams {
  identityId: string;
  requestId?: string;
  signal?: AbortSignal;
}

export interface AgentRuntimeResumeInput extends AgentRuntimeRunInput {
  payload: AgentResumePayload;
}

export interface IAgentRuntimePort {
  startRun(input: AgentRuntimeStartInput): Promise<AgentRunResult>;
  resumeRun(input: AgentRuntimeResumeInput): Promise<AgentRunResult>;
  listRuns(input: AgentRuntimeListInput): Promise<AgentRun[]>;
  getRun(input: AgentRuntimeRunInput): Promise<AgentRunResult>;
  getEvents(input: AgentRuntimeRunInput): Promise<AgentEvent[]>;
}
