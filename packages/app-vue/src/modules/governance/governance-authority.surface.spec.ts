/**
 * Governance pilot authority surface (fail closed; plan §5.6).
 *
 * 失败即门的 authority surface：Governance Pinia store 一旦重新出现 server DTO / list /
 * detail / revisions / loading / error / total，或生产组件直接 setQueryData / invalidateQueries，
 * 本 spec 必须失败。
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleRoot = dirname(fileURLToPath(import.meta.url));

/** Strip block + line comments so prose in JSDoc never trips authority checks. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\/.*$/g, '');
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|vue)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const storeSource = code(readFileSync(resolve(moduleRoot, 'stores/governance-store.ts'), 'utf8'));

describe('Governance pilot authority surface (fail closed)', () => {
  it('keeps the Governance store UI-only (no server DTO / list / detail / revisions / loading / error / total)', () => {
    expect(storeSource).not.toContain('RuleClientDTO');
    expect(storeSource).not.toMatch(/rulesById:/);
    expect(storeSource).not.toMatch(/ruleIds:/);
    expect(storeSource).not.toMatch(/currentRuleId:/);
    expect(storeSource).not.toMatch(/revisions:\s*\[/);
    expect(storeSource).not.toMatch(/isLoading:/);
    expect(storeSource).not.toMatch(/error:\s*string/);
    expect(storeSource).not.toMatch(/isInitialized:/);
    expect(storeSource).not.toMatch(/total:/);
  });

  it('keeps the sole `invalidateQueries` / `setQueryData` owners inside the allowed files', () => {
    // invalidateQueries 只允许出现在 platform/server-state/invalidation-dispatcher.ts；
    // setQueryData 只允许出现在 governance 模块内部的 cache-patch helper。
    const disallowed: string[] = [];
    for (const file of walkFiles(moduleRoot)) {
      const relativePath = relative(moduleRoot, file);
      if (relativePath.includes('.spec.') || relativePath.includes('governanceCache.ts')) continue;
      const source = code(readFileSync(file, 'utf8'));
      if (source.includes('invalidateQueries('))
        disallowed.push(`${relativePath}: invalidateQueries`);
      if (source.includes('setQueryData(')) disallowed.push(`${relativePath}: setQueryData`);
    }
    expect(disallowed).toEqual([]);
  });
});
