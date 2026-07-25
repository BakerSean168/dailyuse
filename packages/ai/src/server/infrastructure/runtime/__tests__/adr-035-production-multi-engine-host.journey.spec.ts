/**
 * ADR-035 production multi-engine Host journey (residual 375 / §13.2 Agent).
 *
 * Same fixture routes both production Turn Engines through AssistantFacade:
 * - engine.direct_turn via DirectTurnEngine (open chat default)
 * - engine.pi_readonly via ReadonlyAnalysisTurnEngine (Model Gateway)
 *
 * Uses production classes with in-suite dependency doubles (chat execution /
 * model gateway / provider repos). Not Playwright/Electron E2E and does not
 * claim full multi-engine product E2E or real Pi process spawn.
 * Residual 395: mid-turn cancel_run aborts in-flight DirectTurn stream and
 * ReadonlyAnalysis gateway complete via production engine abort controllers.
 */
import { describe, expect, it, vi } from 'vitest';
import type {
  AgentProposal,
  IModelGatewayPort,
  IProposalKernelPort,
} from '@dailyuse/contracts/ai';
import type { IAIChatExecutionPort } from '../../../application/ports';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import { AIConversation } from '../../../domain/aggregates/ai-conversation';
import { AssistantFacade } from '../../assistant-facade/assistant.facade';
import {
  DIRECT_TURN_ENGINE_ID,
  DirectTurnEngine,
} from '../../turn-engine/direct-turn.engine';
import {
  PI_READONLY_TURN_ENGINE_ID,
  ReadonlyAnalysisTurnEngine,
} from '../../turn-engine/readonly-analysis.turn-engine';
import {
  PI_READONLY_PROCESS_ADAPTER_ID,
  PiReadonlyProcessAdapter,
} from '../../turn-engine/pi-readonly-process.adapter';

const FIXTURE = {
  identity: 'IdentityId_550e8400-e29b-41d4-a716-446655440075',
  foreign: 'IdentityId_550e8400-e29b-41d4-a716-446655440076',
  runDirect: 'run-prod-direct-1',
  runReadonly: 'run-prod-readonly-1',
  runCancel: 'run-prod-cancel-1',
} as const;

function createProviderRepo(): IAIProviderConfigRepository {
  const provider = {
    id: 'provider-prod-1',
    name: 'test',
    isActive: true,
    defaultModel: 'gpt-4o-mini',
    apiKey: 'sk-prod-secret',
    baseUrl: 'https://api.example.test/v1',
    providerType: 'OpenAICompatible',
  };
  return {
    findByIdForIdentity: vi.fn().mockResolvedValue(provider),
    findDefaultByIdentityId: vi.fn().mockResolvedValue(provider),
    findByIdentityId: vi.fn().mockResolvedValue([provider]),
    save: vi.fn(),
    delete: vi.fn(),
  } as unknown as IAIProviderConfigRepository;
}

function createConversationRepo(): {
  repo: IAIConversationRepository;
  conversationId: string;
  conversation: AIConversation;
} {
  const conversation = AIConversation.create({
    identityId: FIXTURE.identity,
    name: 'Prod multi-engine journey',
  });
  const conversationId = String(conversation.id);
  const repo = {
    findByIdForIdentity: vi.fn().mockImplementation(async (identityId, id) => {
      if (identityId === FIXTURE.identity && String(id) === conversationId) {
        return conversation;
      }
      return null;
    }),
    save: vi.fn().mockResolvedValue(undefined),
  } as unknown as IAIConversationRepository;
  return { repo, conversationId, conversation };
}

function createChatPort(): IAIChatExecutionPort {
  return {
    complete: vi.fn().mockResolvedValue({
      content: 'direct-complete',
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    }),
    stream: vi.fn().mockImplementation(async function* () {
      yield { content: 'direct-', finishReason: undefined };
      yield { content: 'stream', finishReason: 'stop' };
    }),
  };
}

function createGateway(): IModelGatewayPort {
  return {
    descriptor: {
      gatewayId: 'model.openai_compatible',
      kind: 'openai_compatible',
      placement: 'server',
      credentialsInEvents: false,
    },
    listModels: vi.fn(),
    complete: vi.fn().mockResolvedValue({
      content: 'readonly-analysis',
      modelBindingId: 'openai:gpt-4o-mini',
      usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
    }),
    stream: async function* () {
      yield { content: 'readonly-analysis', finishReason: 'stop' };
    },
  };
}

