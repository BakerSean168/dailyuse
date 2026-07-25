import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 339: product feature-map auth/AI status stays current, and retired
 * web public debug/test pages stay deleted (stage-6 runtime surface cleanup).
 */
describe('product feature-map + web public debug surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const featureMap = readFileSync(resolve(repoRoot, 'docs/product/feature-map.md'), 'utf8');
  const publicDir = resolve(repoRoot, 'apps/web/public');

  it('feature-map auth row is not the retired OAuth skeleton claim', () => {
    expect(featureMap).not.toContain('GitHub 服务端骨架已落地');
    expect(featureMap).not.toContain('只完成服务端 callback 骨架');
    expect(featureMap).toContain('三入口主路径已贯通');
    expect(featureMap).toContain('identity-only');
    expect(featureMap).toContain('read:user');
    expect(featureMap).toContain('user:email');
    expect(featureMap).toContain('apps/web/src/auth');
  });

  it('feature-map AI row reflects ADR-035 Host production adapters', () => {
    expect(featureMap).toContain('ADR-035 Host 部分落地');
    expect(featureMap).toContain('DirectTurn');
    expect(featureMap).toContain('CustomModelGateway');
    expect(featureMap).toContain('CapabilityResolver');
  });

  it('retired web public debug/test pages stay deleted (residual 337/339)', () => {
    for (const name of [
      'editor-test.html',
      'schedule-test.html',
      'sse-test.html',
      'debug-events.js',
    ]) {
      expect(existsSync(resolve(publicDir, name))).toBe(false);
    }
    // Product static assets that must remain.
    expect(existsSync(resolve(publicDir, 'favicon.ico'))).toBe(true);
    expect(existsSync(resolve(publicDir, 'sw.js'))).toBe(true);
  });
});
