import type {
  AgentEvent,
  AgentRun,
  AgentRunResult,
} from '@dailyuse/contracts/ai';
import {
  AgentEventSchema,
  AgentRunSchema,
  AgentRunResultSchema,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  AgentRuntimeListInput,
  AgentRuntimeResumeInput,
  AgentRuntimeRunInput,
  AgentRuntimeStartInput,
  IAgentRuntimePort,
} from '../../application-server/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

const logger = createLogger('AIServiceAgentRuntimeAdapter');

function agentRunPath(runId: string, suffix = ''): string {
  return `/internal/agents/runs/${encodeURIComponent(runId)}${suffix}`;
}

function agentRunListPath(input: AgentRuntimeListInput): string {
  const params = new URLSearchParams();
  if (input.conversationId) {
    params.set('conversationId', input.conversationId);
  }
  if (Array.isArray(input.status)) {
    for (const status of input.status) {
      params.append('status', status);
    }
  }
  if (typeof input.activeOnly === 'boolean') {
    params.set('activeOnly', String(input.activeOnly));
  }
  if (typeof input.limit === 'number') {
    params.set('limit', String(input.limit));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return `/internal/agents/runs${suffix}`;
}

export class AIServiceAgentRuntimeAdapter implements IAgentRuntimePort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async startRun(input: AgentRuntimeStartInput): Promise<AgentRunResult> {
    logger.info('ai-service agent runtime start requested', {
      requestId: input.requestId,
      runId: input.request.runId,
      threadId: input.request.threadId,
      identityId: input.request.identityId,
      agentType: input.request.agentType,
    });
    const payload = await this.client.postJson<unknown, AgentRuntimeStartInput['request']>({
      path: '/internal/agents/runs',
      identityId: input.request.identityId,
      requestId: input.requestId,
      signal: input.signal,
      body: input.request,
    });
    return AgentRunResultSchema.parse(payload);
  }

  async resumeRun(input: AgentRuntimeResumeInput): Promise<AgentRunResult> {
    logger.info('ai-service agent runtime resume requested', {
      requestId: input.requestId,
      runId: input.runId,
      identityId: input.identityId,
      userDecision: input.payload.userDecision,
    });
    const payload = await this.client.postJson<unknown, AgentRuntimeResumeInput['payload']>({
      path: agentRunPath(input.runId, '/resume'),
      identityId: input.identityId,
      requestId: input.requestId,
      signal: input.signal,
      body: input.payload,
    });
    return AgentRunResultSchema.parse(payload);
  }

  async listRuns(input: AgentRuntimeListInput): Promise<AgentRun[]> {
    const path = agentRunListPath(input);
    const payload = await this.client.getJson<unknown>({
      path,
      identityId: input.identityId,
      requestId: input.requestId,
      signal: input.signal,
    });
    return AgentRunSchema.array().parse(payload);
  }

  async getRun(input: AgentRuntimeRunInput): Promise<AgentRunResult> {
    const payload = await this.client.getJson<unknown>({
      path: agentRunPath(input.runId),
      identityId: input.identityId,
      requestId: input.requestId,
      signal: input.signal,
    });
    return AgentRunResultSchema.parse(payload);
  }

  async getEvents(input: AgentRuntimeRunInput): Promise<AgentEvent[]> {
    const payload = await this.client.getJson<unknown>({
      path: agentRunPath(input.runId, '/events'),
      identityId: input.identityId,
      requestId: input.requestId,
      signal: input.signal,
    });
    return AgentEventSchema.array().parse(payload);
  }
}
