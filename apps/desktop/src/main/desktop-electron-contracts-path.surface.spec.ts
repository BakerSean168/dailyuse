import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 242: desktop main does not dual-re-export electron contracts.
 * Callers import IElectronModule* from @memoflow/contracts/electron only.
 */
describe('desktop electron contracts path single-track surface', () => {
  const mainDir = __dirname;
  const dualDir = resolve(mainDir, 'shared/contracts');
  const dualIndex = resolve(mainDir, 'shared/contracts/index.ts');
  const dualModule = resolve(mainDir, 'shared/contracts/electron-module.ts');

  it('drops shared/contracts dual re-export barrel', () => {
    expect(existsSync(dualDir)).toBe(false);
    expect(existsSync(dualIndex)).toBe(false);
    expect(existsSync(dualModule)).toBe(false);
  });
});
