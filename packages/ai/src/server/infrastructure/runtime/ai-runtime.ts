/**
 * Shared runtime types for the AI module split.
 * AI 模块运行时拆分的共享类型。
 *
 * Each runtime (direct-provider, remote-ai-service) produces this shape.
 * `createAIModule()` consumes it without caring which runtime produced it.
 */

import { z } from 'zod';
import { createLogger } from '@dailyuse/utils/logger';
import {
  AgentActionSchema,
  AgentArtifactSchema,
  CreateKnowledgeNoteSchema,
  GoalAutomationPlanSchema,
  knowledgeWriteRequirements,
  resolveRunPlan,
  type AICapabilities,
  type CapabilityOffer,
} from '@dailyuse/contracts/ai';
import { error, ok } from '@dailyuse/contracts/result';
import type { Result } from '@dailyuse/contracts/result';
import { CapabilityResolver } from '../capability-resolver';
import {
  buildHostTaskCreateStartResult,
  resolveTaskCreateTitle,
  resolveTaskCreateConversationId,
  resolveTaskCreateThreadId,
  resolveTaskCreateIdentityId,
  resolveTaskCreateRunId,
  HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE,
} from './host-task-create-start';
import {
  buildHostTaskCreateResumeResult,
  HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE,
  HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE,
} from './host-task-create-resume';
import {
  getDefaultHostTaskCreateRunStore,
  HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE,
  HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE,
  HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE,
  HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE,
} from './host-task-create-run-store';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';
import type {
  AgentAction,
  AgentCitation,
  AgentEvent,
  AgentExecutedAction,
  AgentResumePayload,
  AgentRun,
  AgentRunListParams,
  AgentRunResult,
  AgentStartRunRequest,
  GoalAutomationAction,
  GoalAutomationExecutedAction,
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
  QueryAnalyticsReq,
  QueryAnalyticsRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import type {
  AIModuleRuntimeContribution,
  AIModuleServices,
  AIKnowledgeNoteService,
  AIKnowledgeQueryServices,
  AIAnalyticsQueryService,
  AIEvaluationReportService,
  AIAgentRuntimeService,
} from '../ai.module';
import type {
  ManageAIEvaluationReportUseCase,
  ManageAIKnowledgeNoteUseCase,
  QueryAIAnalyticsUseCase,
  QueryKnowledgeUseCase,
  ExpandKnowledgeUseCase,
  ReindexKnowledgeUseCase,
} from '../../application/use-cases';
import type {
  ChatExecutionUsage,
  IAIAutomationToolExecutorPort,
  IAIExecutionLogPort,
  IAnalyticsReadPort,
  IAgentRuntimePort,
  IKnowledgeSourcePort,
  AnalyticsQueryContext,
  KnowledgeSourceNote,
} from '../../application/ports';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application/use-cases/commands/ai-provider-resolution';
import {
  classifyAIExecutionError,
  withAICostEstimate,
} from '../../application/use-cases/commands/ai-observability';

const logger = createLogger('AIAgentRuntimeService');

/**
 * Output shape produced by both direct-provider and remote-ai-service runtimes.
 * 运行时产出的统一形状。
 */
export interface AIRuntimeOutput {
  readonly services: AIModuleServices;
  readonly capabilities: AICapabilities;
  readonly runtimeContributions: readonly AIModuleRuntimeContribution[];
  /** First production Turn Engine (DirectTurnEngine); also powers open chat use cases. */
  readonly turnEngine: import('@dailyuse/contracts/ai').ITurnEnginePort;
  /**
   * Second production Turn Engine (ReadonlyAnalysisTurnEngine / engine.pi_readonly).
   * Residual 341 — Model Gateway-backed readonly analysis; not open-chat default.
   */
  readonly readonlyTurnEngine: import('@dailyuse/contracts/ai').ITurnEnginePort;
  /**
   * LangGraph workflow adapter when remote agent runtime is present; otherwise null.
   * Residual 318 — wraps IAgentRuntimePort without replacing Python graphs.
   */
  readonly workflowAdapter: import('@dailyuse/contracts/ai').IWorkflowAdapterPort | null;
  /**
   * Proposal Kernel lifecycle port (residual 320). Always present on the Host;
   * does not execute business mutations.
   */
  readonly proposalKernel: import('@dailyuse/contracts/ai').IProposalKernelPort;
  /**
   * Capability Resolver (residual 322). Fail-closed offer projection; never
   * silent-emits engine.* labels.
   */
  readonly capabilityResolver: import('@dailyuse/contracts/ai').ICapabilityResolverPort;
  /**
   * Custom Model Gateway (residual 337). OpenAI-compatible catalog/complete/stream;
   * credentials request-scoped only (never on results/events).
   */
  readonly modelGateway: import('@dailyuse/contracts/ai').IModelGatewayPort;
  /**
   * Assistant Facade (residual 343). Unified Host dispatch over Turn Engines + ProposalKernel.
   */
  readonly assistantFacade: import('@dailyuse/contracts/ai').IAssistantFacadePort;
}

export function buildCapabilityUnavailableMessage(
  capabilityLabel: string,
  capabilities: AICapabilities,
): string {
  if (capabilities.advancedFeaturesReason) {
    return `${capabilityLabel} is unavailable. ${capabilities.advancedFeaturesReason}`;
  }

  return `${capabilityLabel} is unavailable in the current AI runtime.`;
}

function unavailableResult<T>(message: string): Promise<Result<T>> {
  return Promise.resolve(error('SERVICE_UNAVAILABLE', message));
}

/**
 * Project runtime ports into ADR-035 capability offers for start-time fail-closed gating.
 * 将运行时端口投影为 ADR-035 capability offers，供 start 时 fail-closed 门禁使用。
 */
export function buildAgentRuntimeCapabilityOffers(input: {
  knowledgeNoteUseCase?: ManageAIKnowledgeNoteUseCase | null;
  automationToolExecutorPort?: IAIAutomationToolExecutorPort;
}): CapabilityOffer[] {
  const offers: CapabilityOffer[] = [
    {
      kind: 'tool.proposal',
      // Align with production ProposalKernel provider id (residual 320).
      providerId: 'proposal-kernel',
      surface: 'any',
      readonly: false,
    },
  ];

  if (input.knowledgeNoteUseCase) {
    offers.push(
      {
        kind: 'tool.mutation',
        providerId: 'knowledge-note-executor',
        surface: 'any',
        readonly: false,
      },
      {
        // Server knowledge persistence is GitHub-projection backed (Web surface).
        kind: 'context.cloud_rag',
        providerId: 'server-github-projection',
        surface: 'web',
        readonly: true,
      },
    );
  }

  if (input.automationToolExecutorPort) {
    offers.push(
      {
        kind: 'tool.mutation',
        providerId: 'goal-automation-executor',
        surface: 'any',
        readonly: false,
      },
      {
        kind: 'workflow.goal',
        providerId: 'goal-create-adapter',
        surface: 'any',
        readonly: false,
      },
    );
  }

  return offers;
}

/**
 * Fail closed before starting agent types that require host capabilities.
 * 对需要 host 能力的 agent 类型在 start 前 fail-closed。
 */
export function assertAgentStartCapabilityPlan(
  agentType: AgentStartRunRequest['agentType'],
  offersOrResolver: readonly CapabilityOffer[] | CapabilityResolver,
): Result<void> {
  if (agentType === 'knowledge.generate') {
    const requirements = knowledgeWriteRequirements('web');
    // Residual 324: prefer production CapabilityResolver when provided.
    let plan: import('@dailyuse/contracts/ai').ResolvedRunPlan;
    if (offersOrResolver instanceof CapabilityResolver) {
      plan = offersOrResolver.resolveFor('knowledge.generate', requirements, 'web');
    } else {
      plan = resolveRunPlan({
        engineId: 'knowledge.generate',
        offers: [...offersOrResolver],
        requirements,
        surface: 'web',
      });
    }
    if (plan.engineId === 'none') {
      return error(
        'SERVICE_UNAVAILABLE',
        `Knowledge generation is unavailable; missing capabilities: ${plan.missing
          .map((item) => item.kind)
          .join(', ')}`,
      );
    }
    return ok(undefined);
  }

  // goal.create / task.create may start planning without the TS automation executor;
  // mutation capability is enforced when execution.required is resolved, not at start.
  // Residual 427/431/435: task.create Host AgentType + TS start + process-local store is allowed at start.
  return ok(undefined);
}


function ensureAgentRunOwnedByIdentity(
  result: AgentRunResult,
  identityId: string,
): Result<AgentRunResult> {
  if (result.run.identityId !== identityId) {
    return error(
      'FORBIDDEN',
      'Agent run is not owned by the current identity.',
    );
  }
  return ok(result);
}

function getStringInput(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getPositiveIntegerInput(input: Record<string, unknown>, key: string): number | undefined {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return undefined;
  }

  return value;
}

function getGoalAgentContextQuery(input: Record<string, unknown>): string | undefined {
  return (
    getStringInput(input, 'idea') ??
    getStringInput(input, 'message') ??
    getStringInput(input, 'conversationTitle')
  );
}

function getKnowledgeQaQuestion(input: Record<string, unknown>): string | undefined {
  return (
    getStringInput(input, 'question') ??
    getStringInput(input, 'message') ??
    getStringInput(input, 'conversationTitle')
  );
}

function toAIServiceKnowledgeNote(resource: KnowledgeSourceNote) {
  return {
    identity_id: resource.identityId,
    repository_id: resource.repositoryId,
    resource_id: resource.resourceId,
    resource_path: resource.resourcePath,
    title: resource.title,
    mime_type: resource.mimeType,
    content: resource.content,
    metadata: resource.metadata,
  };
}

function toAIServiceAnalyticsContext(context: AnalyticsQueryContext) {
  return {
    dashboard: context.dashboard,
    task_dashboard: context.taskDashboard,
    goals: context.goals,
    goal_search_results: context.goalSearchResults,
    extra: context.extra,
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function toAgentRuntimeTaskType(operation: 'start' | 'resume'): string {
  return operation === 'start' ? 'AGENT_RUNTIME_START' : 'AGENT_RUNTIME_RESUME';
}

function toAgentRuntimeTokenUsage(
  usage: AgentRunResult['state']['usage'],
): ChatExecutionUsage | undefined {
  const hasUsage =
    usage.promptTokens !== undefined ||
    usage.completionTokens !== undefined ||
    usage.totalTokens !== undefined;
  if (!hasUsage) {
    return undefined;
  }

  const promptTokens = usage.promptTokens ?? 0;
  const completionTokens = usage.completionTokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: usage.totalTokens ?? promptTokens + completionTokens,
  };
}

function getAgentRuntimeProviderMetadata(input: Record<string, unknown>): {
  providerName?: string;
  model?: string;
} {
  const providerConfig = input['provider_config'];
  if (!providerConfig || typeof providerConfig !== 'object') {
    return {
      model: getStringInput(input, 'model'),
    };
  }

  const config = providerConfig as Record<string, unknown>;
  return {
    providerName: typeof config['provider'] === 'string' ? config['provider'] : undefined,
    model: typeof config['model'] === 'string' ? config['model'] : getStringInput(input, 'model'),
  };
}

function getAgentEventDataString(event: AgentEvent, key: string): string | undefined {
  const value = event.data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getAgentEventDataNumber(event: AgentEvent, key: string): number | undefined {
  const value = event.data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function summarizeAgentRuntimeTimings(result: AgentRunResult): {
  nodeTimings: Array<{ node: string; durationMs: number }>;
  toolTimings: Array<{ tool: string; durationMs: number; status?: string }>;
} {
  const nodeTimings: Array<{ node: string; durationMs: number }> = [];
  const toolTimings: Array<{ tool: string; durationMs: number; status?: string }> = [];

  for (const event of result.events) {
    const durationMs = getAgentEventDataNumber(event, 'durationMs');
    if (durationMs === undefined) {
      continue;
    }

    if (event.type === 'node.completed') {
      nodeTimings.push({
        node: getAgentEventDataString(event, 'node') ?? 'unknown',
        durationMs,
      });
    }
    if (event.type === 'tool.completed') {
      toolTimings.push({
        tool: getAgentEventDataString(event, 'tool') ?? 'unknown',
        durationMs,
        status: getAgentEventDataString(event, 'status'),
      });
    }
  }

  return { nodeTimings, toolTimings };
}

function toAgentCitations(citations: QueryKnowledgeRes['citations']): AgentCitation[] {
  return citations.map((citation) => ({
    resourceId: citation.resourceId,
    resourcePath: citation.resourcePath,
    title: citation.title ?? null,
    chunkIndex: citation.chunkIndex,
    excerpt: citation.excerpt,
    score: citation.score,
  }));
}

async function withAgentProviderConfig(
  req: AgentStartRunRequest,
  identityId: string,
  providerConfigRepository?: IAIProviderConfigRepository,
): Promise<AgentStartRunRequest> {
  const request = {
    ...req,
    identityId,
  };

  if (
    req.agentType !== 'goal.create' ||
    !providerConfigRepository ||
    request.input['provider_config']
  ) {
    return request;
  }

  const providerId = getStringInput(request.input, 'provider_id');
  const modelOverride = getStringInput(request.input, 'model');
  if (!providerId && !modelOverride) {
    return request;
  }

  const provider = await resolveActiveProviderConfig(
    providerConfigRepository,
    identityId,
    providerId,
  );
  const providerConfig = toChatExecutionProviderConfig(provider, {
    modelOverride,
    temperature: 0.3,
  });

  return {
    ...request,
    input: {
      ...request.input,
      provider_config: {
        provider: providerConfig.provider,
        model: providerConfig.model,
        api_key: providerConfig.apiKey,
        base_url: providerConfig.baseUrl,
        temperature: providerConfig.temperature,
        max_tokens: providerConfig.maxTokens,
      },
    },
  };
}

async function withGoalAgentReadOnlyContext(
  req: AgentStartRunRequest,
  identityId: string,
  knowledgeSourcePort?: IKnowledgeSourcePort,
  analyticsReadPort?: IAnalyticsReadPort,
): Promise<AgentStartRunRequest> {
  if (req.agentType !== 'goal.create') {
    return req;
  }

  const query = getGoalAgentContextQuery(req.input);
  if (!query) {
    return req;
  }

  const inputPatch: Record<string, unknown> = {};
  const contextErrors: Array<{ tool: string; message: string }> = [];

  if (knowledgeSourcePort && !req.input['related_resources']) {
    try {
      const resources = await knowledgeSourcePort.listRelevantNotes(identityId, query, 6);
      inputPatch['related_resources'] = resources.map(toAIServiceKnowledgeNote);
    } catch (err) {
      contextErrors.push({
        tool: 'search_knowledge',
        message: errorMessage(err),
      });
    }
  }

  if (analyticsReadPort && !req.input['analytics_context']) {
    try {
      inputPatch['analytics_context'] = toAIServiceAnalyticsContext(
        await analyticsReadPort.buildContext(identityId, query),
      );
    } catch (err) {
      contextErrors.push({
        tool: 'fetch_goal_stats',
        message: errorMessage(err),
      });
    }
  }

  if (contextErrors.length) {
    inputPatch['context_errors'] = contextErrors;
  }

  return Object.keys(inputPatch).length
    ? {
        ...req,
        input: {
          ...req.input,
          ...inputPatch,
        },
      }
    : req;
}

async function withKnowledgeQaAnswer(
  req: AgentStartRunRequest,
  identityId: string,
  knowledgeQueryUseCase?: QueryKnowledgeUseCase,
): Promise<Result<AgentStartRunRequest>> {
  if (req.agentType !== 'knowledge.qa' || !knowledgeQueryUseCase) {
    return ok(req);
  }

  if (getStringInput(req.input, 'answer') || Array.isArray(req.input['citations'])) {
    return ok(req);
  }

  const query = getKnowledgeQaQuestion(req.input);
  if (!query) {
    return ok(req);
  }

  const providerId = getStringInput(req.input, 'provider_id');
  const maxResources = getPositiveIntegerInput(req.input, 'maxResources');
  const queryRequest: QueryKnowledgeReq = {
    query,
    ...(providerId ? { providerId: providerId as QueryKnowledgeReq['providerId'] } : {}),
    ...(maxResources ? { maxResources } : {}),
  };
  const queryResult = await knowledgeQueryUseCase.execute(queryRequest, { identityId });
  if (!queryResult.ok) {
    return queryResult;
  }

  return ok({
    ...req,
    input: {
      ...req.input,
      ...(!getStringInput(req.input, 'question') && !getStringInput(req.input, 'message')
        ? { question: query }
        : {}),
      answer: queryResult.data.answer,
      citations: toAgentCitations(queryResult.data.citations),
      provider_id: queryResult.data.providerId,
      token_usage: queryResult.data.tokenUsage,
      processing_time_ms: queryResult.data.processingTimeMs,
      matched_resource_count: queryResult.data.matchedResourceCount,
    },
  });
}

const GoalAgentExecutionRequiredInterruptSchema = z.object({
  type: z.literal('execution.required'),
  runId: z.string().min(1),
  threadId: z.string().min(1),
  agentType: z.literal('goal.create'),
  request: z.object({
    idea: z.string().min(1),
    category: z.string().min(1).nullish(),
    timeframe: z.string().min(1).nullish(),
  }),
  approvedActions: z.array(AgentActionSchema),
  artifacts: z.array(AgentArtifactSchema),
});

type GoalAgentExecutionRequiredInterrupt = z.infer<
  typeof GoalAgentExecutionRequiredInterruptSchema
>;

type SupportedGoalAgentAutomationTool = Extract<GoalAutomationAction['tool'], AgentAction['tool']>;

const GOAL_AUTOMATION_ACTION_TOOLS = new Set<SupportedGoalAgentAutomationTool>([
  'create_goal',
  'create_key_result',
  'create_task_template',
  'create_reminder',
]);

function findGoalAgentExecutionInterrupt(
  result: AgentRunResult,
): GoalAgentExecutionRequiredInterrupt | null {
  if (result.run.status !== 'waiting_execution') {
    return null;
  }

  for (const interrupt of result.interrupts) {
    const parsed = GoalAgentExecutionRequiredInterruptSchema.safeParse(interrupt);
    if (parsed.success) {
      return parsed.data;
    }
  }

  return null;
}

function toGoalAutomationActions(actions: AgentAction[]): {
  executable: GoalAutomationAction[];
  unsupported: AgentExecutedAction[];
} {
  const executable: GoalAutomationAction[] = [];
  const unsupported: AgentExecutedAction[] = [];

  for (const action of actions) {
    if (GOAL_AUTOMATION_ACTION_TOOLS.has(action.tool as SupportedGoalAgentAutomationTool)) {
      executable.push({
        tool: action.tool as SupportedGoalAgentAutomationTool,
        index: action.index,
        rationale: action.rationale ?? undefined,
      });
      continue;
    }

    unsupported.push({
      tool: action.tool,
      status: 'failed',
      message: `Agent action "${action.tool}" is not supported by the TS goal automation executor yet.`,
    });
  }

  return { executable, unsupported };
}

function isSupportedGoalAgentAutomationTool(
  tool: GoalAutomationExecutedAction['tool'],
): tool is SupportedGoalAgentAutomationTool {
  return GOAL_AUTOMATION_ACTION_TOOLS.has(tool as SupportedGoalAgentAutomationTool);
}

function toAgentExecutedActions(actions: GoalAutomationExecutedAction[]): AgentExecutedAction[] {
  return actions.map((action) => ({
    tool: isSupportedGoalAgentAutomationTool(action.tool) ? action.tool : 'create_goal',
    status: action.status,
    entityId: action.entityId ?? null,
    message: isSupportedGoalAgentAutomationTool(action.tool)
      ? action.message
      : `Unsupported automation executor result for "${action.tool}": ${action.message}`,
  }));
}

function buildGoalAutomationPlan(interrupt: GoalAgentExecutionRequiredInterrupt) {
  const goalArtifact = interrupt.artifacts.find((artifact) => artifact.kind === 'goal_draft');
  if (!goalArtifact) {
    throw new Error('Goal Agent execution requires a goal_draft artifact.');
  }

  return GoalAutomationPlanSchema.parse({
    goal: goalArtifact.data,
    keyResults: Array.isArray(goalArtifact.data['keyResults'])
      ? goalArtifact.data['keyResults']
      : undefined,
    taskTemplates: Array.isArray(goalArtifact.data['taskTemplates'])
      ? goalArtifact.data['taskTemplates']
      : undefined,
    reminders: Array.isArray(goalArtifact.data['reminders'])
      ? goalArtifact.data['reminders']
      : undefined,
  });
}

async function executeGoalAgentInterrupt(
  interrupt: GoalAgentExecutionRequiredInterrupt,
  identityId: string,
  automationToolExecutorPort: IAIAutomationToolExecutorPort,
): Promise<AgentExecutedAction[]> {
  const { executable, unsupported } = toGoalAutomationActions(interrupt.approvedActions);
  const executed = executable.length
    ? await automationToolExecutorPort.executeGoalAutomation({
        identityId,
        request: {
          idea: interrupt.request.idea,
          category: interrupt.request.category ?? undefined,
          timeframe: interrupt.request.timeframe ?? undefined,
        },
        plan: buildGoalAutomationPlan(interrupt),
        actions: executable,
      })
    : [];

  return [...toAgentExecutedActions(executed), ...unsupported];
}

export function createKnowledgeNoteRuntimeService(
  service: ManageAIKnowledgeNoteUseCase | null,
): AIKnowledgeNoteService {
  return {
    isAvailable: Boolean(service),
    createKnowledgeNote(
      req: CreateKnowledgeNoteReq,
      cx: ExecutionContext,
    ): Promise<Result<CreateKnowledgeNoteRes>> {
      if (!service) {
        return unavailableResult(
          'Knowledge-note persistence was not provided to createAIModule. 知识笔记持久化端口未注入到 createAIModule。',
        );
      }

      return service.createKnowledgeNote(req, cx);
    },
  };
}

export function createKnowledgeQueryRuntimeServices(
  services: {
    query: QueryKnowledgeUseCase;
    expand: ExpandKnowledgeUseCase;
    reindex: ReindexKnowledgeUseCase;
  } | null,
  capabilities: AICapabilities,
): AIKnowledgeQueryServices {
  return {
    isAvailable: Boolean(services),
    query: {
      execute(req: QueryKnowledgeReq, cx: ExecutionContext): Promise<Result<QueryKnowledgeRes>> {
        return services
          ? services.query.execute(req, cx)
          : unavailableResult(
              buildCapabilityUnavailableMessage('Knowledge retrieval', capabilities),
            );
      },
    },
    expand: {
      execute(req: ExpandKnowledgeReq, cx: ExecutionContext): Promise<Result<ExpandKnowledgeRes>> {
        return services
          ? services.expand.execute(req, cx)
          : unavailableResult(
              buildCapabilityUnavailableMessage('Knowledge expansion', capabilities),
            );
      },
    },
    reindex: {
      execute(
        req: ReindexKnowledgeReq,
        cx: ExecutionContext,
      ): Promise<Result<ReindexKnowledgeRes>> {
        return services
          ? services.reindex.execute(req, cx)
          : unavailableResult(
              buildCapabilityUnavailableMessage('Knowledge reindexing', capabilities),
            );
      },
    },
  };
}

export function createAnalyticsRuntimeService(
  service: QueryAIAnalyticsUseCase | null,
  capabilities: AICapabilities,
): AIAnalyticsQueryService {
  return {
    isAvailable: Boolean(service),
    queryAnalytics(
      req: QueryAnalyticsReq,
      cx: ExecutionContext,
    ): Promise<Result<QueryAnalyticsRes>> {
      return service
        ? service.queryAnalytics(req, cx)
        : unavailableResult(buildCapabilityUnavailableMessage('Analytics query', capabilities));
    },
  };
}

export function createEvaluationRuntimeService(
  service: ManageAIEvaluationReportUseCase | null,
): AIEvaluationReportService {
  return {
    isAvailable: Boolean(service),
    getOverview(req: GetAIEvaluationOverviewReq = {}): Promise<Result<GetAIEvaluationOverviewRes>> {
      return service
        ? service.getOverview(req)
        : unavailableResult('AI evaluation report access is unavailable.');
    },
  };
}

export function createAgentRuntimeService(
  port: IAgentRuntimePort | undefined,
  automationToolExecutorPort?: IAIAutomationToolExecutorPort,
  providerConfigRepository?: IAIProviderConfigRepository,
  knowledgeSourcePort?: IKnowledgeSourcePort,
  analyticsReadPort?: IAnalyticsReadPort,
  knowledgeQueryUseCase?: QueryKnowledgeUseCase,
  knowledgeNoteUseCase?: ManageAIKnowledgeNoteUseCase | null,
  executionLogPort?: IAIExecutionLogPort,
  /** Residual 324: shared Host CapabilityResolver for start-time fail-closed gating. */
  capabilityResolver?: CapabilityResolver,
): AIAgentRuntimeService {
  const isAvailable = Boolean(port);
  // Residual 435: process-local task.create run registry for get/list/events restore.
  const taskCreateRunStore = getDefaultHostTaskCreateRunStore();

  async function resolveExecutionInterrupt(
    result: AgentRunResult,
    input: {
      runId: string;
      identityId: string;
      requestId?: string;
      signal?: AbortSignal;
    },
  ): Promise<AgentRunResult> {
    const interrupt = findGoalAgentExecutionInterrupt(result);
    if (!interrupt) {
      return result;
    }
    if (!port || !automationToolExecutorPort) {
      throw new Error('Agent runtime execution requires the TS automation executor port.');
    }

    const executedActions = await executeGoalAgentInterrupt(
      interrupt,
      input.identityId,
      automationToolExecutorPort,
    );

    return port.resumeRun({
      identityId: input.identityId,
      runId: input.runId,
      payload: {
        userDecision: 'confirm',
        executedActions,
      },
      requestId: input.requestId,
      signal: input.signal,
    });
  }

  const KnowledgeGenerateExecutionRequiredInterruptSchema = z.object({
    type: z.literal('execution.required'),
    runId: z.string().min(1),
    threadId: z.string().min(1),
    agentType: z.literal('knowledge.generate'),
    approvedActions: z.array(AgentActionSchema),
    artifacts: z.array(AgentArtifactSchema),
  });

  function findKnowledgeGenerateExecutionInterrupt(result: AgentRunResult) {
    if (result.run.status !== 'waiting_execution') {
      return null;
    }

    for (const interrupt of result.interrupts) {
      const parsed = KnowledgeGenerateExecutionRequiredInterruptSchema.safeParse(interrupt);
      if (parsed.success) {
        return parsed.data;
      }
    }

    return null;
  }

  function getPayloadString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  function getKnowledgeNoteDraftArtifactMarkdown(
    artifacts: GoalAgentExecutionRequiredInterrupt['artifacts'],
    contentArtifactId?: string,
  ): string | undefined {
    const artifact = artifacts.find(
      (item) =>
        item.kind === 'knowledge_note_draft' &&
        (!contentArtifactId || item.artifactId === contentArtifactId),
    );
    const value = artifact?.data['markdown'];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  async function executeKnowledgeGenerateInterrupt(
    interrupt: z.infer<typeof KnowledgeGenerateExecutionRequiredInterruptSchema>,
    identityId: string,
    requestId?: string,
  ): Promise<AgentExecutedAction[]> {
    if (!knowledgeNoteUseCase) {
      throw new Error('Knowledge Generation execution requires the knowledge-note use case.');
    }

    const executedActions: AgentExecutedAction[] = [];
    for (const action of interrupt.approvedActions) {
      if (action.tool !== 'create_knowledge_note') {
        executedActions.push({
          tool: action.tool,
          status: 'failed',
          message: `Agent action "${action.tool}" is not supported by the Knowledge Generation executor yet.`,
        });
        continue;
      }

      const contentArtifactId = getPayloadString(action.payload, 'contentArtifactId');
      const confirmationRequestId =
        requestId ?? `${interrupt.runId}:knowledge-note:${action.index ?? 0}`;
      const parsed = CreateKnowledgeNoteSchema.safeParse({
        topic: getPayloadString(action.payload, 'topic'),
        title: getPayloadString(action.payload, 'title'),
        contentMarkdown:
          getPayloadString(action.payload, 'contentMarkdown') ??
          getKnowledgeNoteDraftArtifactMarkdown(interrupt.artifacts, contentArtifactId),
        targetSubpath: getPayloadString(action.payload, 'targetSubpath'),
        connectionId: getPayloadString(action.payload, 'connectionId'),
        providerId: getPayloadString(action.payload, 'providerId'),
        model: getPayloadString(action.payload, 'model'),
        confirmation: {
          proposalId: `${interrupt.runId}:knowledge-note:${contentArtifactId ?? action.index ?? 0}`,
          revision: 1,
          requestId: confirmationRequestId,
        },
      });

      if (!parsed.success) {
        executedActions.push({
          tool: action.tool,
          status: 'failed',
          message: `Knowledge note action payload is invalid: ${parsed.error.issues[0]?.message ?? 'validation failed'}`,
        });
        continue;
      }

      const result = await knowledgeNoteUseCase.createKnowledgeNote(parsed.data, { identityId });
      if (!result.ok) {
        executedActions.push({
          tool: action.tool,
          status: 'failed',
          message: result.error.message,
        });
        continue;
      }

      executedActions.push({
        tool: action.tool,
        status: 'executed',
        entityId: String(result.data.note.id),
        message: `Saved knowledge note to ${result.data.resolvedPath}.`,
        data: {
          resolvedPath: result.data.resolvedPath,
          indexStatus: result.data.indexStatus,
          note: {
            id: String(result.data.note.id),
            name: result.data.note.name,
            content: result.data.note.content,
          },
        },
      });
    }

    return executedActions;
  }

  async function resolveKnowledgeGenerateExecutionInterrupt(
    result: AgentRunResult,
    input: {
      runId: string;
      identityId: string;
      requestId?: string;
      signal?: AbortSignal;
    },
  ): Promise<AgentRunResult> {
    const interrupt = findKnowledgeGenerateExecutionInterrupt(result);
    if (!interrupt) {
      return result;
    }
    if (!port) {
      throw new Error('Agent runtime execution requires the Agent runtime port.');
    }

    const executedActions = await executeKnowledgeGenerateInterrupt(
      interrupt,
      input.identityId,
      input.requestId,
    );
    return port.resumeRun({
      identityId: input.identityId,
      runId: input.runId,
      payload: {
        userDecision: 'confirm',
        executedActions,
      },
      requestId: input.requestId,
      signal: input.signal,
    });
  }

  async function resolveRuntimeExecutionInterrupt(
    result: AgentRunResult,
    input: {
      runId: string;
      identityId: string;
      requestId?: string;
      signal?: AbortSignal;
    },
  ): Promise<AgentRunResult> {
    return resolveKnowledgeGenerateExecutionInterrupt(
      await resolveExecutionInterrupt(result, input),
      input,
    );
  }

  function hasResolvableExecutionInterrupt(result: AgentRunResult): boolean {
    return Boolean(
      findGoalAgentExecutionInterrupt(result) || findKnowledgeGenerateExecutionInterrupt(result),
    );
  }

  async function recordAgentRuntimeExecution(input: {
    operation: 'start' | 'resume';
    identityId: string;
    requestId?: string;
    startedAt: number;
    request: AgentStartRunRequest | { runId: string; payload: AgentResumePayload };
    result?: AgentRunResult;
    error?: unknown;
  }): Promise<void> {
    if (!executionLogPort) {
      return;
    }

    const tokenUsage = input.result
      ? toAgentRuntimeTokenUsage(input.result.state.usage)
      : undefined;
    const timings = input.result ? summarizeAgentRuntimeTimings(input.result) : undefined;
    const startRequest =
      input.operation === 'start' ? (input.request as AgentStartRunRequest) : undefined;
    const providerMetadata = startRequest
      ? getAgentRuntimeProviderMetadata(startRequest.input)
      : {};

    try {
      await executionLogPort.record(
        withAICostEstimate({
          identityId: input.identityId,
          taskType: toAgentRuntimeTaskType(input.operation),
          status: input.error ? 'FAILED' : 'COMPLETED',
          requestId: input.requestId,
          ...providerMetadata,
          errorCategory: input.error ? classifyAIExecutionError(input.error) : undefined,
          input:
            input.operation === 'start'
              ? {
                  operation: input.operation,
                  runId: startRequest?.runId,
                  threadId: startRequest?.threadId,
                  conversationId: startRequest?.conversationId ?? null,
                  agentType: startRequest?.agentType,
                }
              : {
                  operation: input.operation,
                  runId: (input.request as { runId: string }).runId,
                  userDecision: (input.request as { payload: AgentResumePayload }).payload
                    .userDecision,
                },
          result: input.result
            ? {
                runId: input.result.run.runId,
                threadId: input.result.run.threadId,
                conversationId: input.result.run.conversationId ?? null,
                agentType: input.result.run.agentType,
                status: input.result.run.status,
                stage: input.result.state.stage,
                eventCount: input.result.events.length,
                artifactCount: input.result.state.artifacts.length,
                citationCount: input.result.state.citations.length,
                pendingActionCount: input.result.state.pendingActions.length,
                approvedActionCount: input.result.state.approvedActions.length,
                executedActionCount: input.result.state.executedActions.length,
                interruptCount: input.result.interrupts.length,
                ...(timings && timings.nodeTimings.length
                  ? { nodeTimings: timings.nodeTimings }
                  : {}),
                ...(timings && timings.toolTimings.length
                  ? { toolTimings: timings.toolTimings }
                  : {}),
              }
            : undefined,
          error: input.error ? errorMessage(input.error) : undefined,
          tokenUsage,
          processingMs: Date.now() - input.startedAt,
        }),
      );
    } catch (err) {
      logger.warn('Failed to record Agent runtime execution log', {
        error: err,
        identityId: input.identityId,
        taskType: toAgentRuntimeTaskType(input.operation),
      });
    }
  }

  return {
    isAvailable,
    async startRun(
      req: AgentStartRunRequest,
      cx: ExecutionContext,
      requestId?: string,
      signal?: AbortSignal,
    ): Promise<Result<AgentRunResult>> {
      if (!port) {
        return unavailableResult('Agent runtime is unavailable in the current AI runtime.');
      }

      // Residual 324: use the module CapabilityResolver when wired; fall back to
      // rebuilding offers only for legacy/test call sites without a resolver.
      const capabilityGate = assertAgentStartCapabilityPlan(
        req.agentType,
        capabilityResolver ??
          buildAgentRuntimeCapabilityOffers({
            knowledgeNoteUseCase,
            automationToolExecutorPort,
          }),
      );
      if (!capabilityGate.ok) {
        return capabilityGate;
      }

      const requestWithProvider = await withAgentProviderConfig(
        req,
        cx.identityId,
        providerConfigRepository,
      );
      const requestWithContext = await withGoalAgentReadOnlyContext(
        requestWithProvider,
        cx.identityId,
        knowledgeSourcePort,
        analyticsReadPort,
      );
      const requestWithKnowledge = await withKnowledgeQaAnswer(
        requestWithContext,
        cx.identityId,
        knowledgeQueryUseCase,
      );
      if (!requestWithKnowledge.ok) {
        return requestWithKnowledge;
      }

      // Residual 431: task.create Host start foundation (TS runtime, no LangGraph yet).
      // Produces waiting_approval + create_task_template for Host lane / client settle.
      if (requestWithKnowledge.data.agentType === 'task.create') {
        // Residual 499: agentType already gated here; builder also fail-closes (no silent retype).
        // Residual 493: ExecutionContext identity fail-closed (builder also throws; no silent empty).
        const taskCreateIdentityId = resolveTaskCreateIdentityId(cx.identityId);
        if (!taskCreateIdentityId) {
          return error(
            'VALIDATION_ERROR',
            HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE,
          );
        }
        // Residual 497: process-local runId fail-closed (builder also throws; no silent empty).
        if (!resolveTaskCreateRunId(requestWithKnowledge.data.runId)) {
          return error(
            'VALIDATION_ERROR',
            HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE,
          );
        }
        // Residual 479: title fail-closed (builder also throws; no silent 'New task').
        if (!resolveTaskCreateTitle(requestWithKnowledge.data.input)) {
          return error(
            'VALIDATION_ERROR',
            HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE,
          );
        }
        // Residual 461/483: session-bound product path — conversationId required (builder also throws).
        if (!resolveTaskCreateConversationId(requestWithKnowledge.data.conversationId)) {
          return error(
            'VALIDATION_ERROR',
            HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE,
          );
        }
        // Residual 485: process-local thread binding — blank/whitespace threadId fail-closed.
        if (!resolveTaskCreateThreadId(requestWithKnowledge.data.threadId)) {
          return error(
            'VALIDATION_ERROR',
            HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE,
          );
        }
        const startedAt = Date.now();
        try {
          const taskResult = buildHostTaskCreateStartResult({
            request: requestWithKnowledge.data,
            identityId: taskCreateIdentityId,
          });
          const ownership = ensureAgentRunOwnedByIdentity(taskResult, taskCreateIdentityId);
          if (!ownership.ok) {
            return ownership;
          }
          await recordAgentRuntimeExecution({
            operation: 'start',
            identityId: taskCreateIdentityId,
            requestId,
            startedAt,
            request: requestWithKnowledge.data,
            result: taskResult,
          });
          // Residual 435: register for process-local getRun/listRuns restore.
          // Residual 451: upsert fails closed on foreign runId identity takeover.
          taskCreateRunStore.upsert(taskResult);
          return ownership;
        } catch (err) {
          await recordAgentRuntimeExecution({
            operation: 'start',
            identityId: taskCreateIdentityId,
            requestId,
            startedAt,
            request: requestWithKnowledge.data,
            error: err,
          });
          if (err instanceof Error) {
            if (err.message.includes(HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE)) {
              return error('FORBIDDEN', err.message);
            }
            // Residual 495: non-task.create store upsert is fail-closed validation.
            if (err.message.includes(HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE)) {
              return error('VALIDATION_ERROR', err.message);
            }
            // Residual 457: conversation/thread rebinding is fail-closed (validation, not auth).
            if (
              err.message.includes(HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE)
            ) {
              return error('VALIDATION_ERROR', err.message);
            }
            // Residual 479/483/485/493/497/499: builder binding/agentType fail-closed maps to validation.
            if (
              err.message.includes(HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE)
            ) {
              return error('VALIDATION_ERROR', err.message);
            }
          }
          throw err;
        }
      }

      const startedAt = Date.now();
      try {
        const result = await port.startRun({
          request: requestWithKnowledge.data,
          requestId,
          signal,
        });
        // Ownership must fail closed before host side-effects (residual 102).
        const ownership = ensureAgentRunOwnedByIdentity(result, cx.identityId);
        if (!ownership.ok) {
          return ownership;
        }
        const resolvedResult = await resolveRuntimeExecutionInterrupt(result, {
          runId: req.runId,
          identityId: cx.identityId,
          requestId,
          signal,
        });
        await recordAgentRuntimeExecution({
          operation: 'start',
          identityId: cx.identityId,
          requestId,
          startedAt,
          request: requestWithKnowledge.data,
          result: resolvedResult,
        });
        return ensureAgentRunOwnedByIdentity(resolvedResult, cx.identityId);
      } catch (err) {
        await recordAgentRuntimeExecution({
          operation: 'start',
          identityId: cx.identityId,
          requestId,
          startedAt,
          request: requestWithKnowledge.data,
          error: err,
        });
        throw err;
      }
    },
    async resumeRun(
      runId: string,
      payload: AgentResumePayload,
      cx: ExecutionContext,
      requestId?: string,
      signal?: AbortSignal,
    ): Promise<Result<AgentRunResult>> {
      const startedAt = Date.now();
      const request = { runId, payload };

      // Residual 437: process-local task.create cancel/complete settle (no Python port).
      const storedTask = taskCreateRunStore.get(runId, cx.identityId);
      if (storedTask) {
        try {
          const resumed = buildHostTaskCreateResumeResult({
            current: storedTask,
            payload,
          });
          const ownership = ensureAgentRunOwnedByIdentity(resumed, cx.identityId);
          if (!ownership.ok) {
            return ownership;
          }
          taskCreateRunStore.upsert(resumed);
          await recordAgentRuntimeExecution({
            operation: 'resume',
            identityId: cx.identityId,
            requestId,
            startedAt,
            request,
            result: resumed,
          });
          return ownership;
        } catch (err) {
          await recordAgentRuntimeExecution({
            operation: 'resume',
            identityId: cx.identityId,
            requestId,
            startedAt,
            request,
            error: err,
          });
          if (
            err instanceof Error &&
            (err.message.includes(HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE) ||
              err.message.includes(HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE) ||
              err.message.includes('Host task.create'))
          ) {
            return error('VALIDATION_ERROR', err.message);
          }
          throw err;
        }
      }

      if (!port) {
        return unavailableResult('Agent runtime is unavailable in the current AI runtime.');
      }

      try {
        if (
          payload.userDecision === 'confirm' &&
          payload.executedActions == null &&
          payload.approvedActions == null &&
          payload.editedArtifacts == null &&
          payload.approvedPlan == null
        ) {
          const snapshot = await port.getRun({
            identityId: cx.identityId,
            runId,
            requestId,
            signal,
          });
          // Ownership must fail closed before host side-effects (residual 102).
          const snapshotOwnership = ensureAgentRunOwnedByIdentity(snapshot, cx.identityId);
          if (!snapshotOwnership.ok) {
            return snapshotOwnership;
          }
          if (hasResolvableExecutionInterrupt(snapshot)) {
            const resolvedSnapshot = await resolveRuntimeExecutionInterrupt(snapshot, {
              runId,
              identityId: cx.identityId,
              requestId,
              signal,
            });
            await recordAgentRuntimeExecution({
              operation: 'resume',
              identityId: cx.identityId,
              requestId,
              startedAt,
              request,
              result: resolvedSnapshot,
            });
            return ensureAgentRunOwnedByIdentity(resolvedSnapshot, cx.identityId);
          }
        }

        const result = await port.resumeRun({
          identityId: cx.identityId,
          runId,
          payload,
          requestId,
          signal,
        });
        // Ownership must fail closed before host side-effects (residual 102).
        const ownership = ensureAgentRunOwnedByIdentity(result, cx.identityId);
        if (!ownership.ok) {
          return ownership;
        }
        // Defense-in-depth: side-effect execution only follows an explicit confirm.
        // cancel/clarify/edit/regenerate must not auto-run approvedActions even if the
        // upstream graph still reports execution.required.
        const resolvedResult =
          payload.userDecision === 'confirm'
            ? await resolveRuntimeExecutionInterrupt(result, {
                runId,
                identityId: cx.identityId,
                requestId,
                signal,
              })
            : result;
        await recordAgentRuntimeExecution({
          operation: 'resume',
          identityId: cx.identityId,
          requestId,
          startedAt,
          request,
          result: resolvedResult,
        });
        return ensureAgentRunOwnedByIdentity(resolvedResult, cx.identityId);
      } catch (err) {
        await recordAgentRuntimeExecution({
          operation: 'resume',
          identityId: cx.identityId,
          requestId,
          startedAt,
          request,
          error: err,
        });
        throw err;
      }
    },
    async getRun(
      runId: string,
      cx: ExecutionContext,
      requestId?: string,
      signal?: AbortSignal,
    ): Promise<Result<AgentRunResult>> {
      // Residual 435: process-local task.create store before remote port lookup.
      const stored = taskCreateRunStore.get(runId, cx.identityId);
      if (stored) {
        return ensureAgentRunOwnedByIdentity(stored, cx.identityId);
      }

      if (!port) {
        return unavailableResult('Agent runtime is unavailable in the current AI runtime.');
      }

      const result = await port.getRun({
        identityId: cx.identityId,
        runId,
        requestId,
        signal,
      });
      return ensureAgentRunOwnedByIdentity(result, cx.identityId);
    },
    async listRuns(
      params: AgentRunListParams,
      cx: ExecutionContext,
      requestId?: string,
      signal?: AbortSignal,
    ): Promise<Result<AgentRun[]>> {
      // Residual 435: load unscoped-by-limit local runs, merge, then apply limit once.
      const { limit: listLimit, ...listFilters } = params;
      const localTaskRuns = taskCreateRunStore.list(cx.identityId, listFilters);

      if (!port) {
        if (localTaskRuns.length > 0) {
          const limitedLocal =
            typeof listLimit === 'number' && listLimit > 0
              ? localTaskRuns.slice(0, listLimit)
              : localTaskRuns;
          return ok(limitedLocal);
        }
        return unavailableResult('Agent runtime is unavailable in the current AI runtime.');
      }

      const remoteRuns = await port.listRuns({
        ...listFilters,
        // Fetch a wider remote window when merging local task.create runs.
        ...(typeof listLimit === 'number' && listLimit > 0
          ? { limit: Math.max(listLimit, localTaskRuns.length + listLimit) }
          : {}),
        identityId: cx.identityId,
        requestId,
        signal,
      });
      const ownedRemote = remoteRuns.filter((run) => run.identityId === cx.identityId);
      // Residual 435: merge process-local task.create runs; local wins on runId clash.
      const byId = new Map<string, (typeof ownedRemote)[number]>();
      for (const run of ownedRemote) {
        byId.set(run.runId, run);
      }
      for (const run of localTaskRuns) {
        byId.set(run.runId, run);
      }
      const merged = [...byId.values()].sort((left, right) => right.updatedAt - left.updatedAt);
      const limited =
        typeof listLimit === 'number' && listLimit > 0
          ? merged.slice(0, listLimit)
          : merged;
      return ok(limited);
    },
    async getEvents(
      runId: string,
      cx: ExecutionContext,
      requestId?: string,
      signal?: AbortSignal,
    ): Promise<Result<AgentEvent[]>> {
      // Residual 435: process-local task.create events.
      const storedEvents = taskCreateRunStore.getEvents(runId, cx.identityId);
      if (storedEvents) {
        return ok(storedEvents);
      }

      if (!port) {
        return unavailableResult('Agent runtime is unavailable in the current AI runtime.');
      }

      // Ownership must fail closed before returning run events (residual 103).
      const snapshot = await port.getRun({
        identityId: cx.identityId,
        runId,
        requestId,
        signal,
      });
      const ownership = ensureAgentRunOwnedByIdentity(snapshot, cx.identityId);
      if (!ownership.ok) {
        return error(ownership.error.code, ownership.error.message);
      }

      const events = await port.getEvents({
        identityId: cx.identityId,
        runId,
        requestId,
        signal,
      });
      return ok(events);
    },
  };
}
