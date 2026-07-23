import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 751: AI model-info dual body retired.
 * Soft residual 811: response-schemas re-exports AIModelInfoSchema with ClientDTOSchema.
 * AIModelInfo reuses AIModelInfoSchema only.
 */
describe('ai model-info dual retired (residual 751)', () => {
  const apiDir = __dirname;
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/ai-provider-config-client.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports AIModelInfoSchema as sole shape from aggregate module', () => {
    expect(aggregate).toContain('Residual 751');
    expect(aggregate).toContain('export const AIModelInfoSchema = z.object({');
  });

  it('semantic type is z.infer alias without interface dual body', () => {
    expect(aggregate).toContain(
      'export type AIModelInfo = z.infer<typeof AIModelInfoSchema>',
    );
    expect(aggregate).not.toMatch(/export interface AIModelInfo\b/);
  });

  it('response-schemas re-exports aggregate-owned schema (no local dual body)', () => {
    expect(responseSchemas).toContain('Residual 751');
    expect(responseSchemas).toContain('Residual 811');
    expect(responseSchemas).toContain("from '../aggregates/ai-provider-config-client'");
    expect(responseSchemas).toContain(
      'export { AIModelInfoSchema, AIProviderConfigClientDTOSchema }',
    );
    expect(responseSchemas).not.toMatch(/const AIModelInfoSchema = z\.object\(\{/);
    // Residual 811: availableModels lives on aggregate-owned ClientDTOSchema, not response-schemas body.
    expect(aggregate).toContain('availableModels: z.array(AIModelInfoSchema)');
  });
});