function createKernel(
  overrides: Partial<IProposalKernelPort> = {},
): IProposalKernelPort {
  const base: AgentProposal = {
    kind: 'goal.create',
    id: 'agent-run:run-goal:goal.create',
    status: 'ready',
    revision: 1,
    title: 'Journey goal',
    createdAt: 1,
    updatedAt: 1,
  } as AgentProposal;

  return {
    create: vi.fn().mockImplementation(async (proposal) => proposal),
    revise: vi.fn(),
    markStale: vi.fn(),
    approve: vi.fn().mockImplementation(async (proposalId, revision) => ({
      ...base,
      id: proposalId,
      status: 'approved',
      revision,
    })),
    reject: vi.fn().mockImplementation(async (proposalId, revision) => ({
      ...base,
      id: proposalId,
      status: 'rejected',
      revision,
    })),
    executeApproved: vi.fn().mockRejectedValue(new Error('must not be called by facade')),
    ...overrides,
  };
}

function createProductionHost() {
  const providers = createProviderRepo();
  const { repo: conversations, conversationId } = createConversationRepo();
  const chat = createChatPort();
  const gateway = createGateway();

  // Production classes — same instances used as open-chat + primary cancel target.
  const direct = new DirectTurnEngine(conversations, providers, chat);
  const readonly = new ReadonlyAnalysisTurnEngine(providers, gateway);
  const kernel = createKernel();
  const facade = new AssistantFacade(direct, readonly, kernel, direct);

  return { facade, direct, readonly, chat, gateway, kernel, conversations, conversationId };
}

async function collect(
  facade: AssistantFacade,
  command: Parameters<AssistantFacade['dispatch']>[0],
) {
  const events = [];
  for await (const event of facade.dispatch(command)) {
    events.push(event);
  }
  return events;
}

