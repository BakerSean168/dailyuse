import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Governance composition-root surface contract.
 * 治理组合根表面契约。
 *
 * Locks the plan §3.5 host-composer architecture: the api/electron modules are
 * transport+lifecycle adapters only, hosts assemble via the root ingredient
 * factories, and apps never deep-import `@memoflow/governance/server/...`.
 *
 * 锁定计划 §3.5 的宿主 composer 架构：api/electron 模块只是传输+生命周期适配器，
 * 宿主通过根入口的 ingredient factory 装配，apps 绝不深导入
 * `@memoflow/governance/server/...`。
 */

const GOVERNANCE_SRC = resolve(__dirname, '../../..');
const API_MODULE = resolve(GOVERNANCE_SRC, 'api/module.ts');
const ELECTRON_MODULE = resolve(GOVERNANCE_SRC, 'electron/index.ts');
const API_SRC = resolve(GOVERNANCE_SRC, '../../../apps/api/src');
const DESKTOP_MAIN_SRC = resolve(GOVERNANCE_SRC, '../../../apps/desktop/src/main');

const ALLOWED_API_SPECIFIERS = ['@memoflow/governance', '@memoflow/governance/api'];
const ALLOWED_DESKTOP_SPECIFIERS = ['@memoflow/governance', '@memoflow/governance/electron'];
const GOVERNANCE_IMPORT_PATTERN = /(?:from\s+|import\s*\()\s*['"](@memoflow\/governance(?:\/[^'"]*)?)['"]/g;

describe('governance composition-root surface', () => {
  it('api module is a transport/lifecycle adapter with no composition internals', () => {
    const source = stripComments(readFileSync(API_MODULE, 'utf8'));
    expect(source).not.toMatch(/\bPrismaClient\b/);
    expect(source).not.toMatch(/context\.db/);
    expect(source).not.toMatch(/\bcreateGovernancePrismaModule\b/);
  });

  it('electron module has no PowerSync composition call and no active module singleton', () => {
    const source = stripComments(readFileSync(ELECTRON_MODULE, 'utf8'));
    expect(source).not.toMatch(/createGovernancePowerSyncModule\s*\(/);
    expect(source).not.toMatch(/ctx\.db/);
    expect(source).not.toMatch(/\bactiveGovernanceModule\b/);
  });

  it('apps/api imports governance only from the root and /api public seams', () => {
    const specifiers = collectGovernanceImportSpecifiers(API_SRC);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(ALLOWED_API_SPECIFIERS).toContain(specifier);
    }
  });

  it('apps/desktop main imports governance only from the root and /electron public seams', () => {
    const specifiers = collectGovernanceImportSpecifiers(DESKTOP_MAIN_SRC);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(ALLOWED_DESKTOP_SPECIFIERS).toContain(specifier);
    }
  });
});

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function collectGovernanceImportSpecifiers(dir: string): string[] {
  const specifiers: string[] = [];
  const visit = (currentPath: string) => {
    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = resolve(currentPath, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (/(\.spec|\.test)\.[cm]?[jt]sx?$/.test(entry.name)) continue;
      const content = readFileSync(fullPath, 'utf8');
      GOVERNANCE_IMPORT_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = GOVERNANCE_IMPORT_PATTERN.exec(content)) !== null) {
        specifiers.push(match[1]);
      }
    }
  };
  visit(dir);
  return specifiers;
}
