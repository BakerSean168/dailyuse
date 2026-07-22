import { describe, it, expect, vi } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { AgentRunResult } from '@dailyuse/contracts/ai';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../../../domain';
import type { AIModuleDependencies } from '../../ai.module';
import type {
  IAIChatExecutionPort,
  IAIAutomationToolExecutorPort,
  AIExecutionLogInput,
  IAnalyticsReadPort,
  IAIExecutionLogPort,
  IAgentRuntimePort,
  IGoalPlanningPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeQueryPort,
  IKnowledgeSourcePort,
  KnowledgeIndexedNote,
  KnowledgeQueryCitation,
  KnowledgeSourceNote,
} from '../../../application/ports';
import { createRemoteAIServiceRuntime } from '../remote-ai-service.runtime';

// ============================================================
// Helpers
// ============================================================

function createMockDeps(overrides?: Partial<AIModuleDependencies>): AIModuleDependencies {
  return {
    conversationRepository: createMockRepo<IAIConversationRepository>(),
    providerConfigRepository: createMockRepo<IAIProviderConfigRepository>(),
    ...overrides,
  };
}

function createMockChatPort(): IAIChatExecutionPort {
  return {
    complete: vi.fn(),
    stream: vi.fn(),
  } as any;
}

function createMockGoalPort(): IGoalPlanningPort {
  return { plan: vi.fn() } as any;
}

function createMockAgentRuntimePort(): IAgentRuntimePort {
  return {
    listRuns: vi.fn(),
    startRun: vi.fn(),
    resumeRun: vi.fn(),
    getRun: vi.fn(),
    getEvents: vi.fn(),
  };
}

function createMockExecutionLogPort(): IAIExecutionLogPort {
  return {
    record: vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {}),
  };
}

function createMockAutomationToolExecutorPort(): IAIAutomationToolExecutorPort {
  return {
    executeGoalAutomation: vi.fn(),
  };
}

function createProviderConfigRepositoryWithProvider(): IAIProviderConfigRepository {
  return {
    save: vi.fn(),
    findByIdForIdentity: vi.fn().mockResolvedValue({
      id: 'provider-1',
      identityId: 'identity-1',
      name: 'Main provider',
      providerType: 'openai_compatible',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'plain-secret',
      defaultModel: 'gpt-4o-mini',
      availableModels: [],
      isActive: true,
      isDefault: true,
      priority: 100,
      version: 1,
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
    }),
    findDefaultByIdentityId: vi.fn(),
    findByIdentityId: vi.fn(),
    delete: vi.fn(),
    clearDefaultForIdentity: vi.fn(),
  } as unknown as IAIProviderConfigRepository;
}

function createKnowledgeQueryBundleDeps(): {
  knowledgeSourcePort: IKnowledgeSourcePort;
  knowledgeIndexRepository: IKnowledgeIndexRepository;
  knowledgeIngestionPort: IKnowledgeIngestionPort;
  knowledgeQueryPort: IKnowledgeQueryPort;
  citation: KnowledgeQueryCitation;
} {
  const sourceNote: KnowledgeSourceNote = {
    identityId: 'identity-1',
    repositoryId: 'repo-1',
    resourceId: 'resource-1',
    resourcePath: 'docs/agent.md',
    title: 'Grounded Answer',
    mimeType: 'text/markdown',
    content: 'Knowledge answers should cite repository excerpts.',
    metadata: {},
  };
  const indexedResource: KnowledgeIndexedNote = {
    ...sourceNote,
    contentHash: 'hash-1',
    summary: 'Knowledge answers should cite repository excerpts.',
    keywords: ['knowledge', 'citations'],
    embedding: [],
    chunks: [
      {
        chunkIndex: 0,
        content: sourceNote.content,
        contentHash: 'hash-1',
        startOffset: 0,
        endOffset: sourceNote.content.length,
        headingPath: ['Grounded Answer'],
        keywords: ['knowledge', 'citations'],
        embedding: [],
      },
    ],
  };
  const citation: KnowledgeQueryCitation = {
    resourceId: 'resource-1',
    resourcePath: 'docs/agent.md',
    title: 'Grounded Answer',
    chunkIndex: 0,
    excerpt: 'Knowledge answers should cite repository excerpts.',
    score: 0.91,
  };

  return {
    knowledgeSourcePort: {
      listRelevantNotes: vi.fn().mockResolvedValue([sourceNote]),
      listIndexableNotes: vi.fn().mockResolvedValue([sourceNote]),
      getNoteById: vi.fn().mockResolvedValue(sourceNote),
    },
    knowledgeIndexRepository: {
      getDiagnostics: vi.fn(),
      findByNoteIds: vi.fn().mockResolvedValue([]),
      findRelevantNotes: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue(undefined),
      markRequested: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    },
    knowledgeIngestionPort: {
      indexNote: vi.fn().mockResolvedValue(indexedResource),
    },
    knowledgeQueryPort: {
      query: vi.fn().mockResolvedValue({
        answer: 'Use cited repository excerpts to answer the question.',
        citations: [citation],
        usage: {
          promptTokens: 20,
          completionTokens: 10,
          totalTokens: 30,
        },
      }),
      expand: vi.fn(),
    },
    citation,
  };
}

function createKnowledgeNotePersistencePort(): IKnowledgeNotePersistencePort {
  const note = {
    id: 'resource-note-1',
    repositoryScopeId: 'repo-1',
    name: 'Grounding-knowledge-answers.md',
    path: '/notes/notes/ai/Grounding-knowledge-answers.md',
    mimeType: 'text/markdown',
    size: 42,
    content: '# Grounding knowledge answers',
    createdAt: 1,
    updatedAt: 2,
  };

  return {
    createKnowledgeNote: vi.fn().mockResolvedValue({ note }),
  };
}

function createAgentRunResult(
  status: AgentRunResult['run']['status'],
  overrides?: Partial<AgentRunResult>,
): AgentRunResult {
  return {
    run: {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      identityId: 'identity-1',
      agentType: 'goal.create',
      status,
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      stage:
        status === 'waiting_approval'
          ? 'approval'
          : status === 'waiting_clarification'
            ? 'clarify'
            : status === 'completed'
              ? 'result'
              : 'execute',
      intent: 'goal-create',
      messages: [],
      artifacts: [],
      citations: [],
      retrievedContext: [],
      pendingActions: [],
      approvedActions: [],
      executedActions: [],
      usage: {},
      errors: [],
    },
    events: [],
    interrupts: [],
    ...overrides,
  };
}

const goalDraftArtifact = {
  artifactId: 'run-1:goal-draft',
  kind: 'goal_draft' as const,
  title: 'Ship the AI Agent workspace',
  updatedAt: 2,
  data: {
    title: 'Ship the AI Agent workspace',
    description: 'Ship the AI Agent workspace with approval gates.',
    motivation: 'Use a controlled Agent workflow.',
    category: 'work',
    suggestedStartDate: 1,
    suggestedEndDate: 2,
    importance: 'Important',
    tags: ['ai'],
    feasibilityAnalysis: 'Feasible with staged rollout.',
    aiInsights: 'Execute writes through TS.',
    keyResults: [
      {
        title: 'Complete weekly Agent progress updates',
        description: 'Record progress every week.',
        valueType: 'Incremental',
        calculationMethod: 'Sum',
        startValue: 0,
        currentValue: 0,
        targetValue: 12,
        unit: 'updates',
        weight: 3,
      },
      {
        title: 'Finish Agent delivery milestones',
        description: 'Finish the implementation milestones.',
        valueType: 'Incremental',
        calculationMethod: 'Sum',
        startValue: 0,
        currentValue: 0,
        targetValue: 3,
        unit: 'milestones',
        weight: 2,
      },
    ],
    taskTemplates: [
      {
        name: 'Weekly Agent focus block',
        description: 'Make and record progress on the first key result.',
        importance: 'Moderate',
        cadence: 'weekly',
      },
      {
        name: 'Agent milestone review',
        description: 'Review the next milestone and decide the next action.',
        importance: 'Moderate',
        cadence: 'weekly',
      },
    ],
    reminders: [
      {
        title: 'Weekly Agent review',
        description: 'Review goal progress and choose the next focus.',
        importance: 'Moderate',
        cadence: 'weekly',
      },
    ],
  },
};

