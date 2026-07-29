import { fail, type Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import {
  AgentResumePayloadSchema,
  AgentRunListParamsSchema,
  AgentRunStatusSchema,
  AgentStartRunClientRequestSchema,
  type AgentRun,
  type AgentRunListParams,
  type AgentEvent,
  type AgentResumePayload,
  type AgentRunResult,
  type AgentStartRunRequest,
} from '@memoflow/contracts/ai';
import { formatZodErrors } from '@memoflow/utils/result';
import { z } from 'zod';

interface AIAgentRuntimeControllerService {
  startAgentRun(
    request: AgentStartRunRequest,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  resumeAgentRun(
    runId: string,
    payload: AgentResumePayload,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  getAgentRun(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  listAgentRuns(
    params: AgentRunListParams,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRun[]>>;
  getAgentEvents(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentEvent[]>>;
}

const RunIdSchema = z.string().min(1);
const BooleanQuerySchema = z.preprocess((value) => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
}, z.boolean());
const NumberQuerySchema = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }
  return value;
}, z.number().int().min(1).max(100));
const AgentRunListQuerySchema = AgentRunListParamsSchema.extend({
  status: z.preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    return Array.isArray(value) ? value : [value];
  }, z.array(AgentRunStatusSchema).optional()),
  activeOnly: BooleanQuerySchema.optional(),
  limit: NumberQuerySchema.optional(),
});

export class AIAgentRuntimeController {
  constructor(private readonly service: AIAgentRuntimeControllerService) {}

  async startRun(
    input: unknown,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>> {
    const parsed = AgentStartRunClientRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.startAgentRun(
      {
        ...parsed.data,
        identityId: cx.identityId,
      },
      cx,
      requestId,
      signal,
    );
  }

  async resumeRun(
    runId: string,
    input: unknown,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>> {
    const parsedRunId = RunIdSchema.safeParse(runId);
    if (!parsedRunId.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsedRunId.error.issues),
      });
    }

    const parsed = AgentResumePayloadSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.resumeAgentRun(parsedRunId.data, parsed.data, cx, requestId, signal);
  }

  async getRun(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>> {
    const parsed = RunIdSchema.safeParse(runId);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.getAgentRun(parsed.data, cx, requestId, signal);
  }

  async listRuns(
    input: unknown,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRun[]>> {
    const parsed = AgentRunListQuerySchema.safeParse(input ?? {});
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.listAgentRuns(parsed.data, cx, requestId, signal);
  }

  async getEvents(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentEvent[]>> {
    const parsed = RunIdSchema.safeParse(runId);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.getAgentEvents(parsed.data, cx, requestId, signal);
  }
}
