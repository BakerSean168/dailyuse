/**
 * ADR-035 Capability / Turn isolation journey (stage-6 residual evidence).
 *
 * Chains the isolation invariants for one knowledge.generate turn in a single
 * fixture series: capability plan → start gate → confirm-only mutation →
 * cross-capability fail-closed → identity isolation → vault path safety →
 * first-phase tool surface → multi-engine fail-closed → resume ownership before
 * host side-effects → getEvents ownership isolation → owned getEvents passthrough →
 * multi-engine offers never substitute mutation/context even when mixed/labeled
 * as langgraph_workflow / direct_turn (residual 305).
 *
 * This is host-boundary integration coverage (not a full Playwright E2E and not
 * a multi-engine Turn Engine conformance suite). Complements the scattered unit specs.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  AgentToolNameSchema,
  CreateKnowledgeNoteSchema,
  goalAutomationRequirements,
  knowledgeWriteRequirements,
  resolveRunPlan,
  type CapabilityOffer,
} from '@memoflow/contracts/ai';
import type { AgentRunResult } from '@memoflow/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain';
import type {
  IAgentRuntimePort,
  IAIAutomationToolExecutorPort,
  IKnowledgeNotePersistencePort,
} from '../../../application/ports';
import {
  assertAgentStartCapabilityPlan,
  buildAgentRuntimeCapabilityOffers,
} from '../ai-runtime';
import { createRemoteAIServiceRuntime } from '../remote-ai-service.runtime';
import type { AIModuleDependencies } from '../../ai.module';
import { createMockRepo } from '@memoflow/test-utils/mocks';

const FIXTURE = {
  identity: 'identity-journey-1',
  foreignIdentity: 'identity-foreign',
  runId: 'run-journey-knowledge-1',
  threadId: 'thread-journey-knowledge-1',
  requestId: 'request-journey-1',
  proposalId: 'proposal-journey-1',
  revision: 1,
} as const;

function createMockAgentRuntimePort(): IAgentRuntimePort {
  return {
    listRuns: vi.fn(),
    startRun: vi.fn(),
    resumeRun: vi.fn(),
    getRun: vi.fn(),
    getEvents: vi.fn(),
  };
}

function createProviderConfigRepository(): IAIProviderConfigRepository {
  return {
    save: vi.fn(),
    findByIdForIdentity: vi.fn(),
    findDefaultByIdentityId: vi.fn().mockResolvedValue({
      id: 'provider-1',
      identityId: FIXTURE.identity,
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
    findByIdentityId: vi.fn(),
    delete: vi.fn(),
    clearDefaultForIdentity: vi.fn(),
  } as unknown as IAIProviderConfigRepository;
}

function createKnowledgeNotePersistence(): IKnowledgeNotePersistencePort {
  return {
    createKnowledgeNote: vi.fn().mockResolvedValue({
      note: {
        id: 'resource-note-1',
        repositoryScopeId: 'repo-1',
        name: 'Journey-note.md',
        path: 'notes/ai/Journey-note.md',
        mimeType: 'text/markdown',
        size: 42,
        content: '# Journey note',
        createdAt: 1,
        updatedAt: 2,
      },
    }),
  };
}

function createDeps(overrides?: Partial<AIModuleDependencies>): AIModuleDependencies {
  return {
    conversationRepository: createMockRepo(),
    providerConfigRepository: createProviderConfigRepository(),
    ...overrides,
  };
}

function baseRun(
  status: AgentRunResult['run']['status'],
  overrides?: Partial<AgentRunResult>,
): AgentRunResult {
  return {
    run: {
      runId: FIXTURE.runId,
      threadId: FIXTURE.threadId,
      conversationId: null,
      identityId: FIXTURE.identity,
      agentType: 'knowledge.generate',
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
      intent: 'knowledge-generate',
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

const pendingCreateNoteAction = {
  tool: 'create_knowledge_note' as const,
  index: 0,
  dependsOn: [],
  rationale: 'Persist the approved knowledge note draft.',
  payload: {
    topic: 'Journey note',
    title: 'Journey note',
    contentArtifactId: `${FIXTURE.runId}:knowledge-note-draft`,
    contentMarkdown: '# Journey note\n\nConfirmed write only.',
    targetSubpath: 'notes/ai',
    providerId: '550e8400-e29b-41d4-a716-446655440000',
    model: 'gpt-4o-mini',
  },
};

const noteDraftArtifact = {
  artifactId: `${FIXTURE.runId}:knowledge-note-draft`,
  kind: 'knowledge_note_draft' as const,
  title: 'Journey note',
  updatedAt: 2,
  data: {
    topic: 'Journey note',
    title: 'Journey note',
    markdown: '# Journey note\n\nConfirmed write only.',
    targetSubpath: 'notes/ai',
  },
};

describe('ADR-035 Capability/Turn isolation journey (same fixture)', () => {
  const proposal: CapabilityOffer = {
    kind: 'tool.proposal',
    providerId: 'proposal-kernel',
    surface: 'any',
    readonly: false,
  };
  const mutation: CapabilityOffer = {
    kind: 'tool.mutation',
    providerId: 'host-executor',
    surface: 'any',
    readonly: false,
  };
  const desktopVault: CapabilityOffer = {
    kind: 'context.local_vault',
    providerId: 'desktop-local-vault',
    surface: 'desktop',
    readonly: false,
  };
  const cloudRag: CapabilityOffer = {
    kind: 'context.cloud_rag',
    providerId: 'web-github-projection',
    surface: 'web',
    readonly: true,
  };

  it('step 1: fixes a surface-scoped ResolvedRunPlan without silent cross-surface expansion', () => {
    const desktopPlan = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [proposal, mutation, desktopVault, cloudRag],
      requirements: knowledgeWriteRequirements('desktop'),
      surface: 'desktop',
    });
    expect(desktopPlan.engineId).toBe('knowledge.generate');
    expect(desktopPlan.offers.some((offer) => offer.kind === 'context.cloud_rag')).toBe(false);

    const webWithoutCloud = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [proposal, mutation, desktopVault],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(webWithoutCloud.engineId).toBe('none');
    expect(webWithoutCloud.missing.map((item) => item.kind)).toEqual(['context.cloud_rag']);

    // Goal workflow offers never substitute for knowledge mutation requirements.
    const goalOnly = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [
        proposal,
        {
          kind: 'workflow.goal',
          providerId: 'goal',
          surface: 'any',
          readonly: false,
        },
      ],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(goalOnly.engineId).toBe('none');
    expect(goalOnly.missing.map((item) => item.kind).sort()).toEqual(
      ['context.cloud_rag', 'tool.mutation'].sort(),
    );
  });

  it('step 2: startRun capability gate fails closed without knowledge note / cloud_rag offers', () => {
    const blocked = assertAgentStartCapabilityPlan(
      'knowledge.generate',
      buildAgentRuntimeCapabilityOffers({}),
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe('SERVICE_UNAVAILABLE');
    }

    const allowed = assertAgentStartCapabilityPlan(
      'knowledge.generate',
      buildAgentRuntimeCapabilityOffers({
        knowledgeNoteUseCase: {} as never,
      }),
    );
    expect(allowed.ok).toBe(true);

    // goal.create planning may start without automation executor (mutation later).
    expect(assertAgentStartCapabilityPlan('goal.create', buildAgentRuntimeCapabilityOffers({})).ok).toBe(
      true,
    );
    expect(goalAutomationRequirements().map((item) => item.kind).sort()).toEqual(
      ['tool.mutation', 'tool.proposal', 'workflow.goal'].sort(),
    );
  });

  it('step 3–5: confirm-only mutation, cancel no-op, cross-capability tool fail-closed', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistence();
    const automationToolExecutorPort: IAIAutomationToolExecutorPort = {
      executeGoalAutomation: vi.fn(),
    };

    const waitingExecution = baseRun('waiting_execution', {
      state: {
        ...baseRun('waiting_execution').state,
        approvedActions: [pendingCreateNoteAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: FIXTURE.runId,
          threadId: FIXTURE.threadId,
          agentType: 'knowledge.generate',
          approvedActions: [pendingCreateNoteAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });

    const completed = baseRun('completed', {
      state: {
        ...baseRun('completed').state,
        approvedActions: [pendingCreateNoteAction],
        artifacts: [noteDraftArtifact],
        executedActions: [
          {
            tool: 'create_knowledge_note',
            status: 'executed',
            message: 'created',
          },
        ],
      },
    });

    // resume with confirm returns waiting_execution first, then host executes and resumes again.
    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(waitingExecution)
      .mockResolvedValueOnce(completed);

    const runtime = createRemoteAIServiceRuntime(
      createDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
        automationToolExecutorPort,
      }),
    );

    // Confirm path executes host mutation only after userDecision=confirm.
    const confirm = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      {
        userDecision: 'confirm',
        approvedActions: [pendingCreateNoteAction],
      },
      { identityId: FIXTURE.identity },
      FIXTURE.requestId,
    );
    expect(confirm.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).toHaveBeenCalledTimes(1);

    // Cancel must not re-run side effects even if execution.required remains.
    vi.mocked(knowledgeNotePersistence.createKnowledgeNote).mockClear();
    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(waitingExecution);
    const cancel = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      { userDecision: 'cancel' },
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-cancel`,
    );
    expect(cancel.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(automationToolExecutorPort.executeGoalAutomation).not.toHaveBeenCalled();

    // Cross-capability: knowledge executor fails closed on create_goal.
    const crossCapAction = {
      tool: 'create_goal' as const,
      index: 0,
      dependsOn: [],
      rationale: 'Must not run through knowledge executor',
      payload: { title: 'Should fail closed' },
    };
    const crossCapWaiting = baseRun('waiting_execution', {
      state: {
        ...baseRun('waiting_execution').state,
        approvedActions: [crossCapAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: FIXTURE.runId,
          threadId: FIXTURE.threadId,
          agentType: 'knowledge.generate',
          approvedActions: [crossCapAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });
    vi.mocked(knowledgeNotePersistence.createKnowledgeNote).mockClear();
    vi.mocked(agentRuntimePort.resumeRun)
      .mockResolvedValueOnce(crossCapWaiting)
      .mockResolvedValueOnce(baseRun('completed'));

    const cross = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      {
        userDecision: 'confirm',
        approvedActions: [crossCapAction],
      },
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-cross`,
    );
    expect(cross.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(agentRuntimePort.resumeRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          userDecision: 'confirm',
          executedActions: [
            expect.objectContaining({
              tool: 'create_goal',
              status: 'failed',
            }),
          ],
        }),
      }),
    );
  });

  it('step 6: identity isolation on get/list for the same journey fixture', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(
      baseRun('completed', {
        run: {
          ...baseRun('completed').run,
          identityId: FIXTURE.foreignIdentity,
        },
      }),
    );
    vi.mocked(agentRuntimePort.listRuns).mockResolvedValueOnce([
      {
        runId: FIXTURE.runId,
        threadId: FIXTURE.threadId,
        conversationId: null,
        identityId: FIXTURE.identity,
        agentType: 'knowledge.generate',
        status: 'completed',
        createdAt: 1,
        updatedAt: 2,
      },
      {
        runId: 'run-foreign',
        threadId: 'thread-foreign',
        conversationId: null,
        identityId: FIXTURE.foreignIdentity,
        agentType: 'knowledge.generate',
        status: 'completed',
        createdAt: 1,
        updatedAt: 2,
      },
    ]);

    const runtime = createRemoteAIServiceRuntime(
      createDeps({
        agentRuntimePort,
      }),
    );

    const forbidden = await runtime.services.agentRuntimeService.getRun(
      FIXTURE.runId,
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-get`,
    );
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) {
      expect(forbidden.error.code).toBe('FORBIDDEN');
    }

    const listed = await runtime.services.agentRuntimeService.listRuns(
      {},
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-list`,
    );
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data).toEqual([
        expect.objectContaining({ runId: FIXTURE.runId, identityId: FIXTURE.identity }),
      ]);
    }
  });

  it('step 7: vault path + confirmation contract and first-phase tool surface stay closed', () => {
    const confirmation = {
      proposalId: FIXTURE.proposalId,
      revision: FIXTURE.revision,
      requestId: FIXTURE.requestId,
    };

    expect(
      CreateKnowledgeNoteSchema.safeParse({
        topic: 'Safe journey note',
        targetSubpath: 'notes/ai',
        confirmation,
      }).success,
    ).toBe(true);

    for (const targetSubpath of ['/private', '../escape', 'notes/../../etc']) {
      expect(
        CreateKnowledgeNoteSchema.safeParse({
          topic: 'Unsafe',
          targetSubpath,
          confirmation,
        }).success,
      ).toBe(false);
    }

    expect(CreateKnowledgeNoteSchema.safeParse({ topic: 'No confirmation' }).success).toBe(false);

    expect(AgentToolNameSchema.safeParse('create_knowledge_note').success).toBe(true);
    expect(AgentToolNameSchema.safeParse('update_knowledge_note').success).toBe(false);
    expect(AgentToolNameSchema.safeParse('reindex_resource').success).toBe(false);
    expect(AgentToolNameSchema.safeParse('bash').success).toBe(false);
  });
  it('step 8: multi-turn second confirm does not double-create after completed turn', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistence();

    const completed = baseRun('completed', {
      state: {
        ...baseRun('completed').state,
        approvedActions: [pendingCreateNoteAction],
        artifacts: [noteDraftArtifact],
        executedActions: [
          {
            tool: 'create_knowledge_note',
            status: 'executed',
            message: 'created',
          },
        ],
      },
      interrupts: [],
    });

    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValue(completed);

    const runtime = createRemoteAIServiceRuntime(
      createDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
      }),
    );

    const first = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      {
        userDecision: 'confirm',
        approvedActions: [pendingCreateNoteAction],
      },
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-turn1`,
    );
    expect(first.ok).toBe(true);
    // Completed turn has no execution.required interrupt, so host must not mutate again.
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();

    const second = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      {
        userDecision: 'confirm',
        approvedActions: [pendingCreateNoteAction],
      },
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-turn2`,
    );
    expect(second.ok).toBe(true);
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
  });

  it('step 9: Web surface cannot satisfy Desktop local_vault knowledge-write requirements', () => {
    const webOnlyOffers: CapabilityOffer[] = [
      {
        kind: 'tool.proposal',
        providerId: 'web-agent',
        surface: 'web',
        readonly: false,
      },
      {
        kind: 'tool.mutation',
        providerId: 'web-agent',
        surface: 'web',
        readonly: false,
      },
      {
        kind: 'context.cloud_rag',
        providerId: 'web-rag',
        surface: 'web',
        readonly: true,
      },
    ];

    const desktopReqs = knowledgeWriteRequirements('desktop');
    const webPlan = resolveRunPlan({
      engineId: 'langgraph',
      offers: webOnlyOffers,
      requirements: desktopReqs,
      surface: 'web',
    });
    expect(webPlan.engineId).toBe('none');
    expect(webPlan.missing.some((item) => item.kind === 'context.local_vault')).toBe(true);

    const webReqs = knowledgeWriteRequirements('web');
    const okWeb = resolveRunPlan({
      engineId: 'langgraph',
      offers: webOnlyOffers,
      requirements: webReqs,
      surface: 'web',
    });
    expect(okWeb.engineId).toBe('langgraph');
    expect(okWeb.missing).toEqual([]);
  });



  it('step 10: readonly cloud_rag/proposal cannot satisfy knowledge mutation requirements', () => {
    const readonlyRagOffers: CapabilityOffer[] = [
      {
        kind: 'context.cloud_rag',
        providerId: 'web-rag',
        surface: 'web',
        readonly: true,
      },
      {
        kind: 'tool.proposal',
        providerId: 'web-agent',
        surface: 'web',
        readonly: true,
      },
    ];

    const webMutation = resolveRunPlan({
      engineId: 'langgraph',
      offers: readonlyRagOffers,
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(webMutation.engineId).toBe('none');
    expect(
      webMutation.missing.some(
        (item) => item.kind === 'tool.mutation' || item.kind === 'tool.proposal',
      ),
    ).toBe(true);

    const desktopMutation = resolveRunPlan({
      engineId: 'langgraph',
      offers: readonlyRagOffers,
      requirements: knowledgeWriteRequirements('desktop'),
      surface: 'desktop',
    });
    expect(desktopMutation.engineId).toBe('none');
    expect(desktopMutation.missing.some((item) => item.kind === 'context.local_vault')).toBe(true);
  });

  it('step 11: multi-engine offers alone cannot satisfy knowledge mutation requirements', () => {
    // Engine capability kinds describe how a turn is executed; they never substitute for
    // tool.proposal / tool.mutation / surface context required by knowledgeWriteRequirements.
    const engineOnlyOffers: CapabilityOffer[] = [
      {
        kind: 'engine.direct_turn',
        providerId: 'direct-chat-execution',
        surface: 'any',
        readonly: false,
      },
      {
        kind: 'engine.pi_readonly',
        providerId: 'pi-readonly',
        surface: 'any',
        readonly: true,
      },
      {
        kind: 'engine.cli_readonly',
        providerId: 'cli-readonly',
        surface: 'any',
        readonly: true,
      },
    ];

    for (const engineId of [
      'engine.direct_turn',
      'engine.pi_readonly',
      'engine.cli_readonly',
      'knowledge.generate',
    ] as const) {
      const webPlan = resolveRunPlan({
        engineId,
        offers: engineOnlyOffers,
        requirements: knowledgeWriteRequirements('web'),
        surface: 'web',
      });
      expect(webPlan.engineId).toBe('none');
      expect(webPlan.missing.map((item) => item.kind).sort()).toEqual(
        ['context.cloud_rag', 'tool.mutation', 'tool.proposal'].sort(),
      );

      const desktopPlan = resolveRunPlan({
        engineId,
        offers: engineOnlyOffers,
        requirements: knowledgeWriteRequirements('desktop'),
        surface: 'desktop',
      });
      expect(desktopPlan.engineId).toBe('none');
      expect(desktopPlan.missing.map((item) => item.kind).sort()).toEqual(
        ['context.local_vault', 'tool.mutation', 'tool.proposal'].sort(),
      );
    }
  });

  it('step 12: start gate fails closed when only multi-engine capability offers are present', () => {
    const engineOnlyOffers: CapabilityOffer[] = [
      {
        kind: 'engine.direct_turn',
        providerId: 'direct-chat-execution',
        surface: 'any',
        readonly: false,
      },
      {
        kind: 'engine.pi_readonly',
        providerId: 'pi-readonly',
        surface: 'any',
        readonly: true,
      },
      {
        kind: 'engine.cli_readonly',
        providerId: 'cli-readonly',
        surface: 'any',
        readonly: true,
      },
    ];

    const blocked = assertAgentStartCapabilityPlan('knowledge.generate', engineOnlyOffers);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.message).toContain('missing capabilities');
      expect(blocked.error.message).toContain('tool.proposal');
      expect(blocked.error.message).toContain('tool.mutation');
      expect(blocked.error.message).toContain('context.cloud_rag');
    }

    // Engine offers never unlock goal.create at start either without automation ports,
    // but goal.create intentionally starts planning without mutation capability.
    expect(assertAgentStartCapabilityPlan('goal.create', engineOnlyOffers).ok).toBe(true);
  });

  it('step 13: foreign identity resume is FORBIDDEN before host side-effects', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const knowledgeNotePersistence = createKnowledgeNotePersistence();

    const foreignWaiting = baseRun('waiting_execution', {
      run: {
        ...baseRun('waiting_execution').run,
        identityId: FIXTURE.foreignIdentity,
      },
      state: {
        ...baseRun('waiting_execution').state,
        approvedActions: [pendingCreateNoteAction],
        artifacts: [noteDraftArtifact],
      },
      interrupts: [
        {
          type: 'execution.required',
          runId: FIXTURE.runId,
          threadId: FIXTURE.threadId,
          agentType: 'knowledge.generate',
          approvedActions: [pendingCreateNoteAction],
          artifacts: [noteDraftArtifact],
        },
      ],
    });

    // Explicit-approve path: resumeRun returns foreign-owned run.
    vi.mocked(agentRuntimePort.resumeRun).mockResolvedValueOnce(foreignWaiting);
    // Confirm-shortcut path: getRun returns foreign-owned waiting_execution snapshot.
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(foreignWaiting);

    const runtime = createRemoteAIServiceRuntime(
      createDeps({
        agentRuntimePort,
        knowledgeNotePersistence,
      }),
    );

    const approvePath = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      {
        userDecision: 'confirm',
        approvedActions: [pendingCreateNoteAction],
      },
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-foreign-approve`,
    );
    expect(approvePath.ok).toBe(false);
    if (!approvePath.ok) {
      expect(approvePath.error.code).toBe('FORBIDDEN');
    }
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();

    const shortcutPath = await runtime.services.agentRuntimeService.resumeRun(
      FIXTURE.runId,
      { userDecision: 'confirm' },
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-foreign-shortcut`,
    );
    expect(shortcutPath.ok).toBe(false);
    if (!shortcutPath.ok) {
      expect(shortcutPath.error.code).toBe('FORBIDDEN');
    }
    expect(knowledgeNotePersistence.createKnowledgeNote).not.toHaveBeenCalled();
    expect(agentRuntimePort.getRun).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: FIXTURE.identity,
        runId: FIXTURE.runId,
      }),
    );
  });


  it('step 14: foreign identity getEvents is FORBIDDEN (no event leakage)', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const foreignRun = baseRun('completed', {
      run: {
        ...baseRun('completed').run,
        identityId: FIXTURE.foreignIdentity,
      },
    });
    const leakedEvents = [
      {
        eventId: 'event-foreign-1',
        runId: FIXTURE.runId,
        sequence: 0,
        type: 'node.completed' as const,
        createdAt: 1,
        data: { node: 'secret', durationMs: 1 },
      },
    ];
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(foreignRun);
    vi.mocked(agentRuntimePort.getEvents).mockResolvedValueOnce(leakedEvents);

    const runtime = createRemoteAIServiceRuntime(
      createDeps({
        agentRuntimePort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.getEvents(
      FIXTURE.runId,
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-events`,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
    // Must not return foreign events even if the port would have leaked them.
    expect(agentRuntimePort.getEvents).not.toHaveBeenCalled();
    expect(agentRuntimePort.getRun).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: FIXTURE.identity,
        runId: FIXTURE.runId,
      }),
    );
  });


  it('step 15: owned identity getEvents returns events after ownership gate', async () => {
    const agentRuntimePort = createMockAgentRuntimePort();
    const ownedRun = baseRun('completed');
    const events = [
      {
        eventId: 'event-owned-1',
        runId: FIXTURE.runId,
        sequence: 0,
        type: 'node.completed' as const,
        createdAt: 1,
        data: { node: 'result', durationMs: 5 },
      },
    ];
    vi.mocked(agentRuntimePort.getRun).mockResolvedValueOnce(ownedRun);
    vi.mocked(agentRuntimePort.getEvents).mockResolvedValueOnce(events);

    const runtime = createRemoteAIServiceRuntime(
      createDeps({
        agentRuntimePort,
      }),
    );

    const result = await runtime.services.agentRuntimeService.getEvents(
      FIXTURE.runId,
      { identityId: FIXTURE.identity },
      `${FIXTURE.requestId}-owned-events`,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(events);
    }
    expect(agentRuntimePort.getEvents).toHaveBeenCalledTimes(1);
  });


  it('step 16: multi-engine labels never substitute mutation/context (residual 305)', () => {
    // engine.langgraph_workflow / engine.direct_turn are execution labels only.
    const engineLabels: CapabilityOffer[] = [
      {
        kind: 'engine.langgraph_workflow',
        providerId: 'langgraph-workflow',
        surface: 'any',
        readonly: false,
      },
      {
        kind: 'engine.direct_turn',
        providerId: 'direct-chat-execution',
        surface: 'any',
        readonly: false,
      },
      {
        kind: 'engine.pi_readonly',
        providerId: 'pi-readonly',
        surface: 'any',
        readonly: true,
      },
      {
        kind: 'engine.cli_readonly',
        providerId: 'cli-readonly',
        surface: 'any',
        readonly: true,
      },
    ];

    // Engine labels alone still fail closed for knowledge write on both surfaces.
    for (const surface of ['web', 'desktop'] as const) {
      const blocked = resolveRunPlan({
        engineId: 'engine.direct_turn',
        offers: engineLabels,
        requirements: knowledgeWriteRequirements(surface),
        surface,
      });
      expect(blocked.engineId).toBe('none');
      expect(blocked.missing.map((item) => item.kind)).toEqual(
        expect.arrayContaining(['tool.proposal', 'tool.mutation']),
      );
    }

    // Readonly mutation offer cannot satisfy writable mutation even with engine labels.
    const readonlyMutation: CapabilityOffer = {
      kind: 'tool.mutation',
      providerId: 'readonly-host',
      surface: 'any',
      readonly: true,
    };
    const proposal: CapabilityOffer = {
      kind: 'tool.proposal',
      providerId: 'proposal-kernel',
      surface: 'any',
      readonly: false,
    };
    const cloudRag: CapabilityOffer = {
      kind: 'context.cloud_rag',
      providerId: 'web-github-projection',
      surface: 'web',
      readonly: true,
    };
    const readonlyBlocked = resolveRunPlan({
      engineId: 'engine.direct_turn',
      offers: [...engineLabels, proposal, readonlyMutation, cloudRag],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(readonlyBlocked.engineId).toBe('none');
    expect(readonlyBlocked.missing.map((item) => item.kind)).toContain('tool.mutation');

    // Full knowledge-write offers may resolve under an engine label, but the label does
    // not drop mutation/proposal requirements — plan still carries host tool offers.
    const writableMutation: CapabilityOffer = {
      kind: 'tool.mutation',
      providerId: 'host-executor',
      surface: 'any',
      readonly: false,
    };
    const okPlan = resolveRunPlan({
      engineId: 'engine.direct_turn',
      offers: [...engineLabels, proposal, writableMutation, cloudRag],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(okPlan.engineId).toBe('engine.direct_turn');
    expect(okPlan.missing).toEqual([]);
    expect(okPlan.offers.some((offer) => offer.kind === 'tool.mutation' && !offer.readonly)).toBe(
      true,
    );
    expect(okPlan.offers.some((offer) => offer.kind === 'tool.proposal')).toBe(true);
    // Engine labels remain diagnostic only — still present, never the sole offer kinds.
    expect(okPlan.offers.some((offer) => offer.kind.startsWith('engine.'))).toBe(true);
  });


});
