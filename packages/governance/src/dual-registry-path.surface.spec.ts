import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Elegance E2: Dual Registry path lock.
 * Machine ledger + human summary must exist; classes are closed set.
 */
describe('dual registry path lock (elegance E2)', () => {
  const root = resolve(__dirname, '../../..');
  const jsonPath = resolve(root, 'tools/governance/dual-registry.json');
  const mdPath = resolve(root, 'docs/governance/dual-registry.md');

  it('keeps machine ledger and human summary on disk', () => {
    expect(existsSync(jsonPath), jsonPath).toBe(true);
    expect(existsSync(mdPath), mdPath).toBe(true);
  });

  it('classifies every entry; no unknown class; coverage note', () => {
    const reg = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
      counts: { total: number; by_class: Record<string, number> };
      entries: Array<{ class: string; path: string }>;
      post_e3b?: { drop_pct?: number; dual_surface_files?: number };
      baseline?: { dual_surface?: number };
    };
    expect(reg.counts.total).toBeGreaterThan(100);
    expect(reg.entries.length).toBe(reg.counts.total);
    const allowed = new Set(['retired', 'keep_boundary', 'open_S', 'open_M', 'open_X']);
    for (const e of reg.entries) {
      expect(allowed.has(e.class), e.path).toBe(true);
    }
    const classified = Object.values(reg.counts.by_class).reduce((a, b) => a + b, 0);
    expect(classified).toBe(reg.counts.total);
    // E3b: dual surface file count dropped ≥ 25% from baseline 237
    if (reg.post_e3b?.dual_surface_files != null && reg.baseline?.dual_surface) {
      const drop = 1 - reg.post_e3b.dual_surface_files / reg.baseline.dual_surface;
      expect(drop).toBeGreaterThanOrEqual(0.25);
    }
  });
});
