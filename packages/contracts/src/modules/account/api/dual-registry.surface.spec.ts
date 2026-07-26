/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 2 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: account-client-dto-dual.surface.spec.ts, check-availability-res-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// --- merged from account-client-dto-dual.surface.spec.ts ---
{
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
}

// --- merged from check-availability-res-dual.surface.spec.ts ---
{
  /**
   * Residual 767: CheckAvailabilityRes dual body retired.
   * OpenAPI + transport use AvailabilityResponseSchema; Res is z.infer alias.
    *
   * Soft residual 825: AccountClientDTO dual retired via AccountResponseSchema
   * (see account-client-dto-dual surface).
   */
  describe('check availability res dual retired (residual 767)', () => {
    const apiDir = __dirname;
    const dto = readFileSync(resolve(apiDir, 'account-availability.dto.ts'), 'utf8');
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
    const routes = readFileSync(
      resolve(apiDir, '../../../../../account/src/api/routes.ts'),
      'utf8',
    );

    it('dto Res is z.infer alias without interface dual body', () => {
      expect(dto).toContain('Residual 767');
      expect(dto).toContain("from './response-schemas'");
      expect(dto).toContain(
        'export type CheckAvailabilityRes = z.infer<typeof AvailabilityResponseSchema>',
      );
      expect(dto).not.toMatch(/export interface CheckAvailabilityRes\b/);
    });

    it('response-schemas owns the sole availability object body', () => {
      expect(responseSchemas).toContain('Residual 767');
      expect(responseSchemas).toContain(
        'export const AvailabilityResponseSchema = z.object({',
      );
      expect(responseSchemas).toContain('available: z.boolean()');
      expect(responseSchemas).toContain('suggestion: z.string().optional()');
    });

    it('OpenAPI availability route uses shared response schema', () => {
      expect(routes).toContain('AvailabilityResponseSchema');
      expect(routes).toContain(
        "successResponse(AvailabilityResponseSchema, '检查成功')",
      );
    });
  });
}
