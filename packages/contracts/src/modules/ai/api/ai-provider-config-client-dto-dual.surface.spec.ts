import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 811: AIProviderConfigClientDTO dual body retired.
 * Sole AIProviderConfigClientDTOSchema + z.infer owned by aggregates (branded identityId).
 * response-schemas re-exports schema for OpenAPI list/get envelopes.
 */
describe('ai provider config client dto dual retired (residual 811)', () => {
  const apiDir = __dirname;
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/ai-provider-config-client.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-provider.routes.ts'),
    'utf8',
  );

  it('owns ClientDTO as z.infer of ClientDTOSchema in aggregates', () => {
    expect(aggregate).toContain('Residual 811');
    expect(aggregate).toContain(
      'export const AIProviderConfigClientDTOSchema = z.object({',
    );
    expect(aggregate).toContain(
      'export type AIProviderConfigClientDTO = z.infer<typeof AIProviderConfigClientDTOSchema>',
    );
    expect(aggregate).toContain('identityId: brandedId<IdentityId>()');
    expect(aggregate).toContain('apiKeyMasked: z.string()');
    expect(aggregate).not.toMatch(/export interface AIProviderConfigClientDTO\b/);
    expect(aggregate).not.toMatch(/apiKey:\s/);
  });

  it('response-schemas re-exports ClientDTOSchema without local dual body', () => {
    expect(responseSchemas).toContain('Residual 811');
    expect(responseSchemas).toContain(
      'export { AIModelInfoSchema, AIProviderConfigClientDTOSchema }',
    );
    expect(responseSchemas).not.toMatch(
      /export const AIProviderConfigClientDTOSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain(
      'data: z.array(AIProviderConfigClientDTOSchema)',
    );
  });

  it('OpenAPI provider routes use AIProviderConfigClientDTOSchema', () => {
    expect(routes).toContain('AIProviderConfigClientDTOSchema');
    const hits = routes.split('AIProviderConfigClientDTOSchema').length - 1;
    expect(hits).toBeGreaterThanOrEqual(3);
  });
});
