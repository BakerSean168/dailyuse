import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/**
 * ADR-035 multi-engine Turn Engine conformance harness (residual 309/314 / §13.2 Agent).
 *
 * Runs the same isolation invariants against two engine labels in one suite:
 * `engine.direct_turn` and `engine.langgraph_workflow`. Uses in-suite test doubles
 * for dual-label isolation. Production residual 314 adds DirectTurnEngine;
 * residual 341 adds ReadonlyAnalysisTurnEngine (engine.pi_readonly) via Model Gateway.
 * Residual 373 adds fail-closed PiReadonlyProcessAdapter spike (no spawn, not product default).
 * Full multi-engine runtime E2E and real Pi SDK/CLI process spawn remain open.
 *
 * This is not a Playwright/Electron E2E and does not claim production multi-engine
 * runtime wiring is complete.
 */
import { describe, expect, it } from 'vitest';
import {
  knowledgeWriteRequirements,
  resolveRunPlan,
  type CapabilityOffer,
  type ITurnEnginePort,
} from '@dailyuse/contracts/ai';

const FIXTURE = {
  identity: 'identity-multi-engine-1',
  foreignIdentity: 'identity-multi-engine-foreign',
  runA: 'run-multi-engine-a',
  runB: 'run-multi-engine-b',
  message: 'conformance harness turn',
} as const;

const ENGINE_IDS = ['engine.direct_turn', 'engine.langgraph_workflow'] as const;

const proposalOffer: CapabilityOffer = {
  kind: 'tool.proposal',
  providerId: 'proposal-kernel',
  surface: 'any',
  readonly: false,
};

const writableMutation: CapabilityOffer = {
  kind: 'tool.mutation',
  providerId: 'host-executor',
  surface: 'any',
  readonly: false,
};

const readonlyMutation: CapabilityOffer = {
  kind: 'tool.mutation',
  providerId: 'readonly-host',
  surface: 'any',
  readonly: true,
};

const cloudRag: CapabilityOffer = {
  kind: 'context.cloud_rag',
  providerId: 'web-github-projection',
  surface: 'web',
  readonly: true,
};

const desktopVault: CapabilityOffer = {
  kind: 'context.local_vault',
  providerId: 'desktop-local-vault',
  surface: 'desktop',
  readonly: false,
};

/**
 * Minimal in-suite Turn Engine double. Records start/abort by runId and fails closed
 * on foreign identity — not a production adapter.
 */
function createConformanceTurnEngine(engineId: string): ITurnEnginePort & {
  readonly started: ReadonlyMap<string, { identityId: string; status: string }>;
  readonly aborted: ReadonlySet<string>;
} {
  const started = new Map<string, { identityId: string; status: string }>();
  const aborted = new Set<string>();

  const engine: ITurnEnginePort & {
    started: Map<string, { identityId: string; status: string }>;
    aborted: Set<string>;
  } = {
    engineId,
    started,
    aborted,
    async abort(runId) {
      aborted.add(runId);
      const prior = started.get(runId);
      if (prior) {
        started.set(runId, { ...prior, status: 'aborted' });
      }
    },
    async startTurn(input) {
      if (input.identityId !== FIXTURE.identity) {
        started.set(input.runId, { identityId: input.identityId, status: 'failed' });
        return { status: 'failed', error: 'OWNERSHIP_MISMATCH' };
      }
      if (aborted.has(input.runId)) {
        started.set(input.runId, { identityId: input.identityId, status: 'aborted' });
        return { status: 'aborted' };
      }
      // Capability is host-resolved before startTurn; engine label alone never grants mutation.
      started.set(input.runId, { identityId: input.identityId, status: 'completed' });
      return { status: 'completed' };
    },
  };

  return engine;
}

function engineLabelOffer(kind: (typeof ENGINE_IDS)[number]): CapabilityOffer {
  return {
    kind,
    providerId: `label:${kind}`,
    surface: 'any',
    readonly: true,
  };
}

