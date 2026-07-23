import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 683: AI provider create request schema name dual retired.
 * CreateAIProviderConfigSchema owns the body; no private base schema alias.
 */
describe('ai provider create schema name dual retired (residual 683)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-provider-config.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-provider.routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(
      apiDir,
      '../../../../../ai/src/server/transport/ai-provider-config.controller.ts',
    ),
    'utf8',
  );

  it('exports CreateAIProviderConfigSchema body without private base schema dual', () => {
    expect(dto).toContain('Residual 683');
    expect(dto).toContain('export const CreateAIProviderConfigSchema = z.object({');
    expect(dto).not.toMatch(/export const CreateAIProviderConfigSchema\s*=\s*\w+Schema\s*;/);
    expect(dto).not.toMatch(/const ProviderBaseSchema\b/);
    expect(dto).toContain(
      'export type CreateAIProviderConfigReq = z.infer<typeof CreateAIProviderConfigSchema>',
    );
  });

  it('routes and controller parse CreateAIProviderConfigSchema only', () => {
    expect(routes).toContain('CreateAIProviderConfigSchema');
    expect(routes).not.toMatch(/ProviderBaseSchema\b/);
    expect(controller).toContain('CreateAIProviderConfigSchema');
    expect(controller).not.toMatch(/ProviderBaseSchema\b/);
  });
});
