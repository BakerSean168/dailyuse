import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 250: governance module has no local types.ts dual re-export barrel.
 * Callers import DTO/req types from @memoflow/contracts/governance.
 */
describe('governance types export single-track surface', () => {
  const dir = __dirname;
  const dual = resolve(dir, 'types.ts');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const useGov = readFileSync(resolve(dir, 'composables/useGovernance.ts'), 'utf8');
  const store = readFileSync(resolve(dir, 'stores/governance-store.ts'), 'utf8');

  it('drops modules/governance/types.ts dual barrel', () => {
    expect(existsSync(dual)).toBe(false);
  });

  it('module index and internals import contracts governance types only', () => {
    expect(index).toContain("from '@memoflow/contracts/governance'");
    expect(index).not.toContain("from './types'");
    expect(useGov).toContain("from '@memoflow/contracts/governance'");
    expect(useGov).not.toContain("from '../types'");
    expect(store).toContain("from '@memoflow/contracts/governance'");
    expect(store).not.toContain("from '../types'");
  });
});
