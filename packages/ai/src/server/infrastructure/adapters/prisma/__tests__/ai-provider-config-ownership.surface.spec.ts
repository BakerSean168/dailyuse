import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI provider config ownership surface (stage-6 residual 115/169):
 * get/update/delete must identity-scope reads and deletes —
 * never authorize by bare provider primary key alone.
 */
describe('ai provider config ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-ai-provider-config-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../ai-provider-config-prisma.repository.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/ai-provider.routes.ts'),
    'utf8',
  );
  const resolution = readFileSync(
    resolve(__dirname, '../../../../application/use-cases/commands/ai-provider-resolution.ts'),
    'utf8',
  );

  it('port findByIdForIdentity and delete require identityId', () => {
    expect(port).toMatch(/findByIdForIdentity\(\s*identityId: string,\s*id: string/);
    expect(port).toMatch(/delete\(identityId: string, id: string\)/);
  });

  it('port drops bare findById dual method (residual 169)', () => {
    expect(port).not.toContain('findById(id: string): Promise<AIProviderConfigServerDTO | null>;');
    expect(prisma).not.toMatch(/async findById\(id: string\)/);
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('where: { id, identityId, deletedAt: null }');
    expect(prisma).toContain('updateMany({');
    expect(prisma).toContain(
      "throw new Error('Provider config not found for the current identity.');",
    );
  });

  it('HTTP routes pass the full canonical context into get/update/delete', () => {
    expect(routes).toMatch(/controller\.get\(req\.params!\.id,\s*ctx\)/);
    expect(routes).toMatch(/controller\.update\(req\.params!\.id,\s*req\.body,\s*ctx\)/);
    expect(routes).toMatch(/controller\.delete\(req\.params!\.id,\s*ctx\)/);
  });

  it('provider resolution loads explicit providers via findByIdForIdentity', () => {
    expect(resolution).toContain('findByIdForIdentity(');
    expect(resolution).not.toMatch(/providerConfigRepository\.findById\(\s*providerId\s*\)/);
  });
});