const {
  keyResults: goalDraftKeyResults,
  taskTemplates: goalDraftTaskTemplates,
  reminders: goalDraftReminders,
  ...goalDraftForAutomationPlan
} = goalDraftArtifact.data;

const goalAgentApprovedActions = [
  { tool: 'create_goal' as const, index: 0, rationale: 'Create the goal first.' },
  {
    tool: 'create_key_result' as const,
    index: 0,
    rationale: 'Attach the weekly progress key result.',
  },
  {
    tool: 'create_key_result' as const,
    index: 1,
    rationale: 'Attach the milestone key result.',
  },
  {
    tool: 'create_task_template' as const,
    index: 0,
    rationale: 'Create the weekly focus task template.',
  },
  {
    tool: 'create_task_template' as const,
    index: 1,
    rationale: 'Create the milestone review task template.',
  },
  {
    tool: 'create_reminder' as const,
    index: 0,
    rationale: 'Schedule the weekly review reminder.',
  },
];

// ============================================================
// Tests
// ============================================================

describe('createRemoteAIServiceRuntime', () => {
  // --- Capabilities ---

  it('declares runtimeMode as remote-ai-service', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ chatExecutionPort: createMockChatPort() }),
    );
    expect(runtime.capabilities.runtimeMode).toBe('remote-ai-service');
  });

  it('always supports chat and goal generation', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.supportsChat).toBe(true);
    expect(runtime.capabilities.supportsGoalGeneration).toBe(true);
  });

  // --- Chat bundle: remote or fallback ---

  it('uses remote chat port when provided', () => {
    const remoteChat = createMockChatPort();
    const runtime = createRemoteAIServiceRuntime(createMockDeps({ chatExecutionPort: remoteChat }));
    expect(runtime.services.chatServices).toBeDefined();
    // The chat send use case should be constructed with the remote port
    // (we verify via capability consistency instead of private fields)
    expect(runtime.capabilities.supportsChat).toBe(true);
  });

  it('falls back to direct-provider chat when remote port not provided', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.services.chatServices).toBeDefined();
    expect(runtime.capabilities.supportsChat).toBe(true);
  });

  // --- Goal generation bundle: remote or fallback ---

  it('uses remote goal planning port when provided', () => {
    const remoteGoal = createMockGoalPort();
    const runtime = createRemoteAIServiceRuntime(createMockDeps({ goalPlanningPort: remoteGoal }));
    expect(runtime.services.goalGenerationService).toBeDefined();
    expect(runtime.capabilities.supportsGoalGeneration).toBe(true);
  });

  // --- Knowledge query bundle ---

  it('enables knowledge query when all 4 dependencies are present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { listRelevantNotes: vi.fn(), listIndexableNotes: vi.fn(), getNoteById: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeQuery).toBe(true);
    expect(runtime.capabilities.supportsKnowledgeReindex).toBe(true);
    expect(runtime.services.knowledgeQueryServices.isAvailable).toBe(true);
    expect(runtime.services.knowledgeIndexServices).not.toBeNull();
  });

  it('disables knowledge query when any dependency is missing', () => {
    // Missing knowledgeQueryPort
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { listRelevantNotes: vi.fn(), listIndexableNotes: vi.fn(), getNoteById: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeQuery).toBe(false);
    expect(runtime.services.knowledgeQueryServices.isAvailable).toBe(false);
    expect(runtime.services.knowledgeIndexServices).toBeNull();
  });

  // --- Analytics bundle ---

  it('enables analytics when both ports are present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        analyticsReadPort: { read: vi.fn() } as any,
        analyticsQueryPort: { query: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsAnalyticsQuery).toBe(true);
    expect(runtime.services.analyticsQueryService.isAvailable).toBe(true);
  });

  it('disables analytics when only one port is present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ analyticsReadPort: { read: vi.fn() } as any }),
    );
    expect(runtime.capabilities.supportsAnalyticsQuery).toBe(false);
    expect(runtime.services.analyticsQueryService.isAvailable).toBe(false);
  });

  // --- Goal automation bundle ---

  it('enables goal automation when both ports are present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        goalAutomationPlanningPort: { plan: vi.fn() } as any,
        automationToolExecutorPort: { execute: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsGoalAutomation).toBe(true);
  });

  it('disables goal automation when any port is missing', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ automationToolExecutorPort: { execute: vi.fn() } as any }),
    );
    expect(runtime.capabilities.supportsGoalAutomation).toBe(false);
  });

  // --- Agent runtime bundle ---

  it('enables agent runtime when runtime port is present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort: createMockAgentRuntimePort(),
      }),
    );
    expect(runtime.capabilities.supportsAgentRuntime).toBe(true);
    expect(runtime.services.agentRuntimeService.isAvailable).toBe(true);
  });

  it('disables agent runtime when runtime port is missing', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ automationToolExecutorPort: createMockAutomationToolExecutorPort() }),
    );
    expect(runtime.capabilities.supportsAgentRuntime).toBe(false);
    expect(runtime.services.agentRuntimeService.isAvailable).toBe(false);
  });

  it('lists Agent runs through the runtime port with authenticated identity', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    vi.mocked(agentRuntimePort.listRuns).mockResolvedValueOnce([
      createAgentRunResult('waiting_approval').run,
    ]);
    const runtime = createRemoteAIServiceRuntime(createMockDeps({ agentRuntimePort }));

    const result = await runtime.services.agentRuntimeService.listRuns(
      {
        conversationId: 'conversation-1',
        status: ['waiting_approval'],
        activeOnly: true,
        limit: 5,
      },
      { identityId: 'identity-1' },
      'request-list-runs',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data[0]?.runId).toBe('run-1');
    expect(agentRuntimePort.listRuns).toHaveBeenCalledWith({
      identityId: 'identity-1',
      conversationId: 'conversation-1',
      status: ['waiting_approval'],
      activeOnly: true,
      limit: 5,
      requestId: 'request-list-runs',
      signal: undefined,
    });
  });

  it('starts knowledge.qa Agent runs without the goal automation executor', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('completed', {
        run: {
          ...createAgentRunResult('completed').run,
          agentType: 'knowledge.qa',
        },
        state: {
          ...createAgentRunResult('completed').state,
          intent: 'knowledge-qa',
          artifacts: [
            {
              artifactId: 'run-1:knowledge-answer',
              kind: 'knowledge_answer',
              title: 'Grounded Answer',
              updatedAt: 2,
              data: {
                question: 'How should knowledge answers be grounded?',
                answer: 'Use cited repository excerpts to answer the question.',
                evidenceStatus: 'grounded',
              },
            },
          ],
          citations: [
            {
              resourceId: 'resource-1',
              resourcePath: 'docs/agent.md',
              title: 'Grounded Answer',
              chunkIndex: 0,
              excerpt: 'Knowledge answers should cite repository excerpts.',
              score: 0.91,
            },
          ],
        },
      }),
    );

    const runtime = createRemoteAIServiceRuntime(createMockDeps({ agentRuntimePort }));

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'knowledge.qa',
        input: { question: 'How should knowledge answers be grounded?' },
      },
      { identityId: 'identity-1' },
      'request-knowledge-qa',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.agentType).toBe('knowledge.qa');
    expect(result.ok && result.data.run.status).toBe('completed');
    expect(agentRuntimePort.startRun).toHaveBeenCalledWith({
      request: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'knowledge.qa',
        input: { question: 'How should knowledge answers be grounded?' },
      },
      requestId: 'request-knowledge-qa',
      signal: undefined,
    });
    expect(agentRuntimePort.resumeRun).not.toHaveBeenCalled();
  });

  it('records Agent runtime start execution logs with usage and timings', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const executionLogPort = createMockExecutionLogPort();
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('completed', {
        state: {
          ...createAgentRunResult('completed').state,
          usage: {
            promptTokens: 11,
            completionTokens: 7,
            totalTokens: 18,
          },
          artifacts: [goalDraftArtifact],
          pendingActions: [goalAgentApprovedActions[0]!],
        },
        events: [
          {
            eventId: 'event-node-1',
            runId: 'run-1',
            sequence: 0,
            type: 'node.completed',
            createdAt: 2,
            data: { node: 'draft_goal', durationMs: 80 },
          },
          {
            eventId: 'event-tool-1',
            runId: 'run-1',
            sequence: 1,
            type: 'tool.completed',
            createdAt: 3,
            data: { tool: 'search_knowledge', status: 'executed', durationMs: 210 },
          },
        ],
      }),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        executionLogPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: 'conversation-1',
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: { idea: 'Ship the AI Agent workspace' },
      },
      { identityId: 'identity-1' },
      'request-agent-start-log',
    );

    expect(result.ok).toBe(true);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        taskType: 'AGENT_RUNTIME_START',
        status: 'COMPLETED',
        requestId: 'request-agent-start-log',
        input: {
          operation: 'start',
          runId: 'run-1',
          threadId: 'thread-1',
          conversationId: 'conversation-1',
          agentType: 'goal.create',
        },
        result: expect.objectContaining({
          runId: 'run-1',
          threadId: 'thread-1',
          conversationId: null,
          agentType: 'goal.create',
          status: 'completed',
          stage: 'result',
          eventCount: 2,
          artifactCount: 1,
          pendingActionCount: 1,
          nodeTimings: [{ node: 'draft_goal', durationMs: 80 }],
          toolTimings: [{ tool: 'search_knowledge', status: 'executed', durationMs: 210 }],
        }),
        tokenUsage: {
          promptTokens: 11,
          completionTokens: 7,
          totalTokens: 18,
        },
        processingMs: expect.any(Number),
      }),
    );
  });

  it('keeps Agent runtime start results when execution log recording fails', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const executionLogPort = createMockExecutionLogPort();
    vi.mocked(executionLogPort.record).mockRejectedValueOnce(new Error('log store down'));
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(createAgentRunResult('completed'));

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        executionLogPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: { idea: 'Ship the AI Agent workspace' },
      },
      { identityId: 'identity-1' },
      'request-agent-log-failure',
    );

    expect(result.ok).toBe(true);
    expect(executionLogPort.record).toHaveBeenCalledTimes(1);
  });

  it('injects knowledge query results before starting knowledge.qa Agent runs', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const providerConfigRepository = createProviderConfigRepositoryWithProvider();
    const knowledgeDeps = createKnowledgeQueryBundleDeps();
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('completed', {
        run: {
          ...createAgentRunResult('completed').run,
          agentType: 'knowledge.qa',
        },
      }),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository,
        knowledgeSourcePort: knowledgeDeps.knowledgeSourcePort,
        knowledgeIndexRepository: knowledgeDeps.knowledgeIndexRepository,
        knowledgeIngestionPort: knowledgeDeps.knowledgeIngestionPort,
        knowledgeQueryPort: knowledgeDeps.knowledgeQueryPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'knowledge.qa',
        input: {
          question: 'How should knowledge answers be grounded?',
          provider_id: 'provider-1',
          maxResources: 8,
        },
      },
      { identityId: 'identity-1' },
      'request-knowledge-query',
    );

    expect(result.ok).toBe(true);
    expect(providerConfigRepository.findByIdForIdentity).toHaveBeenCalledWith(
      'identity-1',
      'provider-1',
    );
    expect(knowledgeDeps.knowledgeQueryPort.query).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        question: 'How should knowledge answers be grounded?',
        maxCitations: 3,
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(agentRuntimePort.startRun).toHaveBeenCalledWith({
      request: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'knowledge.qa',
        input: {
          question: 'How should knowledge answers be grounded?',
          provider_id: 'provider-1',
          maxResources: 8,
          answer: 'Use cited repository excerpts to answer the question.',
          citations: [knowledgeDeps.citation],
          token_usage: {
            promptTokens: 20,
            completionTokens: 10,
            totalTokens: 30,
          },
          processing_time_ms: expect.any(Number),
          matched_resource_count: 1,
        },
      },
      requestId: 'request-knowledge-query',
      signal: undefined,
    });
  });

  it('does not overwrite caller-supplied knowledge.qa answers', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeDeps = createKnowledgeQueryBundleDeps();
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('completed', {
        run: {
          ...createAgentRunResult('completed').run,
          agentType: 'knowledge.qa',
        },
      }),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
        knowledgeSourcePort: knowledgeDeps.knowledgeSourcePort,
        knowledgeIndexRepository: knowledgeDeps.knowledgeIndexRepository,
        knowledgeIngestionPort: knowledgeDeps.knowledgeIngestionPort,
        knowledgeQueryPort: knowledgeDeps.knowledgeQueryPort,
      }),
    );
    const suppliedCitation = {
      resourceId: 'supplied-resource',
      resourcePath: 'docs/supplied.md',
      title: 'Supplied',
      chunkIndex: 0,
      excerpt: 'Caller supplied citation.',
      score: 1,
    };

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'knowledge.qa',
        input: {
          question: 'How should knowledge answers be grounded?',
          answer: 'Caller supplied answer.',
          citations: [suppliedCitation],
        },
      },
      { identityId: 'identity-1' },
      'request-supplied-answer',
    );

    expect(result.ok).toBe(true);
    expect(knowledgeDeps.knowledgeQueryPort.query).not.toHaveBeenCalled();
    expect(agentRuntimePort.startRun).toHaveBeenCalledWith({
      request: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'knowledge.qa',
        input: {
          question: 'How should knowledge answers be grounded?',
          answer: 'Caller supplied answer.',
          citations: [suppliedCitation],
        },
      },
      requestId: 'request-supplied-answer',
      signal: undefined,
    });
  });

  it('executes knowledge.generate note-save actions through the TS knowledge note use case', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const executionLogPort = createMockExecutionLogPort();
    const providerConfigRepository = createProviderConfigRepositoryWithProvider();
    const knowledgeNotePersistence = createKnowledgeNotePersistencePort();
    const pendingAction = {
      tool: 'create_knowledge_note' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Persist the approved knowledge note draft.',
      payload: {
        topic: 'Grounding knowledge answers',
        title: 'Grounding knowledge answers',
        contentArtifactId: 'run-note-1:knowledge-note-draft',
        contentMarkdown: '# Grounding knowledge answers\n\nUse cited repository excerpts.',
        targetSubpath: 'notes/ai',
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        model: 'gpt-4o-mini',
      },
    };
    const noteDraftArtifact = {
      artifactId: 'run-note-1:knowledge-note-draft',
      kind: 'knowledge_note_draft' as const,
      title: 'Grounding knowledge answers',
      updatedAt: 2,
      data: {
        topic: 'Grounding knowledge answers',
        title: 'Grounding knowledge answers',
        markdown: '# Grounding knowledge answers\n\nUse cited repository excerpts.',
        targetSubpath: 'notes/ai',
      },
    };
    const waitingExecution = createAgentRunResult('waiting_execution', {
      run: {
        ...createAgentRunResult('waiting_execution').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('waiting_execution').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-note-1',
          threadId: 'thread-note-1',
          agentType: 'knowledge.generate',
          approvedActions: [pendingAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      run: {
        ...createAgentRunResult('completed').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('completed').state,
        intent: 'knowledge-generate',
        artifacts: [noteDraftArtifact],
        approvedActions: [pendingAction],
        executedActions: [
          {
            tool: 'create_knowledge_note',
            status: 'executed',
            entityId: 'resource-note-1',
            message: 'Saved knowledge note to /notes/notes/ai/Grounding-knowledge-answers.md.',
            data: {
              resolvedPath: '/notes/notes/ai/Grounding-knowledge-answers.md',
              indexStatus: 'pending',
              note: {
                id: 'resource-note-1',
                name: 'Grounding-knowledge-answers.md',
                content: '# Grounding knowledge answers',
              },
            },
          },
        ],
        usage: {
          promptTokens: 14,
          completionTokens: 6,
          totalTokens: 20,
        },
      },
      events: [
        {
          eventId: 'event-note-node-1',
          runId: 'run-note-1',
          sequence: 0,
          type: 'node.completed',
          createdAt: 2,
          data: { node: 'draft_note', durationMs: 64 },
        },
        {
          eventId: 'event-note-tool-1',
          runId: 'run-note-1',
          sequence: 1,
          type: 'tool.completed',
          createdAt: 3,
          data: {
            tool: 'create_knowledge_note',
            status: 'executed',
            durationMs: 180,
          },
        },
      ],
    });

    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(waitingExecution)
      .mockResolvedValueOnce(completed);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        executionLogPort,
        providerConfigRepository,
        knowledgeNotePersistence,
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-note-1',
      {
        userDecision: 'confirm',
        approvedActions: [pendingAction],
      },
      { identityId: 'identity-1' },
      'request-note-save',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.status).toBe('completed');
    expect(knowledgeNotePersistence.createKnowledgeNote).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        path: 'notes/ai/Grounding-knowledge-answers.md',
        proposalId: 'run-note-1:knowledge-note:run-note-1:knowledge-note-draft',
        proposalRevision: 1,
        requestId: 'request-note-save',
        fileName: 'Grounding-knowledge-answers.md',
        content: '# Grounding knowledge answers\n\nUse cited repository excerpts.',
      }),
    );
    expect(agentRuntimePort.resumeRun).toHaveBeenLastCalledWith({
      identityId: 'identity-1',
      runId: 'run-note-1',
      requestId: 'request-note-save',
      signal: undefined,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_knowledge_note',
            status: 'executed',
            entityId: 'resource-note-1',
            message: 'Saved knowledge note to notes/ai/Grounding-knowledge-answers.md.',
            data: {
              resolvedPath: 'notes/ai/Grounding-knowledge-answers.md',
              indexStatus: 'pending',
              note: {
                id: 'resource-note-1',
                name: 'Grounding-knowledge-answers.md',
                content: '# Grounding knowledge answers',
              },
            },
          },
        ],
      },
    });
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        taskType: 'AGENT_RUNTIME_RESUME',
        status: 'COMPLETED',
        requestId: 'request-note-save',
        input: {
          operation: 'resume',
          runId: 'run-note-1',
          userDecision: 'confirm',
        },
        result: expect.objectContaining({
          runId: 'run-1',
          agentType: 'knowledge.generate',
          status: 'completed',
          stage: 'result',
          eventCount: 2,
          artifactCount: 1,
          citationCount: 0,
          pendingActionCount: 0,
          approvedActionCount: 1,
          executedActionCount: 1,
          interruptCount: 0,
          nodeTimings: [{ node: 'draft_note', durationMs: 64 }],
          toolTimings: [{ tool: 'create_knowledge_note', status: 'executed', durationMs: 180 }],
        }),
        tokenUsage: {
          promptTokens: 14,
          completionTokens: 6,
          totalTokens: 20,
        },
        processingMs: expect.any(Number),
      }),
    );
  });

  it('does not persist knowledge notes when the user cancels, even if execution.required remains', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistencePort();
    const pendingAction = {
      tool: 'create_knowledge_note' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Persist the approved knowledge note draft.',
      payload: {
        topic: 'Grounding knowledge answers',
        title: 'Grounding knowledge answers',
        contentMarkdown: '# Grounding knowledge answers\n\nUse cited repository excerpts.',
        targetSubpath: 'notes/ai',
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        model: 'gpt-4o-mini',
      },
    };
    const noteDraftArtifact = {
      artifactId: 'run-note-1:knowledge-note-draft',
      kind: 'knowledge_note_draft' as const,
      title: 'Grounding knowledge answers',
      updatedAt: 2,
      data: {
        topic: 'Grounding knowledge answers',
        title: 'Grounding knowledge answers',
        markdown: '# Grounding knowledge answers\n\nUse cited repository excerpts.',
        targetSubpath: 'notes/ai',
      },
    };
    const waitingExecution = createAgentRunResult('waiting_execution', {
      run: {
        ...createAgentRunResult('waiting_execution').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('waiting_execution').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-note-1',
          threadId: 'thread-note-1',
          agentType: 'knowledge.generate',
          approvedActions: [pendingAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });

    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(waitingExecution);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-note-1',
      { userDecision: 'cancel' },
      { identityId: 'identity-1' },
      'request-note-cancel',
    );

    expect(result.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledTimes(1);
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-note-1',
      requestId: 'request-note-cancel',
      signal: undefined,
      payload: { userDecision: 'cancel' },
    });
  });

  it('rejects vault-escaping knowledge note paths without persisting', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistencePort();
    const pendingAction = {
      tool: 'create_knowledge_note' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Attempt to write outside the vault.',
      payload: {
        topic: 'Escaped note',
        title: 'Escaped note',
        contentMarkdown: '# Escaped\n\nShould never land on disk.',
        targetSubpath: '../secrets',
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        model: 'gpt-4o-mini',
      },
    };
    const noteDraftArtifact = {
      artifactId: 'run-note-escape:knowledge-note-draft',
      kind: 'knowledge_note_draft' as const,
      title: 'Escaped note',
      updatedAt: 2,
      data: {
        topic: 'Escaped note',
        title: 'Escaped note',
        markdown: '# Escaped\n\nShould never land on disk.',
        targetSubpath: '../secrets',
      },
    };
    const waitingExecution = createAgentRunResult('waiting_execution', {
      run: {
        ...createAgentRunResult('waiting_execution').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('waiting_execution').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-note-escape',
          threadId: 'thread-note-escape',
          agentType: 'knowledge.generate',
          approvedActions: [pendingAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      run: {
        ...createAgentRunResult('completed').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('completed').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
        executedActions: [
          {
            tool: 'create_knowledge_note',
            status: 'failed',
            message: 'Knowledge note action payload is invalid: Knowledge note path cannot contain . or .. segments',
          },
        ],
      },
    });

    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(waitingExecution)
      .mockResolvedValueOnce(completed);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-note-escape',
      {
        userDecision: 'confirm',
        approvedActions: [pendingAction],
      },
      { identityId: 'identity-1' },
      'request-note-escape',
    );

    expect(result.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: {
          userDecision: 'confirm',
          executedActions: [
            expect.objectContaining({
              tool: 'create_knowledge_note',
              status: 'failed',
              message: expect.stringMatching(/vault-relative|\. or \.\.|invalid/i),
            }),
          ],
        },
      }),
    );
  });

  it('does not execute cross-capability tools through the knowledge generation executor', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistencePort();
    // Schema-valid Agent tools that are not create_knowledge_note must fail closed.
    const pendingAction = {
      tool: 'create_goal' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Attempt to expand knowledge agent into goal mutation capability.',
      payload: {
        title: 'Should not create a goal from knowledge.generate',
      },
    };
    const waitingExecution = createAgentRunResult('waiting_execution', {
      run: {
        ...createAgentRunResult('waiting_execution').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('waiting_execution').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-note-cross-cap',
          threadId: 'thread-note-cross-cap',
          agentType: 'knowledge.generate',
          approvedActions: [pendingAction],
          artifacts: [],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      run: {
        ...createAgentRunResult('completed').run,
        agentType: 'knowledge.generate',
      },
      state: {
        ...createAgentRunResult('completed').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
        executedActions: [
          {
            tool: 'create_goal',
            status: 'failed',
            message:
              'Agent action "create_goal" is not supported by the Knowledge Generation executor yet.',
          },
        ],
      },
    });

    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(waitingExecution)
      .mockResolvedValueOnce(completed);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-note-cross-cap',
      {
        userDecision: 'confirm',
        approvedActions: [pendingAction],
      },
      { identityId: 'identity-1' },
      'request-note-cross-cap',
    );

    expect(result.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_goal',
              status: 'failed',
              message:
                'Agent action "create_goal" is not supported by the Knowledge Generation executor yet.',
            },
          ],
        },
      }),
    );
  });

  it('does not execute knowledge writes through the goal automation executor', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    const knowledgeNotePersistence = createKnowledgeNotePersistencePort();
    // Schema-valid knowledge tool must fail closed inside goal.create execution.
    const pendingAction = {
      tool: 'create_knowledge_note' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Attempt to expand goal agent into knowledge write capability.',
      payload: {
        topic: 'Should not write a note from goal.create',
        title: 'Cross-capability leak',
        contentMarkdown: '# Should not persist',
        targetSubpath: 'notes/leak',
      },
    };
    const waitingExecution = createAgentRunResult('waiting_execution', {
      state: {
        ...createAgentRunResult('waiting_execution').state,
        artifacts: [goalDraftArtifact],
        approvedActions: [pendingAction],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-goal-cross-cap',
          threadId: 'thread-goal-cross-cap',
          agentType: 'goal.create',
          request: {
            idea: 'Ship the AI Agent workspace',
            category: 'work',
            timeframe: 'Q3',
          },
          approvedActions: [pendingAction],
          artifacts: [goalDraftArtifact],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      state: {
        ...createAgentRunResult('completed').state,
        approvedActions: [pendingAction],
        executedActions: [
          {
            tool: 'create_knowledge_note',
            status: 'failed',
            message:
              'Agent action "create_knowledge_note" is not supported by the TS goal automation executor yet.',
          },
        ],
      },
    });

    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(waitingExecution)
      .mockResolvedValueOnce(completed);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
        knowledgeNotePersistence,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-goal-cross-cap',
      {
        userDecision: 'confirm',
        approvedActions: [pendingAction],
      },
      { identityId: 'identity-1' },
      'request-goal-cross-cap',
    );

    expect(result.ok).toBe(true);
    expect(automationToolExecutorPort.executeGoalAutomation).not.toHaveBeenCalled();
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_knowledge_note',
              status: 'failed',
              message:
                'Agent action "create_knowledge_note" is not supported by the TS goal automation executor yet.',
            },
          ],
        },
      }),
    );
  });

  it('fails closed when an Agent run payload is not owned by the authenticated identity', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const foreignRun = createAgentRunResult('waiting_approval', {
      run: {
        ...createAgentRunResult('waiting_approval').run,
        identityId: 'identity-other',
      },
    });
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(foreignRun);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.getRun(
      'run-1',
      { identityId: 'identity-1' },
      'request-identity-isolation',
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
      expect(result.error.message).toMatch(/not owned by the current identity/i);
    }
    expect(agentRuntimePort.getRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-identity-isolation',
      signal: undefined,
    });
  });

  it('resume refuses foreign-owned runs before host side-effects (residual 102)', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistencePort();
    const pendingAction = {
      tool: 'create_knowledge_note' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Persist the approved knowledge note draft.',
      payload: {
        topic: 'Foreign resume isolation',
        title: 'Foreign resume isolation',
        contentArtifactId: 'run-1:knowledge-note-draft',
        contentMarkdown: '# Foreign resume isolation',
        targetSubpath: 'notes/ai',
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        model: 'gpt-4o-mini',
      },
    };
    const noteDraftArtifact = {
      artifactId: 'run-1:knowledge-note-draft',
      kind: 'knowledge_note_draft' as const,
      title: 'Foreign resume isolation',
      updatedAt: 2,
      data: {
        topic: 'Foreign resume isolation',
        title: 'Foreign resume isolation',
        markdown: '# Foreign resume isolation',
        targetSubpath: 'notes/ai',
      },
    };
    const foreignWaiting = createAgentRunResult('waiting_execution', {
      run: {
        ...createAgentRunResult('waiting_execution').run,
        agentType: 'knowledge.generate',
        identityId: 'identity-other',
      },
      state: {
        ...createAgentRunResult('waiting_execution').state,
        intent: 'knowledge-generate',
        approvedActions: [pendingAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'knowledge.generate',
          approvedActions: [pendingAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });

    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(foreignWaiting);
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(foreignWaiting);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const withApprovals = await runtime.services.agentRuntimeService.resumeRun(
      'run-1',
      {
        userDecision: 'confirm',
        approvedActions: [pendingAction],
      },
      { identityId: 'identity-1' },
      'request-foreign-resume-approve',
    );
    expect(withApprovals.ok).toBe(false);
    if (!withApprovals.ok) {
      expect(withApprovals.error.code).toBe('FORBIDDEN');
    }
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();

    const shortcut = await runtime.services.agentRuntimeService.resumeRun(
      'run-1',
      { userDecision: 'confirm' },
      { identityId: 'identity-1' },
      'request-foreign-resume-shortcut',
    );
    expect(shortcut.ok).toBe(false);
    if (!shortcut.ok) {
      expect(shortcut.error.code).toBe('FORBIDDEN');
    }
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
  });

  it('getEvents refuses foreign-owned runs before returning events (residual 103)', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const foreignRun = createAgentRunResult('completed', {
      run: {
        ...createAgentRunResult('completed').run,
        identityId: 'identity-other',
      },
    });
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(foreignRun);
    vi.mocked(agentRuntimePort.getEvents).mockResolvedValueOnce([
      {
        eventId: 'event-foreign-1',
        runId: 'run-1',
        sequence: 0,
        type: 'node.completed',
        createdAt: 1,
        data: { node: 'secret', durationMs: 1 },
      },
    ]);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.getEvents(
      'run-1',
      { identityId: 'identity-1' },
      'request-foreign-events',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
    expect(agentRuntimePort.getEvents).not.toHaveBeenCalled();
  });

  it('getEvents returns events for owned runs after ownership gate (residual 104)', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const ownedRun = createAgentRunResult('completed', {
      run: {
        ...createAgentRunResult('completed').run,
        identityId: 'identity-1',
      },
    });
    const events = [
      {
        eventId: 'event-own-1',
        runId: 'run-1',
        sequence: 0,
        type: 'node.completed' as const,
        createdAt: 1,
        data: { node: 'plan', durationMs: 12 },
      },
    ];
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(ownedRun);
    vi.mocked(agentRuntimePort.getEvents).mockResolvedValueOnce(events);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.getEvents(
      'run-1',
      { identityId: 'identity-1' },
      'request-owned-events',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(events);
    }
    expect(agentRuntimePort.getRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-owned-events',
      signal: undefined,
    });
    expect(agentRuntimePort.getEvents).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-owned-events',
      signal: undefined,
    });
  });

  it('filters foreign identity runs out of list results as defense-in-depth', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    vi.mocked(agentRuntimePort.listRuns).mockResolvedValueOnce([
      {
        runId: 'run-own',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'goal.create',
        status: 'completed',
        createdAt: 1,
        updatedAt: 2,
      },
      {
        runId: 'run-foreign',
        threadId: 'thread-2',
        conversationId: null,
        identityId: 'identity-other',
        agentType: 'goal.create',
        status: 'completed',
        createdAt: 1,
        updatedAt: 2,
      },
    ]);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository: createProviderConfigRepositoryWithProvider(),
      }),
    );

    const result = await runtime.services.agentRuntimeService.listRuns(
      {},
      { identityId: 'identity-1' },
      'request-list-isolation',
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([
        expect.objectContaining({ runId: 'run-own', identityId: 'identity-1' }),
      ]);
    }
  });


  it('does not execute goal automation when the user cancels, even if execution.required remains', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    const waitingExecution = createAgentRunResult('waiting_execution', {
      state: {
        ...createAgentRunResult('waiting_execution').state,
        artifacts: [goalDraftArtifact],
        approvedActions: goalAgentApprovedActions,
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'goal.create',
          request: {
            idea: 'Ship the AI Agent workspace',
            category: 'work',
            timeframe: 'Q3',
          },
          approvedActions: goalAgentApprovedActions,
          artifacts: [goalDraftArtifact],
        },
      ],
    });

    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(waitingExecution);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-1',
      { userDecision: 'cancel' },
      { identityId: 'identity-1' },
      'request-goal-cancel',
    );

    expect(result.ok).toBe(true);
    expect(automationToolExecutorPort.executeGoalAutomation).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledTimes(1);
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-goal-cancel',
      signal: undefined,
      payload: { userDecision: 'cancel' },
    });
  });

  it('records Agent runtime resume execution logs', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const executionLogPort = createMockExecutionLogPort();
    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(
      createAgentRunResult('waiting_approval', {
        state: {
          ...createAgentRunResult('waiting_approval').state,
          usage: {
            promptTokens: 5,
            completionTokens: 3,
            totalTokens: 8,
          },
        },
        events: [
          {
            eventId: 'event-node-resume-1',
            runId: 'run-1',
            sequence: 0,
            type: 'node.completed',
            createdAt: 2,
            data: { node: 'clarify', durationMs: 45 },
          },
          {
            eventId: 'event-tool-resume-1',
            runId: 'run-1',
            sequence: 1,
            type: 'tool.completed',
            createdAt: 3,
            data: { tool: 'search_existing_goals', status: 'executed', durationMs: 120 },
          },
        ],
      }),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        executionLogPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-1',
      {
        userDecision: 'clarify',
        clarificationAnswers: ['Focus on the workspace recovery path.'],
      },
      { identityId: 'identity-1' },
      'request-agent-resume-log',
    );

    expect(result.ok).toBe(true);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        taskType: 'AGENT_RUNTIME_RESUME',
        status: 'COMPLETED',
        requestId: 'request-agent-resume-log',
        input: {
          operation: 'resume',
          runId: 'run-1',
          userDecision: 'clarify',
        },
        result: expect.objectContaining({
          runId: 'run-1',
          status: 'waiting_approval',
          stage: 'approval',
          nodeTimings: [{ node: 'clarify', durationMs: 45 }],
          toolTimings: [{ tool: 'search_existing_goals', status: 'executed', durationMs: 120 }],
        }),
        tokenUsage: {
          promptTokens: 5,
          completionTokens: 3,
          totalTokens: 8,
        },
        processingMs: expect.any(Number),
      }),
    );
  });

  it('resolves provider config before starting goal.create Agent runs', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const providerConfigRepository = {
      save: vi.fn(),
      findByIdForIdentity: vi.fn().mockResolvedValue({
        id: 'provider-1',
        identityId: 'identity-1',
        name: 'Main provider',
        providerType: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'plain-secret',
        defaultModel: 'gpt-4o-mini',
        availableModels: [],
        isActive: true,
        isDefault: true,
        priority: 100,
        version: 1,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      }),
      findDefaultByIdentityId: vi.fn(),
      findByIdentityId: vi.fn(),
        delete: vi.fn(),
      clearDefaultForIdentity: vi.fn(),
    } as unknown as IAIProviderConfigRepository;
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('waiting_approval'),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        providerConfigRepository,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: {
          idea: 'Ship the AI Agent workspace',
          provider_id: 'provider-1',
          model: 'gpt-4o',
        },
      },
      { identityId: 'identity-1' },
      'request-provider',
    );

    expect(result.ok).toBe(true);
    expect(providerConfigRepository.findByIdForIdentity).toHaveBeenCalledWith(
      'identity-1',
      'provider-1',
    );
    expect(agentRuntimePort.startRun).toHaveBeenCalledWith({
      request: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'goal.create',
        input: {
          idea: 'Ship the AI Agent workspace',
          provider_id: 'provider-1',
          model: 'gpt-4o',
          provider_config: {
            provider: 'openai',
            model: 'gpt-4o',
            api_key: 'plain-secret',
            base_url: 'https://api.openai.com/v1',
            temperature: 0.3,
            max_tokens: undefined,
          },
        },
      },
      requestId: 'request-provider',
      signal: undefined,
    });
  });

  it('loads read-only context before starting goal.create Agent runs', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeSourcePort: IKnowledgeSourcePort = {
      listRelevantNotes: vi.fn().mockResolvedValue([
        {
          identityId: 'identity-1',
          repositoryId: 'repo-1',
          resourceId: 'resource-1',
          resourcePath: 'notes/agent-workflow.md',
          title: 'Agent workflow notes',
          mimeType: 'text/markdown',
          content: 'Goal Agent should review notes before drafting.',
          metadata: { source: 'test' },
        },
      ]),
      listIndexableNotes: vi.fn(),
      getNoteById: vi.fn(),
    };
    const analyticsReadPort: IAnalyticsReadPort = {
      buildContext: vi.fn().mockResolvedValue({
        dashboard: { stats: { activeGoals: 2 } },
        taskDashboard: { summary: { totalTasks: 5 } },
        goals: [{ id: 'goal-1', title: 'Existing Agent work' }],
        goalSearchResults: [{ id: 'goal-2', title: 'Similar workspace goal' }],
        extra: { source: 'test' },
      }),
    };
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('waiting_approval'),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        knowledgeSourcePort,
        analyticsReadPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: { idea: 'Ship the AI Agent workspace' },
      },
      { identityId: 'identity-1' },
      'request-context',
    );

    expect(result.ok).toBe(true);
    expect(knowledgeSourcePort.listRelevantNotes).toHaveBeenCalledWith(
      'identity-1',
      'Ship the AI Agent workspace',
      6,
    );
    expect(analyticsReadPort.buildContext).toHaveBeenCalledWith(
      'identity-1',
      'Ship the AI Agent workspace',
    );
    expect(agentRuntimePort.startRun).toHaveBeenCalledWith({
      request: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-1',
        agentType: 'goal.create',
        input: {
          idea: 'Ship the AI Agent workspace',
          related_resources: [
            {
              identity_id: 'identity-1',
              repository_id: 'repo-1',
              resource_id: 'resource-1',
              resource_path: 'notes/agent-workflow.md',
              title: 'Agent workflow notes',
              mime_type: 'text/markdown',
              content: 'Goal Agent should review notes before drafting.',
              metadata: { source: 'test' },
            },
          ],
          analytics_context: {
            dashboard: { stats: { activeGoals: 2 } },
            task_dashboard: { summary: { totalTasks: 5 } },
            goals: [{ id: 'goal-1', title: 'Existing Agent work' }],
            goal_search_results: [{ id: 'goal-2', title: 'Similar workspace goal' }],
            extra: { source: 'test' },
          },
        },
      },
      requestId: 'request-context',
      signal: undefined,
    });
  });

  it('does not execute Agent actions before Python requests external execution', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('waiting_approval', {
        state: {
          ...createAgentRunResult('waiting_approval').state,
          pendingActions: goalAgentApprovedActions,
        },
        interrupts: [
          {
            runId: 'run-1',
            threadId: 'thread-1',
            agentType: 'goal.create',
            pendingActions: goalAgentApprovedActions,
            artifacts: [goalDraftArtifact],
          },
        ],
      }),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: { idea: 'Ship the AI Agent workspace' },
      },
      { identityId: 'identity-1' },
      'request-1',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.status).toBe('waiting_approval');
    expect(automationToolExecutorPort.executeGoalAutomation).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).not.toHaveBeenCalled();
  });

  it('does not execute Agent actions while Python is waiting for clarification', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(
      createAgentRunResult('waiting_clarification', {
        interrupts: [
          {
            type: 'clarification.required',
            runId: 'run-1',
            threadId: 'thread-1',
            agentType: 'goal.create',
            questions: [
              {
                question: 'What concrete outcome should this goal produce?',
                context: 'This keeps the generated goal measurable.',
              },
              {
                question: 'When do you want to review or finish it?',
                context: 'A timeframe keeps the plan realistic.',
              },
            ],
          },
        ],
        events: [
          {
            eventId: 'event-1',
            runId: 'run-1',
            sequence: 0,
            type: 'clarification.required',
            createdAt: 2,
            data: {},
          },
        ],
      }),
    );

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: { idea: 'Get fit' },
      },
      { identityId: 'identity-1' },
      'request-clarify',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.status).toBe('waiting_clarification');
    expect(automationToolExecutorPort.executeGoalAutomation).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).not.toHaveBeenCalled();
  });

  it('executes an execution-required Agent start result through the TS automation executor', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    const executionRequired = createAgentRunResult('waiting_execution', {
      state: {
        ...createAgentRunResult('waiting_execution').state,
        artifacts: [goalDraftArtifact],
        approvedActions: goalAgentApprovedActions,
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'goal.create',
          request: {
            idea: 'Ship the AI Agent workspace',
            category: 'work',
            timeframe: 'Q3',
          },
          approvedActions: goalAgentApprovedActions,
          artifacts: [goalDraftArtifact],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      state: {
        ...createAgentRunResult('completed').state,
        executedActions: [
          {
            tool: 'create_goal',
            status: 'executed',
            entityId: 'goal-1',
            message: 'Created goal',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-1',
            message: 'Created weekly progress key result',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-2',
            message: 'Created milestone key result',
          },
          {
            tool: 'create_task_template',
            status: 'executed',
            entityId: 'task-template-1',
            message: 'Created weekly focus task template',
          },
          {
            tool: 'create_task_template',
            status: 'executed',
            entityId: 'task-template-2',
            message: 'Created milestone review task template',
          },
          {
            tool: 'create_reminder',
            status: 'executed',
            entityId: 'reminder-1',
            message: 'Created weekly review reminder',
          },
        ],
      },
    });

    vi.mocked(agentRuntimePort.startRun).mockResolvedValueOnce(executionRequired);
    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(completed);
    vi.mocked(automationToolExecutorPort.executeGoalAutomation).mockResolvedValueOnce([
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-1',
        message: 'Created goal',
      },
      {
        tool: 'create_key_result',
        status: 'executed',
        entityId: 'key-result-1',
        message: 'Created weekly progress key result',
      },
      {
        tool: 'create_key_result',
        status: 'executed',
        entityId: 'key-result-2',
        message: 'Created milestone key result',
      },
      {
        tool: 'create_task_template',
        status: 'executed',
        entityId: 'task-template-1',
        message: 'Created weekly focus task template',
      },
      {
        tool: 'create_task_template',
        status: 'executed',
        entityId: 'task-template-2',
        message: 'Created milestone review task template',
      },
      {
        tool: 'create_reminder',
        status: 'executed',
        entityId: 'reminder-1',
        message: 'Created weekly review reminder',
      },
    ]);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.startRun(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-from-request',
        agentType: 'goal.create',
        input: { idea: 'Ship the AI Agent workspace' },
      },
      { identityId: 'identity-1' },
      'request-start-execute',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.status).toBe('completed');
    expect(automationToolExecutorPort.executeGoalAutomation).toHaveBeenCalledWith({
      identityId: 'identity-1',
      request: {
        idea: 'Ship the AI Agent workspace',
        category: 'work',
        timeframe: 'Q3',
      },
      plan: {
        goal: goalDraftForAutomationPlan,
        keyResults: goalDraftKeyResults,
        taskTemplates: goalDraftTaskTemplates,
        reminders: goalDraftReminders,
      },
      actions: goalAgentApprovedActions,
    });
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-start-execute',
      signal: undefined,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_goal',
            status: 'executed',
            entityId: 'goal-1',
            message: 'Created goal',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-1',
            message: 'Created weekly progress key result',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-2',
            message: 'Created milestone key result',
          },
          {
            tool: 'create_task_template',
            status: 'executed',
            entityId: 'task-template-1',
            message: 'Created weekly focus task template',
          },
          {
            tool: 'create_task_template',
            status: 'executed',
            entityId: 'task-template-2',
            message: 'Created milestone review task template',
          },
          {
            tool: 'create_reminder',
            status: 'executed',
            entityId: 'reminder-1',
            message: 'Created weekly review reminder',
          },
        ],
      },
    });
  });

  it('executes approved Agent actions through the TS automation executor and resumes Python with partial failures', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    const executionRequired = createAgentRunResult('waiting_execution', {
      state: {
        ...createAgentRunResult('waiting_execution').state,
        artifacts: [goalDraftArtifact],
        approvedActions: goalAgentApprovedActions,
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'goal.create',
          request: {
            idea: 'Ship the AI Agent workspace',
            category: 'work',
            timeframe: 'Q3',
          },
          approvedActions: goalAgentApprovedActions,
          artifacts: [goalDraftArtifact],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      state: {
        ...createAgentRunResult('completed').state,
        executedActions: [
          {
            tool: 'create_goal',
            status: 'executed',
            entityId: 'goal-1',
            message: 'Created goal',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-1',
            message: 'Created weekly progress key result',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-2',
            message: 'Created milestone key result',
          },
          {
            tool: 'create_task_template',
            status: 'executed',
            entityId: 'task-template-1',
            message: 'Created weekly focus task template',
          },
          {
            tool: 'create_task_template',
            status: 'failed',
            message: 'Task scheduler unavailable',
          },
          {
            tool: 'create_reminder',
            status: 'executed',
            entityId: 'reminder-1',
            message: 'Created weekly review reminder',
          },
        ],
      },
    });

    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(executionRequired)
      .mockResolvedValueOnce(completed);
    vi.mocked(automationToolExecutorPort.executeGoalAutomation).mockResolvedValueOnce([
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-1',
        message: 'Created goal',
      },
      {
        tool: 'create_key_result',
        status: 'executed',
        entityId: 'key-result-1',
        message: 'Created weekly progress key result',
      },
      {
        tool: 'create_key_result',
        status: 'executed',
        entityId: 'key-result-2',
        message: 'Created milestone key result',
      },
      {
        tool: 'create_task_template',
        status: 'executed',
        entityId: 'task-template-1',
        message: 'Created weekly focus task template',
      },
      {
        tool: 'create_task_template',
        status: 'failed',
        message: 'Task scheduler unavailable',
      },
      {
        tool: 'create_reminder',
        status: 'executed',
        entityId: 'reminder-1',
        message: 'Created weekly review reminder',
      },
    ]);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-1',
      {
        userDecision: 'confirm',
        approvedActions: goalAgentApprovedActions,
      },
      { identityId: 'identity-1' },
      'request-2',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.status).toBe('completed');
    expect(automationToolExecutorPort.executeGoalAutomation).toHaveBeenCalledWith({
      identityId: 'identity-1',
      request: {
        idea: 'Ship the AI Agent workspace',
        category: 'work',
        timeframe: 'Q3',
      },
      plan: {
        goal: goalDraftForAutomationPlan,
        keyResults: goalDraftKeyResults,
        taskTemplates: goalDraftTaskTemplates,
        reminders: goalDraftReminders,
      },
      actions: goalAgentApprovedActions,
    });
    expect(agentRuntimePort.resumeRun).toHaveBeenLastCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-2',
      signal: undefined,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_goal',
            status: 'executed',
            entityId: 'goal-1',
            message: 'Created goal',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-1',
            message: 'Created weekly progress key result',
          },
          {
            tool: 'create_key_result',
            status: 'executed',
            entityId: 'key-result-2',
            message: 'Created milestone key result',
          },
          {
            tool: 'create_task_template',
            status: 'executed',
            entityId: 'task-template-1',
            message: 'Created weekly focus task template',
          },
          {
            tool: 'create_task_template',
            status: 'failed',
            entityId: null,
            message: 'Task scheduler unavailable',
          },
          {
            tool: 'create_reminder',
            status: 'executed',
            entityId: 'reminder-1',
            message: 'Created weekly review reminder',
          },
        ],
      },
    });
  });

  it('executes a restored waiting-execution Agent run from the runtime snapshot on pure confirm', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const automationToolExecutorPort = createMockAutomationToolExecutorPort();
    const executionRequired = createAgentRunResult('waiting_execution', {
      state: {
        ...createAgentRunResult('waiting_execution').state,
        artifacts: [goalDraftArtifact],
        approvedActions: goalAgentApprovedActions,
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: 'run-1',
          threadId: 'thread-1',
          agentType: 'goal.create',
          request: {
            idea: 'Ship the AI Agent workspace',
            category: 'work',
            timeframe: 'Q3',
          },
          approvedActions: goalAgentApprovedActions,
          artifacts: [goalDraftArtifact],
        },
      ],
    });
    const completed = createAgentRunResult('completed', {
      state: {
        ...createAgentRunResult('completed').state,
        executedActions: [
          {
            tool: 'create_goal',
            status: 'executed',
            entityId: 'goal-1',
            message: 'Created goal',
          },
        ],
      },
    });

    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(executionRequired);
    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(completed);
    vi.mocked(automationToolExecutorPort.executeGoalAutomation).mockResolvedValueOnce([
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-1',
        message: 'Created goal',
      },
    ]);

    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        agentRuntimePort,
        automationToolExecutorPort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.resumeRun(
      'run-1',
      { userDecision: 'confirm' },
      { identityId: 'identity-1' },
      'request-restored-execute',
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.run.status).toBe('completed');
    expect(agentRuntimePort.getRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-restored-execute',
      signal: undefined,
    });
    expect(automationToolExecutorPort.executeGoalAutomation).toHaveBeenCalledWith({
      identityId: 'identity-1',
      request: {
        idea: 'Ship the AI Agent workspace',
        category: 'work',
        timeframe: 'Q3',
      },
      plan: {
        goal: goalDraftForAutomationPlan,
        keyResults: goalDraftKeyResults,
        taskTemplates: goalDraftTaskTemplates,
        reminders: goalDraftReminders,
      },
      actions: goalAgentApprovedActions,
    });
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledTimes(1);
    expect(agentRuntimePort.resumeRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-1',
      requestId: 'request-restored-execute',
      signal: undefined,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_goal',
            status: 'executed',
            entityId: 'goal-1',
            message: 'Created goal',
          },
        ],
      },
    });
  });

  // --- Knowledge notes ---

  it('supports knowledge notes when persistence and subpath are provided', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeNotePersistence: { saveNote: vi.fn(), loadNote: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(true);
    expect(runtime.services.knowledgeNoteService.isAvailable).toBe(true);
  });

  it('does not support knowledge notes when persistence is missing', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(false);
    expect(runtime.services.knowledgeNoteService.isAvailable).toBe(false);
  });

  // --- Evaluation reports ---

  it('supports evaluation reports when port is provided', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ evaluationReportPort: { getOverview: vi.fn() } as any }),
    );
    expect(runtime.capabilities.supportsEvaluationReports).toBe(true);
    expect(runtime.services.evaluationReportService.isAvailable).toBe(true);
  });

  // --- Advanced features reason ---

  it('sets advancedFeaturesReason when any advanced feature is missing', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.advancedFeaturesReason).toBeDefined();
    expect(runtime.capabilities.advancedFeaturesReason).toContain('remote ai-service');
  });

  it('clears advancedFeaturesReason when all advanced features are available', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { listRelevantNotes: vi.fn(), listIndexableNotes: vi.fn(), getNoteById: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
        analyticsReadPort: { read: vi.fn() } as any,
        analyticsQueryPort: { query: vi.fn() } as any,
        goalAutomationPlanningPort: { plan: vi.fn() } as any,
        automationToolExecutorPort: { execute: vi.fn() } as any,
        agentRuntimePort: createMockAgentRuntimePort(),
      }),
    );
    expect(runtime.capabilities.advancedFeaturesReason).toBeUndefined();
  });

  // --- Runtime contributions ---

  it('returns empty runtime contributions', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.runtimeContributions).toEqual([]);
  });

  // --- Capability-service consistency ---

  it('capability flags match actual service availability', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { listRelevantNotes: vi.fn(), listIndexableNotes: vi.fn(), getNoteById: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
        analyticsReadPort: { read: vi.fn() } as any,
        analyticsQueryPort: { query: vi.fn() } as any,
        goalAutomationPlanningPort: { plan: vi.fn() } as any,
        automationToolExecutorPort: { execute: vi.fn() } as any,
        agentRuntimePort: createMockAgentRuntimePort(),
        knowledgeNotePersistence: { saveNote: vi.fn(), loadNote: vi.fn() } as any,
        evaluationReportPort: { getOverview: vi.fn() } as any,
      }),
    );
    const { capabilities, services } = runtime;

    expect(capabilities.supportsChat).toBe(Boolean(services.chatServices));
    expect(capabilities.supportsGoalGeneration).toBe(Boolean(services.goalGenerationService));
    expect(capabilities.supportsKnowledgeNotes).toBe(services.knowledgeNoteService.isAvailable);
    expect(capabilities.supportsKnowledgeQuery).toBe(services.knowledgeQueryServices.isAvailable);
    expect(capabilities.supportsKnowledgeReindex).toBe(services.knowledgeQueryServices.isAvailable);
    expect(capabilities.supportsAnalyticsQuery).toBe(services.analyticsQueryService.isAvailable);
    expect(capabilities.supportsGoalAutomation).toBe(true);
    expect(capabilities.supportsAgentRuntime).toBe(services.agentRuntimeService.isAvailable);
    expect(capabilities.supportsEvaluationReports).toBe(
      services.evaluationReportService.isAvailable,
    );
  });
});
