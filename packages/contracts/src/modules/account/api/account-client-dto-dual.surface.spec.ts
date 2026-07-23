import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 825: AccountClientDTO dual body retired.
 * Sole AccountResponseSchema + z.infer (semantic ClientDTO is z.infer alias).
 */
describe('account client dto dual retired (residual 825)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/account-client.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(apiDir, '../../../../../account/src/api/routes.ts'),
    'utf8',
  );

  it('owns AccountClientDTO as z.infer of AccountResponseSchema', () => {
    expect(aggregate).toContain('Residual 825');
    expect(aggregate).toContain("from '../api/response-schemas'");
    expect(aggregate).toContain(
      'export type AccountClientDTO = z.infer<typeof AccountResponseSchema>',
    );
    expect(aggregate).not.toMatch(/export interface AccountClientDTO\b/);
  });

  it('AccountResponseSchema owns profile/settings/email/phone fields', () => {
    expect(responseSchemas).toContain('Residual 825');
    expect(responseSchemas).toContain(
      'export const AccountResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain('id: brandedId<IdentityId>()');
    expect(responseSchemas).toContain('profile: z.object({');
    expect(responseSchemas).toContain('settings: z.object({');
    expect(responseSchemas).toContain('email: z.object({');
    expect(responseSchemas).toContain('phone: z');
    expect(responseSchemas).toContain('version: z.number()');
  });

  it('OpenAPI account routes use AccountResponseSchema without local dual body', () => {
    expect(routes).toContain('AccountResponseSchema');
    expect(routes).toContain("successResponse(AccountResponseSchema, '获取成功')");
    expect(routes).toContain("successResponse(AccountResponseSchema, '更新成功')");
    expect(routes).toContain(
      "successResponse(AccountResponseSchema.shape.settings, '更新成功')",
    );
  });
});
