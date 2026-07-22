import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 235: AI domain has no dual top-level ai-provider-config barrel.
 * Canonical export is aggregates/ai-provider-config (+ aggregates/index).
 */
describe('AI provider config domain barrel single-track surface', () => {
  const domainDir = __dirname;
  const dualBarrel = resolve(domainDir, 'ai-provider-config.ts');
  const aggregate = resolve(domainDir, 'aggregates/ai-provider-config.ts');

  it('keeps aggregate file and drops dual domain-root barrel', () => {
    expect(existsSync(aggregate)).toBe(true);
    expect(existsSync(dualBarrel)).toBe(false);
  });
});