describe('ADR-035 multi-engine Turn Engine conformance harness', () => {
  it('registers both engines under the same fixture suite', () => {
    expect(ENGINE_IDS).toEqual(['engine.direct_turn', 'engine.langgraph_workflow']);
    for (const engineId of ENGINE_IDS) {
      const engine = createConformanceTurnEngine(engineId);
      expect(engine.engineId).toBe(engineId);
    }
  });

  describe.each(ENGINE_IDS)('engine %s', (engineId) => {
    it('fails closed for knowledge write when only the engine label is offered', () => {
      const plan = resolveRunPlan({
        engineId,
        offers: [engineLabelOffer(engineId)],
        requirements: knowledgeWriteRequirements('web'),
        surface: 'web',
      });
      expect(plan.engineId).toBe('none');
      expect(plan.missing.map((item) => item.kind).sort()).toEqual(
        ['context.cloud_rag', 'tool.mutation', 'tool.proposal'].sort(),
      );
    });

    it('fails closed when engine label is mixed with readonly mutation (writable required)', () => {
      const plan = resolveRunPlan({
        engineId,
        offers: [engineLabelOffer(engineId), proposalOffer, readonlyMutation, cloudRag],
        requirements: knowledgeWriteRequirements('web'),
        surface: 'web',
      });
      expect(plan.engineId).toBe('none');
      expect(plan.missing.map((item) => item.kind)).toEqual(['tool.mutation']);
    });

    it('preserves engineId when full knowledge-write offers resolve (labels never replace tools)', () => {
      const webPlan = resolveRunPlan({
        engineId,
        offers: [
          engineLabelOffer(engineId),
          proposalOffer,
          writableMutation,
          cloudRag,
          desktopVault,
        ],
        requirements: knowledgeWriteRequirements('web'),
        surface: 'web',
      });
      expect(webPlan.engineId).toBe(engineId);
      expect(webPlan.missing).toEqual([]);
      expect(webPlan.offers.some((offer) => offer.kind === 'tool.proposal')).toBe(true);
      expect(webPlan.offers.some((offer) => offer.kind === 'tool.mutation' && !offer.readonly)).toBe(
        true,
      );
      // Desktop vault is filtered out on web surface; engine label is not a vault substitute.
      expect(webPlan.offers.some((offer) => offer.kind === 'context.local_vault')).toBe(false);
      expect(webPlan.offers.some((offer) => offer.kind === engineId)).toBe(true);

      const desktopPlan = resolveRunPlan({
        engineId,
        offers: [engineLabelOffer(engineId), proposalOffer, writableMutation, desktopVault],
        requirements: knowledgeWriteRequirements('desktop'),
        surface: 'desktop',
      });
      expect(desktopPlan.engineId).toBe(engineId);
      expect(desktopPlan.missing).toEqual([]);
      expect(desktopPlan.offers.some((offer) => offer.kind === 'context.local_vault')).toBe(true);
    });

    it('startTurn fails closed for foreign identity and completes for owned identity', async () => {
      const engine = createConformanceTurnEngine(engineId);

      const foreign = await engine.startTurn({
        runId: FIXTURE.runA,
        identityId: FIXTURE.foreignIdentity,
        message: FIXTURE.message,
      });
      expect(foreign.status).toBe('failed');
      expect(foreign.error).toBe('OWNERSHIP_MISMATCH');

      const owned = await engine.startTurn({
        runId: FIXTURE.runB,
        identityId: FIXTURE.identity,
        message: FIXTURE.message,
      });
      expect(owned.status).toBe('completed');
      expect(engine.started.get(FIXTURE.runB)?.identityId).toBe(FIXTURE.identity);
    });

    it('abort marks the run terminal without granting capabilities', async () => {
      const engine = createConformanceTurnEngine(engineId);
      await engine.abort(FIXTURE.runA);
      const result = await engine.startTurn({
        runId: FIXTURE.runA,
        identityId: FIXTURE.identity,
        message: FIXTURE.message,
      });
      expect(result.status).toBe('aborted');
      expect(engine.aborted.has(FIXTURE.runA)).toBe(true);

      // Abort never injects mutation/proposal/context offers.
      const plan = resolveRunPlan({
        engineId,
        offers: [engineLabelOffer(engineId)],
        requirements: knowledgeWriteRequirements('desktop'),
        surface: 'desktop',
      });
      expect(plan.engineId).toBe('none');
    });
  });

  it('isolates run state across the two engines under one suite fixture', async () => {
    const [direct, langgraph] = ENGINE_IDS.map((id) => createConformanceTurnEngine(id));

    await direct.startTurn({
      runId: FIXTURE.runA,
      identityId: FIXTURE.identity,
      message: FIXTURE.message,
    });
    await langgraph.startTurn({
      runId: FIXTURE.runB,
      identityId: FIXTURE.identity,
      message: FIXTURE.message,
    });

    expect(direct.started.has(FIXTURE.runA)).toBe(true);
    expect(direct.started.has(FIXTURE.runB)).toBe(false);
    expect(langgraph.started.has(FIXTURE.runB)).toBe(true);
    expect(langgraph.started.has(FIXTURE.runA)).toBe(false);
    expect(direct.engineId).not.toBe(langgraph.engineId);

    // Same capability matrix resolution for both engines on one fixture surface.
    for (const engineId of ENGINE_IDS) {
      const plan = resolveRunPlan({
        engineId,
        offers: [engineLabelOffer(engineId), proposalOffer, writableMutation, cloudRag],
        requirements: knowledgeWriteRequirements('web'),
        surface: 'web',
      });
      expect(plan.engineId).toBe(engineId);
      expect(plan.missing).toEqual([]);
    }
  });

  it('readonly engine labels (pi/cli) still cannot satisfy knowledge mutation requirements', () => {
    for (const kind of ['engine.pi_readonly', 'engine.cli_readonly'] as const) {
      const plan = resolveRunPlan({
        engineId: kind,
        offers: [
          {
            kind,
            providerId: `label:${kind}`,
            surface: 'any',
            readonly: true,
          },
          proposalOffer,
          readonlyMutation,
          cloudRag,
        ],
        requirements: knowledgeWriteRequirements('web'),
        surface: 'web',
      });
      expect(plan.engineId).toBe('none');
      expect(plan.missing.map((item) => item.kind)).toEqual(['tool.mutation']);
    }
  });

  it('documents residual 314/341: two production Turn Engines; multi-engine runtime still partial', () => {
    // Harness doubles still cover dual-label isolation. Production has:
    // DirectTurnEngine (engine.direct_turn) + ReadonlyAnalysisTurnEngine (engine.pi_readonly).
    const productionNote =
      'production has DirectTurnEngine and ReadonlyAnalysisTurnEngine; multi-engine runtime E2E still incomplete';
    expect(productionNote).toContain('DirectTurnEngine');
    expect(productionNote).toContain('ReadonlyAnalysisTurnEngine');
    expect(ENGINE_IDS).toEqual(['engine.direct_turn', 'engine.langgraph_workflow']);

    const direct = readFileSync(
      resolve(__dirname, '../../turn-engine/direct-turn.engine.ts'),
      'utf8',
    );
    const readonlyEngine = readFileSync(
      resolve(__dirname, '../../turn-engine/readonly-analysis.turn-engine.ts'),
      'utf8',
    );
    expect(direct).toContain("DIRECT_TURN_ENGINE_ID = 'engine.direct_turn'");
    expect(readonlyEngine).toContain("PI_READONLY_TURN_ENGINE_ID = 'engine.pi_readonly'");
    expect(readonlyEngine).toContain('export class ReadonlyAnalysisTurnEngine implements ITurnEnginePort');
  });
});
