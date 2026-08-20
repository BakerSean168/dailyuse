/** Batch-B source driver for the historical ADR-035 scaffold compatibility name. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCrossEndMultiEngineProductJourney,
  summarizeCrossEndMultiEngineProductJourney,
} from '../adr-035-cross-end-multi-engine-product.scaffold';
import {
  resolveCrossEndMultiEngineProductStepSources,
  runCrossEndMultiEngineProductUnitDriver,
  summarizeCrossEndMultiEngineProductDriverRun,
} from '../adr-035-cross-end-multi-engine-product.driver';

const root = resolve(__dirname, '../../../../../../..');
const read = (relative: string) => readFileSync(resolve(root, relative), 'utf8');

describe('ADR-035 historical source driver after Mastra cutover', () => {
  it('passes every implemented cutover contract and skips only explicit external runners', () => {
    const journey = buildCrossEndMultiEngineProductJourney();
    expect(summarizeCrossEndMultiEngineProductJourney(journey).readyForDriver).toBe(true);

    const run = runCrossEndMultiEngineProductUnitDriver({ readSource: read, journey });
    const summary = summarizeCrossEndMultiEngineProductDriverRun(run);

    expect(summary).toMatchObject({
      total: 17,
      passed: 16,
      failed: 0,
      skippedExternal: 1,
      unitPathGreen: true,
      claimsFullProductE2E: false,
      claimsRealPiSpawn: false,
    });
    expect(run.results.filter((result) => result.status === 'failed')).toEqual([]);
    expect(
      run.results
        .filter((result) => result.status === 'skipped_external')
        .map((result) => result.stepId),
    ).toEqual(['e2e.electron_desktop_full']);
  });

  it('maps every implemented step to readable non-empty product sources', () => {
    for (const step of buildCrossEndMultiEngineProductJourney().filter(
      (candidate) => candidate.status === 'implemented_unit',
    )) {
      const sources = resolveCrossEndMultiEngineProductStepSources(step.id);
      expect(sources.length, step.id).toBeGreaterThan(0);
      for (const relative of sources) {
        expect(() => read(relative), `${step.id}: ${relative}`).not.toThrow();
      }
    }
  });

  it('fails closed when a required positive contract disappears', () => {
    const journey = buildCrossEndMultiEngineProductJourney().slice(0, 1);
    const run = runCrossEndMultiEngineProductUnitDriver({
      readSource: () => '/* empty product surface */',
      journey,
    });

    expect(run.failed).toBe(1);
    expect(run.passed).toBe(0);
    expect(run.results[0]?.missingContracts.length).toBeGreaterThan(0);
    expect(summarizeCrossEndMultiEngineProductDriverRun(run).unitPathGreen).toBe(false);
  });

  it('fails closed when a required absence regresses', () => {
    const step = buildCrossEndMultiEngineProductJourney().find(
      (candidate) => candidate.id === 'ui.legacy_profile_selector_retired',
    );
    expect(step).toBeDefined();

    const run = runCrossEndMultiEngineProductUnitDriver({
      readSource: () => '<div data-testid="ai-chat-execution-profile" />',
      journey: [step!],
    });

    expect(run.failed).toBe(1);
    expect(run.results[0]?.missingContracts).toContain('!ai-chat-execution-profile');
  });

  it('keeps the driver unable to claim full product E2E or real Pi spawn', () => {
    const driver = read(
      'packages/ai/src/server/infrastructure/runtime/adr-035-cross-end-multi-engine-product.driver.ts',
    );
    expect(driver).toContain('claimsFullProductE2E: false');
    expect(driver).toContain('claimsRealPiSpawn: false');
    expect(driver).toContain('skipped_external');
    expect(driver).not.toContain('child_process');
  });

  it('proves the default product source map no longer depends on the deleted open-chat helpers', () => {
    const implementedSources = buildCrossEndMultiEngineProductJourney()
      .filter((step) => step.status === 'implemented_unit')
      .flatMap((step) => resolveCrossEndMultiEngineProductStepSources(step.id));

    expect(implementedSources.some((path) => path.includes('hostOpenChatCancel'))).toBe(false);
    expect(implementedSources.some((path) => path.includes('hostOpenChatTurnMemory'))).toBe(false);
    expect(implementedSources.some((path) => path.includes('pi-readonly-process.adapter'))).toBe(
      false,
    );
  });

  it('covers persistent history, delete ordering, metadata and workflow isolation as first-class steps', () => {
    const journey = buildCrossEndMultiEngineProductJourney();
    const ids = journey.map((step) => step.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'runtime.restart_persistence',
        'runtime.owner_scoped_delete',
        'runtime.model_usage_metadata',
        'runtime.python_chat_not_composed',
        'ui.workflow_timeline_isolation',
        'ui.workbench_without_open_chat_engine_badges',
      ]),
    );

    const run = runCrossEndMultiEngineProductUnitDriver({ readSource: read, journey });
    const byId = Object.fromEntries(run.results.map((result) => [result.stepId, result]));
    for (const id of [
      'runtime.restart_persistence',
      'runtime.owner_scoped_delete',
      'runtime.model_usage_metadata',
      'runtime.python_chat_not_composed',
      'ui.workflow_timeline_isolation',
      'ui.workbench_without_open_chat_engine_badges',
    ]) {
      expect(byId[id]?.status, id).toBe('passed');
      expect(byId[id]?.missingContracts, id).toEqual([]);
    }
  });
});
