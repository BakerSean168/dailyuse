import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 823: UserSettingClientDTO dual body retired.
 * Sole UserSettingResponseSchema + z.infer (semantic ClientDTO is z.infer alias).
 */
describe('user setting client dto dual retired (residual 823)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/user-setting-client.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(apiDir, '../../../../../setting/src/api/routes.ts'),
    'utf8',
  );

  it('owns UserSettingClientDTO as z.infer of UserSettingResponseSchema', () => {
    expect(aggregate).toContain('Residual 823');
    expect(aggregate).toContain("from '../api/response-schemas'");
    expect(aggregate).toContain(
      'export type UserSettingClientDTO = z.infer<typeof UserSettingResponseSchema>',
    );
    expect(aggregate).not.toMatch(/export interface UserSettingClientDTO\b/);
  });

  it('UserSettingResponseSchema owns id/identityId/preferences/version timestamps', () => {
    expect(responseSchemas).toContain('Residual 823');
    expect(responseSchemas).toContain(
      'export const UserSettingResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain('identityId: brandedId<IdentityId>()');
    expect(responseSchemas).toContain('preferences: UserPreferencesSchema');
    expect(responseSchemas).toContain('version: z.number()');
    expect(responseSchemas).toContain('createdAt: z.number()');
    expect(responseSchemas).toContain('updatedAt: z.number()');
  });

  it('OpenAPI setting routes use UserSettingResponseSchema without local dual body', () => {
    expect(routes).toContain('UserSettingResponseSchema');
    expect(routes).toContain("successResponse(UserSettingResponseSchema, '获取成功')");
    expect(routes).toContain("successResponse(UserSettingResponseSchema, '更新成功')");
    expect(routes).toContain("successResponse(UserSettingResponseSchema, '重置成功')");
  });
});
