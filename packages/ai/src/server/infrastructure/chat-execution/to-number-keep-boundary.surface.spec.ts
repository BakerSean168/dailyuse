import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1105: toNumber keep-boundary within AI chat-execution.
 * - ai-service-chat-execution.adapter: number-only finite (provider usage tokens)
 * - goal-planning-response: number + numeric string Number() (LLM JSON)
 * Soft residual 1101: toTimestamp keep-boundary family remains.
 * Soft residual 1099: asRecord/toRecord keep-boundary remains.
 * Soft residual 1109: toStringArray keep-boundary family remains.
 * Does not flip §13.2 checkboxes.
 */
describe('toNumber AI chat-execution keep-boundary (residual 1105)', () => {
  const dir = __dirname;
  const adapter = readFileSync(resolve(dir, 'ai-service-chat-execution.adapter.ts'), 'utf8');
  const goalPlanning = readFileSync(resolve(dir, 'goal-planning-response.ts'), 'utf8');

  it('owns Residual 1105 keep-boundary markers on adapter number-only toNumber', () => {
    expect(adapter).toContain('Residual 1105 keep-boundary');
    expect(adapter).toContain('Soft residual 1105');
    expect(adapter).toMatch(/function toNumber\b/);
    expect(adapter).toContain("typeof value === 'number' && Number.isFinite(value)");
    // adapter must not parse numeric strings
    expect(adapter).not.toMatch(/function toNumber[\s\S]{0,250}Number\(value\)/);
    expect(adapter).not.toMatch(/function toNumber[\s\S]{0,200}typeof value === 'string'/);
  });

  it('differs from goal-planning string-parse toNumber (no force-merge)', () => {
    expect(goalPlanning).toContain('Residual 1105 keep-boundary');
    expect(goalPlanning).toContain('Soft residual 1105');
    expect(goalPlanning).toMatch(/function toNumber\b/);
    expect(goalPlanning).toContain("typeof value === 'string'");
    expect(goalPlanning).toContain('Number(value)');
    expect(goalPlanning).toContain("typeof value === 'number' && Number.isFinite(value)");
  });

  it('documents residual 1105 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'to-number-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1105');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
