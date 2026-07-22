import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 305 + 311: ADR-035 Agent Host ports remain stage-0 shape freezes.
 * ITurnEnginePort / ICapabilityResolverPort / IWorkflowAdapterPort / IProposalKernelPort
 * are contracts only — production packages do not implement multi-engine Turn Engine,
 * Workflow Adapter, Capability Resolver, or Proposal Kernel adapters yet.
 * Multi-engine isolation is enforced at capability resolve/start gates and the
 * multi-engine Turn Engine conformance harness (in-suite doubles only).
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

  it('has no production class implementing Agent Host stage-0 ports yet', () => {
    const roots = [
      resolve(repoRoot, 'packages/ai/src'),
      resolve(repoRoot, 'apps/ai-service'),
      resolve(repoRoot, 'apps/api/src'),
      resolve(repoRoot, 'apps/desktop/src'),
    ];
    const portMarkers = [
      'implements ITurnEnginePort',
      'implements IWorkflowAdapterPort',
      'implements ICapabilityResolverPort',
      'implements IProposalKernelPort',
    ] as const;
    const offenders: string[] = [];
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
        // Allow the port definition itself and pure type re-exports.
        if (full.endsWith(`${'agent-host'}/ports.ts`)) continue;
        if (source.includes('export interface ITurnEnginePort')) continue;
        const hit = portMarkers.some((marker) => source.includes(marker));
        const turnTyped =
          source.includes(': ITurnEnginePort') && source.includes('startTurn') && source.includes('class ');
        if (!hit && !turnTyped) continue;
        if (
          source.includes('export type') &&
          !source.includes('class ') &&
          portMarkers.some((marker) => source.includes(marker.replace('implements ', '')))
        ) {
          continue;
        }
        offenders.push(full.replace(repoRoot + '/', ''));
      }
    }

    for (const root of roots) walk(root);
    expect(offenders).toEqual([]);
  });

  it('points multi-engine conformance at the residual 309 harness (doubles only)', () => {
    const harness = resolve(
      repoRoot,
      'packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-multi-engine-turn-conformance.harness.spec.ts',
    );
    expect(existsSync(harness)).toBe(true);
    const harnessText = readFileSync(harness, 'utf8');
    expect(harnessText).toContain("engine.direct_turn");
    expect(harnessText).toContain("engine.langgraph_workflow");
    expect(harnessText).toContain('createConformanceTurnEngine');
    expect(harnessText).toContain('ITurnEnginePort');
    expect(harnessText).toContain('production packages still do not implement');
  });
});
