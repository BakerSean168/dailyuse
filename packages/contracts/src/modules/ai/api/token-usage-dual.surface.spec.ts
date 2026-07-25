import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 727: AI token usage dual body retired.
 * TokenUsageDTO reuses TokenUsageSchema only (VO-owned; response-schemas re-exports).
 */
describe('token usage dual retired (residual 727)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(resolve(apiDir, '../value-objects/token-usage.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const goalGen = readFileSync(
    resolve(apiDir, '../dtos/goal-generation-result.dto.ts'),
    'utf8',
  );

  it('exports TokenUsageSchema as sole token-usage shape from VO module', () => {
    expect(vo).toContain('Residual 727');
    expect(vo).toContain('export const TokenUsageSchema = z.object({');
  });

  it('semantic DTO is z.infer alias without interface dual body', () => {
    expect(vo).toContain(
      'export type TokenUsageDTO = z.infer<typeof TokenUsageSchema>',
    );
    expect(vo).not.toMatch(/export interface TokenUsageDTO\b/);
  });

  it('response-schemas and goal generation reuse VO TokenUsageSchema (no local duals)', () => {
    expect(responseSchemas).toContain('Residual 727');
    expect(responseSchemas).toContain("from '../value-objects/token-usage'");
    expect(responseSchemas).toContain('export { TokenUsageSchema }');
    expect(responseSchemas).not.toMatch(/const TokenUsageSchema = z\.object\(\{/);
    expect(goalGen).toContain('Residual 727');
    expect(goalGen).toContain('tokenUsage: TokenUsageSchema');
    expect(goalGen).not.toMatch(/GoalTokenUsageSchema/);
  });
});