describe('ADR-035 production multi-engine Host journey (residual 375)', () => {
  it('exposes two production engine ids and keeps process spike out of product path', () => {
    const { direct, readonly } = createProductionHost();
    expect(direct.engineId).toBe(DIRECT_TURN_ENGINE_ID);
    expect(readonly.engineId).toBe(PI_READONLY_TURN_ENGINE_ID);
    expect(direct.engineId).not.toBe(readonly.engineId);
    expect(PI_READONLY_PROCESS_ADAPTER_ID).toBe('process.pi_readonly_spike');
    expect(direct.engineId).not.toBe(PI_READONLY_PROCESS_ADAPTER_ID);
    expect(readonly.engineId).not.toBe(PI_READONLY_PROCESS_ADAPTER_ID);

    const processSpike = new PiReadonlyProcessAdapter({ env: {} });
    expect(processSpike.productDefault).toBe(false);
  });

  it('same fixture: default message routes DirectTurnEngine; pi_readonly routes ReadonlyAnalysis', async () => {
    const { facade, chat, gateway, conversationId } = createProductionHost();

    const directEvents = await collect(facade, {
      type: 'message',
      identityId: FIXTURE.identity,
      conversationId,
      content: 'hello production multi-engine',
      surface: 'web',
      runId: FIXTURE.runDirect,
    });

    expect(directEvents[0]).toMatchObject({
      type: 'run.started',
      runId: FIXTURE.runDirect,
      engineId: 'engine.direct_turn',
      profile: 'direct_turn',
      conversationId,
    });
    expect(directEvents.some((e) => e.type === 'message.delta')).toBe(true);
    expect(directEvents.at(-1)).toMatchObject({
      type: 'message.completed',
      runId: FIXTURE.runDirect,
      status: 'completed',
    });
    expect(chat.stream).toHaveBeenCalled();
    expect(gateway.complete).not.toHaveBeenCalled();

    const readonlyEvents = await collect(facade, {
      type: 'message',
      identityId: FIXTURE.identity,
      conversationId,
      content: 'analyze only',
      surface: 'desktop',
      executionProfileId: 'pi_readonly',
      runId: FIXTURE.runReadonly,
    });

    expect(readonlyEvents[0]).toMatchObject({
      type: 'run.started',
      runId: FIXTURE.runReadonly,
      engineId: 'engine.pi_readonly',
      profile: 'pi_readonly',
      conversationId,
    });
    expect(readonlyEvents.at(-1)).toMatchObject({
      type: 'message.completed',
      runId: FIXTURE.runReadonly,
      status: 'completed',
    });
    expect(gateway.complete).toHaveBeenCalledOnce();
    // Direct stream was already used for first turn only — no second stream for readonly.
    expect(vi.mocked(chat.stream).mock.calls.length).toBe(1);

    const gatewayInput = vi.mocked(gateway.complete).mock.calls[0]?.[0];
    expect(gatewayInput?.messages[0]?.content).toMatch(/readonly analysis/i);
    expect(gatewayInput?.messages[0]?.content).toMatch(/cannot execute tools/i);
    expect(JSON.stringify(readonlyEvents)).not.toContain('sk-prod-secret');
  });

  it('isolates engine ownership: foreign identity fails on concurrent run reuse', async () => {
    const providers = createProviderRepo();
    const gateway = createGateway();
    vi.mocked(gateway.complete).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                content: 'late',
                modelBindingId: 'b',
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              }),
            30,
          );
        }),
    );
    const readonly = new ReadonlyAnalysisTurnEngine(providers, gateway);

    const first = readonly.startTurn({
      runId: 'run-own-1',
      identityId: FIXTURE.identity,
      message: 'owner turn',
    });
    await Promise.resolve();
    const foreign = await readonly.startTurn({
      runId: 'run-own-1',
      identityId: FIXTURE.foreign,
      message: 'foreign turn',
    });
    expect(foreign.status).toBe('failed');
    expect(foreign.error).toMatch(/ownership/i);
    await first;
  });

  it('cancel_run aborts both production engines; proposal approve never executeApproved', async () => {
    const { facade, direct, readonly, kernel } = createProductionHost();
    const directAbort = vi.spyOn(direct, 'abort');
    const readonlyAbort = vi.spyOn(readonly, 'abort');

    const cancelled = await collect(facade, {
      type: 'cancel_run',
      identityId: FIXTURE.identity,
      runId: FIXTURE.runCancel,
    });
    expect(cancelled).toEqual([{ type: 'run.cancelled', runId: FIXTURE.runCancel }]);
    expect(directAbort).toHaveBeenCalledWith(FIXTURE.runCancel);
    expect(readonlyAbort).toHaveBeenCalledWith(FIXTURE.runCancel);

    const approved = await collect(facade, {
      type: 'approve_proposal',
      identityId: FIXTURE.identity,
      runId: 'run-goal-1',
      proposalId: 'agent-run:run-goal-1:goal.create',
      revision: 1,
    });
    expect(approved[0]).toMatchObject({
      type: 'proposal.approved',
      proposalId: 'agent-run:run-goal-1:goal.create',
    });
    expect(kernel.executeApproved).not.toHaveBeenCalled();
  });

  it('mid-turn cancel_run aborts in-flight DirectTurn stream and ReadonlyAnalysis (residual 395)', async () => {
    const providers = createProviderRepo();
    const { repo: conversations, conversationId } = createConversationRepo();

    // Gate: only cancel after production engines have registered the run controller.
    let resolveDirectStreamEntered!: () => void;
    const directStreamEntered = new Promise<void>((resolve) => {
      resolveDirectStreamEntered = resolve;
    });
    let resolveReadonlyGatewayEntered!: () => void;
    const readonlyGatewayEntered = new Promise<void>((resolve) => {
      resolveReadonlyGatewayEntered = resolve;
    });

    const chat: IAIChatExecutionPort = {
      complete: vi.fn().mockResolvedValue({
        content: 'unused',
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      }),
      stream: vi.fn().mockImplementation(async function* (input) {
        // First delta proves stream is live; gate cancel after onChunk runs.
        yield { content: 'partial-' };
        resolveDirectStreamEntered();
        await new Promise<void>((_resolve, reject) => {
          const signal = input.signal;
          if (signal?.aborted) {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
            return;
          }
          signal?.addEventListener(
            'abort',
            () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            { once: true },
          );
        });
        yield { content: 'should-not-emit', finishReason: 'stop' };
      }),
    };

    const gateway = createGateway();
    vi.mocked(gateway.complete).mockImplementation(
      (input) =>
        new Promise((_resolve, reject) => {
          resolveReadonlyGatewayEntered();
          const signal = input.signal;
          if (signal?.aborted) {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
            return;
          }
          signal?.addEventListener(
            'abort',
            () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            { once: true },
          );
        }),
    );

    const direct = new DirectTurnEngine(conversations, providers, chat);
    const readonly = new ReadonlyAnalysisTurnEngine(providers, gateway);
    const kernel = createKernel();
    const facade = new AssistantFacade(direct, readonly, kernel, direct);

    const runDirect = 'run-mid-direct-cancel';
    const runReadonly = 'run-mid-readonly-cancel';

    const directTurnPromise = collect(facade, {
      type: 'message',
      identityId: FIXTURE.identity,
      conversationId,
      content: 'stream me then cancel',
      surface: 'web',
      runId: runDirect,
    });
    await directStreamEntered;

    const directCancel = await collect(facade, {
      type: 'cancel_run',
      identityId: FIXTURE.identity,
      runId: runDirect,
    });
    expect(directCancel).toEqual([{ type: 'run.cancelled', runId: runDirect }]);

    const directEvents = await directTurnPromise;
    expect(directEvents[0]).toMatchObject({
      type: 'run.started',
      runId: runDirect,
      engineId: DIRECT_TURN_ENGINE_ID,
      profile: 'direct_turn',
    });
    expect(directEvents.some((e) => e.type === 'message.delta')).toBe(true);
    expect(directEvents.find((e) => e.type === 'message.completed')).toMatchObject({
      type: 'message.completed',
      runId: runDirect,
      status: 'aborted',
    });
    expect(JSON.stringify(directEvents)).not.toContain('sk-prod-secret');

    const readonlyTurnPromise = collect(facade, {
      type: 'message',
      identityId: FIXTURE.identity,
      conversationId,
      content: 'analyze then cancel',
      surface: 'desktop',
      executionProfileId: 'pi_readonly',
      runId: runReadonly,
    });
    await readonlyGatewayEntered;

    const readonlyCancel = await collect(facade, {
      type: 'cancel_run',
      identityId: FIXTURE.identity,
      runId: runReadonly,
    });
    expect(readonlyCancel).toEqual([{ type: 'run.cancelled', runId: runReadonly }]);

    const readonlyEvents = await readonlyTurnPromise;
    expect(readonlyEvents[0]).toMatchObject({
      type: 'run.started',
      runId: runReadonly,
      engineId: PI_READONLY_TURN_ENGINE_ID,
      profile: 'pi_readonly',
    });
    expect(readonlyEvents.find((e) => e.type === 'message.completed')).toMatchObject({
      type: 'message.completed',
      runId: runReadonly,
      status: 'aborted',
    });
    expect(JSON.stringify(readonlyEvents)).not.toContain('sk-prod-secret');

    // Process spike remains uninvolved in product cancel path.
    expect(PI_READONLY_PROCESS_ADAPTER_ID).toBe('process.pi_readonly_spike');
  });

  it('process spike remains fail-closed and uninvolved in Facade host journey', async () => {
    const { facade, chat, gateway, conversationId } = createProductionHost();
    const spike = new PiReadonlyProcessAdapter({
      env: {
        DAILYUSE_PI_SPIKE_ENABLED: '1',
        DAILYUSE_PI_BINARY: '/opt/pi/bin/pi',
        OPENAI_API_KEY: 'sk-should-scrub',
        DAILYUSE_VAULT_PATH: '/vault/path',
      },
      isExecutable: () => true,
      processCwd: () => '/safe/host/cwd',
    });

    const probe = await spike.probe();
    expect(probe.status).toBe('available');

    // Residual 391: dry-run plan is research-only and never enables spawn.
    const plan = spike.buildDryRunSpawnPlan({
      runId: 'run-spike',
      identityId: FIXTURE.identity,
      message: 'should not spawn',
      requestedVaultPath: '/vault/path',
      binaryPath: probe.status === 'available' ? probe.binaryPath : undefined,
    });
    expect(plan.spawnAllowed).toBe(false);
    expect(plan.blockedReason).toBe('PI_SPIKE_SPAWN_BLOCKED');
    expect(plan.cwd).toBe('/safe/host/cwd');
    expect(plan.cwd).not.toBe('/vault/path');
    expect(plan.vaultAsCwd).toBe(false);
    expect(plan.env).not.toHaveProperty('OPENAI_API_KEY');
    expect(plan.env).not.toHaveProperty('DAILYUSE_VAULT_PATH');
    expect(plan.argv[0]).toBe('/opt/pi/bin/pi');
    expect(plan.argv).toContain('--readonly');
    expect(plan.argv).toContain('--no-write');

    const spikeTurn = await spike.startTurn({
      runId: 'run-spike',
      identityId: FIXTURE.identity,
      message: 'should not spawn',
    });
    expect(spikeTurn.status).toBe('failed');
    expect(spikeTurn.error).toMatch(/PI_SPIKE_SPAWN_BLOCKED/);
    expect(spikeTurn.error).toMatch(/dry-run plan prepared/);

    // Host journey still uses production engines only.
    await collect(facade, {
      type: 'message',
      identityId: FIXTURE.identity,
      conversationId,
      content: 'still direct',
      surface: 'web',
      runId: 'run-after-spike',
    });
    expect(chat.stream).toHaveBeenCalled();
    expect(gateway.complete).not.toHaveBeenCalled();
  });
});
