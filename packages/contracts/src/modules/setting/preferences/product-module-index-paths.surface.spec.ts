import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 331: product module-index markdown must not link to deleted
 * domain-server / application-server / infrastructure-server / controllers paths.
 */
describe('product module-index path integrity surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const indexDir = resolve(repoRoot, 'docs/product/module-index');

  it('all packages/apps/docs file links in module-index exist on disk', () => {
    const files = readdirSync(indexDir).filter((name) => name.endsWith('.md'));
    expect(files.length).toBeGreaterThan(5);

    const missing: string[] = [];
    const legacy: string[] = [];
    for (const name of files) {
      const text = readFileSync(resolve(indexDir, name), 'utf8');
      if (
        text.includes('/src/domain-server/') ||
        text.includes('/src/application-server/') ||
        text.includes('/src/infrastructure-server/') ||
        text.includes('/src/controllers/')
      ) {
        legacy.push(name);
      }
      const paths = [...text.matchAll(/\[`((?:packages|apps|docs)\/[^`]+)`\]/g)].map((m) => m[1]);
      for (const rel of paths) {
        if (!existsSync(resolve(repoRoot, rel))) {
          missing.push(`${name}: ${rel}`);
        }
      }
    }

    expect(legacy).toEqual([]);
    expect(missing).toEqual([]);
  });
});
