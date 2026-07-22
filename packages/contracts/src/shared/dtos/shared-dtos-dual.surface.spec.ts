import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 641: shared/dtos dual dead surfaces retired.
 * Module-scoped contracts live under modules/*; do not reintroduce generic shared dual DTOs.
 */
const here = dirname(fileURLToPath(import.meta.url));

describe('shared/dtos dual dead surfaces retired (residual 641)', () => {
  it('does not keep chart or batch-operation dual sources', () => {
    const index = readFileSync(join(here, 'index.ts'), 'utf8');
    expect(index).toContain('Residual 641');
    expect(index).not.toMatch(/export\s+type\s*\{\s*ChartDataDTO/);
    expect(index).not.toMatch(/export\s+type\s*\{\s*BatchOperationResponseDTO/);
    expect(existsSync(join(here, 'chart-data.dto.ts'))).toBe(false);
    expect(existsSync(join(here, 'batch-operation-res.dto.ts'))).toBe(false);
  });

  it('shared/dtos directory only keeps index + surface lock files', () => {
    const names = readdirSync(here).sort();
    expect(names).toEqual(['index.ts', 'shared-dtos-dual.surface.spec.ts']);
  });
});
