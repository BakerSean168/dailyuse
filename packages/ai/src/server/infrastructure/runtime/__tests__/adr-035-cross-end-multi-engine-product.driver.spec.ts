/**
 * Residual 407: unit driver for residual 405 cross-end multi-engine product scaffold.
 * Freezes executable unit path; does not claim Playwright/Electron E2E or Pi spawn.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('ADR-035 cross-end multi-engine product unit driver (residual 407)', () => {
  it('runs residual 405 journey implemented_unit steps and skips external_blocked', () => {
    const journey = buildCrossEndMultiEngineProductJourney();
    const scaffoldSummary = summarizeCrossEndMultiEngineProductJourney(journey);
    expect(scaffoldSummary.readyForDriver).toBe(true);

    const run = runCrossEndMultiEngineProductUnitDriver({ readSource: read, journey });
    const summary = summarizeCrossEndMultiEngineProductDriverRun(run);

    expect(summary.total).toBe(16);
    expect(summary.passed).toBe(13);
    expect(summary.skippedExternal).toBe(3);
    expect(summary.failed).toBe(0);
    expect(summary.unitPathGreen).toBe(true);
    expect(summary.claimsFullProductE2E).toBe(false);
    expect(summary.claimsRealPiSpawn).toBe(false);
    expect(run.claimsFullProductE2E).toBe(false);
    expect(run.claimsRealPiSpawn).toBe(false);

    const skipped = run.results.filter((r) => r.status === 'skipped_external');
    expect(skipped.map((r) => r.stepId)).toEqual([
      'e2e.playwright_web_full',
      'e2e.electron_desktop_full',
      'e2e.real_pi_spawn',
    ]);
    expect(skipped.every((r) => Boolean(r.blockedReason))).toBe(true);

    const failed = run.results.filter((r) => r.status === 'failed');
    expect(failed).toEqual([]);
  });

  it('maps each implemented_unit step to non-empty product sources', () => {
    const journey = buildCrossEndMultiEngineProductJourney().filter(
      (step) => step.status === 'implemented_unit',
    );
    for (const step of journey) {
      const sources = resolveCrossEndMultiEngineProductStepSources(step.id);
      expect(sources.length, step.id).toBeGreaterThan(0);
      for (const relative of sources) {
        expect(() => read(relative), relative).not.toThrow();
      }
    }
  });

  it('fails closed when a unit contract is missing from sources', () => {
    const journey = buildCrossEndMultiEngineProductJourney().slice(0, 1);
    const run = runCrossEndMultiEngineProductUnitDriver({
      readSource: () => '/* empty product surface */',
      journey,
    });
    expect(run.failed).toBe(1);
    expect(run.passed).toBe(0);
    expect(run.results[0]?.status).toBe('failed');
    expect(run.results[0]?.missingContracts.length).toBeGreaterThan(0);
    expect(summarizeCrossEndMultiEngineProductDriverRun(run).unitPathGreen).toBe(false);
  });

  it('never claims Playwright/Electron full product E2E or real Pi spawn in driver surface', () => {
    const driver = read(
      'packages/ai/src/server/infrastructure/runtime/adr-035-cross-end-multi-engine-product.driver.ts',
    );
    expect(driver).toContain('Residual 407');
    expect(driver).toContain('claimsFullProductE2E: false');
    expect(driver).toContain('claimsRealPiSpawn: false');
    expect(driver).toContain('skipped_external');
    expect(driver).not.toMatch(/full multi-engine product E2E passed/i);
    expect(driver).not.toMatch(/Playwright green/i);
    expect(driver).not.toContain('child_process');
  });

  it('keeps process spike out of product unit driver source map', () => {
    const productStepIds = buildCrossEndMultiEngineProductJourney()
      .filter((step) => step.status === 'implemented_unit')
      .map((step) => step.id);
    const allSources = productStepIds.flatMap((id) =>
      resolveCrossEndMultiEngineProductStepSources(id),
    );
    expect(allSources.some((p) => p.includes('pi-readonly-process.adapter'))).toBe(false);

    const facade = read(
      'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
    );
    expect(facade).not.toContain('process.pi_readonly_spike');
    expect(facade).not.toContain('PiReadonlyProcessAdapter');
  });
});

  it('covers residual 417 isolation/composition/LangGraph sanitization unit steps', () => {
    const journey = buildCrossEndMultiEngineProductJourney();
    const ids = journey.map((step) => step.id);
    expect(ids).toContain('ui.timeline_surface_isolation');
    expect(ids).toContain('ui.workbench_timeline_composition');
    expect(ids).toContain('ui.langgraph_diagnostic_sanitization');

    const run = runCrossEndMultiEngineProductUnitDriver({ readSource: read, journey });
    const byId = Object.fromEntries(run.results.map((r) => [r.stepId, r]));
    expect(byId['ui.timeline_surface_isolation']?.status).toBe('passed');
    expect(byId['ui.workbench_timeline_composition']?.status).toBe('passed');
    expect(byId['ui.langgraph_diagnostic_sanitization']?.status).toBe('passed');
    expect(run.passed).toBe(13);
    expect(run.skippedExternal).toBe(3);
    expect(run.claimsFullProductE2E).toBe(false);
  });
