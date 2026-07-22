import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 305/311/314: ADR-035 Agent Host ports.
 * Stage 0 shapes stay frozen. Residual 314 introduces the first production
 * Turn Engine (`DirectTurnEngine` / engine.direct_turn) only. Workflow Adapter,
 * Capability Resolver, and Proposal Kernel remain unimplemented in production.
 * Multi-engine isolation still relies on resolve/start gates + conformance harness;
 * a second production engine (langgraph/pi/cli) is not wired yet.
 */
describe('agent-host stage-0 ports freeze surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const ports = readFileSync(resolve(__dirname, 'ports.ts'), 'utf8');
  const capabilities = readFileSync(resolve(__dirname, 'capabilities.ts'), 'utf8');

  it('freezes Turn Engine / Capability / Workflow adapter port shapes', () => {
    expect(ports).toContain('export interface ITurnEnginePort');
    expect(ports).toContain('export interface ICapabilityResolverPort');
    expect(ports).toContain('export interface IWorkflowAdapterPort');
    expect(ports).toContain('export interface IProposalKernelPort');
    expect(ports).toContain('Stage 0 freezes shapes only');
    expect(ports).toContain('startTurn(input: {');
    expect(ports).toContain("status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'");
  });

  it('declares multi-engine capability kinds without silent expansion', () => {
    expect(capabilities).toContain("'engine.direct_turn'");
    expect(capabilities).toContain("'engine.langgraph_workflow'");
    expect(capabilities).toContain("'engine.pi_readonly'");
    expect(capabilities).toContain("'engine.cli_readonly'");
    expect(capabilities).toContain('export function resolveRunPlan');
    expect(capabilities).toContain('Fail closed');
    expect(capabilities).toContain("engineId: missing.length > 0 ? 'none' : input.engineId");
  });

  it('allows only DirectTurnEngine as the first production Turn Engine (no other Host ports)', () => {
    const roots = [
      resolve(repoRoot, 'packages/ai/src'),
      resolve(repoRoot, 'apps/ai-service'),
      resolve(repoRoot, 'apps/api/src'),
      resolve(repoRoot, 'apps/desktop/src'),
    ];
    const allowedTurnEngine = 'packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts';
    const forbiddenMarkers = [
      'implements IWorkflowAdapterPort',
      'implements ICapabilityResolverPort',
      'implements IProposalKernelPort',
    ] as const;
    const turnEngines: string[] = [];
    const forbidden: string[] = [];
    const skipDirs = new Set(['dist', 'node_modules', '__tests__', 'tests']);

    function walk(dir: string) {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          if (skipDirs.has(entry.name)) continue;
          walk(full);
          continue;
        }
        if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
        if (entry.name.includes('.spec.') || entry.name.includes('.test.')) continue;
        if (entry.name.endsWith('.surface.spec.ts')) continue;
        if (entry.name.includes('.harness.spec.')) continue;
        const source = readFileSync(full, 'utf8');
        if (full.endsWith(`${'agent-host'}/ports.ts`)) continue;
        if (source.includes('export interface ITurnEnginePort')) continue;
        const rel = full.replace(repoRoot + '/', '');
        if (source.includes('implements ITurnEnginePort')) {
          turnEngines.push(rel);
        }
        if (forbiddenMarkers.some((marker) => source.includes(marker))) {
          forbidden.push(rel);
        }
      }
    }

    for (const root of roots) walk(root);
    expect(turnEngines).toEqual([allowedTurnEngine]);
    expect(forbidden).toEqual([]);

    const direct = readFileSync(resolve(repoRoot, allowedTurnEngine), 'utf8');
    expect(direct).toContain("DIRECT_TURN_ENGINE_ID = 'engine.direct_turn'");
    expect(direct).toContain('export class DirectTurnEngine implements ITurnEnginePort');
    expect(direct).not.toContain('implements IWorkflowAdapterPort');
  });

  it('points multi-engine conformance at the residual 309 harness (doubles + DirectTurnEngine note)', () => {
    const harness = resolve(
      repoRoot,
      'packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-multi-engine-turn-conformance.harness.spec.ts',
    );
    expect(existsSync(harness)).toBe(true);
    const harnessText = readFileSync(harness, 'utf8');
    expect(harnessText).toContain('engine.direct_turn');
    expect(harnessText).toContain('engine.langgraph_workflow');
    expect(harnessText).toContain('createConformanceTurnEngine');
    expect(harnessText).toContain('ITurnEnginePort');
    expect(harnessText).toContain('DirectTurnEngine only');
    expect(harnessText).toContain('multi-engine');
  });
});
