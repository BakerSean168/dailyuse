import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 305: ADR-035 Agent Host ports remain stage-0 shape freezes.
 * ITurnEnginePort / ICapabilityResolverPort / IWorkflowAdapterPort are contracts
 * only — production packages do not implement multi-engine Turn Engine adapters yet.
 * Multi-engine isolation is enforced at capability resolve/start gates instead.
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

  it('has no production class implementing ITurnEnginePort yet', () => {
    const roots = [
      resolve(repoRoot, 'packages/ai/src'),
      resolve(repoRoot, 'apps/ai-service'),
      resolve(repoRoot, 'apps/api/src'),
      resolve(repoRoot, 'apps/desktop/src'),
    ];
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
        const text = readFileSync(full, 'utf8');
        if (
          text.includes('implements ITurnEnginePort') ||
          text.includes(': ITurnEnginePort') && text.includes('startTurn')
        ) {
          // Allow the port definition itself and pure type re-exports.
          if (full.endsWith(`${'agent-host'}/ports.ts`)) continue;
          if (text.includes('export interface ITurnEnginePort')) continue;
          if (text.includes('export type') && text.includes('ITurnEnginePort') && !text.includes('class ')) {
            continue;
          }
          offenders.push(full.replace(repoRoot + '/', ''));
        }
      }
    }

    for (const root of roots) walk(root);
    expect(offenders).toEqual([]);
  });
});
