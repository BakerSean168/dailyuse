import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 721: AI provider test result dual body retired.
 * TestAIProviderResultDTO reuses TestAIProviderResultDTOSchema only.
 */
describe('provider test result dual retired (residual 721)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(
    resolve(apiDir, '../dtos/provider-test-result.dto.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const providerDto = readFileSync(resolve(apiDir, 'ai-provider-config.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-provider.routes.ts'),
    'utf8',
  );

  it('exports TestAIProviderResultDTOSchema as sole test-result shape from dto module', () => {
    expect(dto).toContain('Residual 721');
    expect(dto).toContain('export const TestAIProviderResultDTOSchema = z.object({');
  });

  it('semantic DTO is z.infer alias without interface dual body', () => {
    expect(dto).toContain(
      'export type TestAIProviderResultDTO = z.infer<typeof TestAIProviderResultDTOSchema>',
    );
    expect(dto).not.toMatch(/export interface TestAIProviderResultDTO\b/);
  });

  it('response-schemas re-exports dto-owned schema; provider res + routes use it', () => {
    expect(responseSchemas).toContain('Residual 721');
    expect(responseSchemas).toContain("from '../dtos/provider-test-result.dto'");
    expect(responseSchemas).toContain('export { TestAIProviderResultDTOSchema }');
    expect(responseSchemas).not.toMatch(
      /export const TestAIProviderResultDTOSchema = z\.object\(\{/,
    );
    expect(providerDto).toContain('export type TestAIProviderRes = TestAIProviderResultDTO');
    expect(routes).toContain('TestAIProviderResultDTOSchema');
  });
});
