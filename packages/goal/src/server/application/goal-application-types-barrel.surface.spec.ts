import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 247: goal application has no dual types.ts barrel re-exporting
 * ExecutionContext from contracts. Import ExecutionContext from
 * @memoflow/contracts/shared directly.
 */
describe('goal application types barrel single-track surface', () => {
  const dual = resolve(__dirname, 'types.ts');

  it('drops application/types.ts contracts re-export dual', () => {
    expect(existsSync(dual)).toBe(false);
  });
});
