import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Governance API runtime composer surface.
 * 治理 API runtime composer 表面契约。
 *
 * Locks the Step 3 wiring: apps/api/src/server.ts must compose governance through
 * the runtime composer and must no longer reference the retired
 * `GovernanceApiModule` constant or the `@memoflow/governance/api` seam.
 *
 * 锁定 Step 3 接线：apps/api/src/server.ts 必须通过 runtime composer 组装治理，
 * 且不再引用已退役的 `GovernanceApiModule` 常量或 `@memoflow/governance/api` seam。
 */
describe('governance API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const server = readFileSync(resolve(dir, 'server.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-governance.ts'), 'utf8');

  it('server.ts composes governance via composeGovernance({ db: prisma })', () => {
    expect(server).toContain("from './runtime/compose-governance'");
    expect(server).toContain('composeGovernance({ db: prisma })');
    expect(server).toContain('.register(governanceApiModule)');
  });

  it('server.ts no longer imports the retired GovernanceApiModule constant or the governance/api seam', () => {
    expect(server).not.toMatch(/\bGovernanceApiModule\b/);
    expect(server).not.toContain("from '@memoflow/governance/api'");
  });

  it('composer only touches the narrow Prisma capability (no CloudAuth, no storage base dir)', () => {
    expect(composer).toContain('interface ComposeGovernanceDependencies');
    expect(composer).not.toContain('CloudAuth');
    expect(composer).not.toContain('repositoryStorageBaseDir');
    expect(composer).not.toContain('@memoflow/governance/server');
  });
});
