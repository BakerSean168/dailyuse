import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 713: auth session response dual bodies retired.
 * CurrentUserDTO / ListSessionsRes reuse *ResponseSchema only.
 */
describe('auth session res dual retired (residual 713)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'session.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../authentication/src/api/routes.ts'),
    'utf8',
  );

  it('exports current-user and session-list response schemas', () => {
    expect(responseSchemas).toContain('Residual 713');
    expect(responseSchemas).toContain('export const CurrentUserResponseSchema');
    expect(responseSchemas).toContain('export const SessionListResponseSchema');
  });

  it('semantic types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain('Residual 713');
    expect(dto).toContain(
      'export type CurrentUserDTO = z.infer<typeof CurrentUserResponseSchema>',
    );
    expect(dto).toContain('export type GetCurrentUserRes = CurrentUserDTO');
    expect(dto).toContain(
      'export type ListSessionsRes = z.infer<typeof SessionListResponseSchema>',
    );
    expect(dto).not.toMatch(/export interface CurrentUserDTO\b/);
    expect(dto).not.toMatch(/export interface ListSessionsRes\b/);
  });

  it('OpenAPI auth routes use CurrentUser/SessionList response schemas', () => {
    expect(routes).toContain('CurrentUserResponseSchema');
    expect(routes).toContain('SessionListResponseSchema');
    expect(routes).toContain('successResponse(CurrentUserResponseSchema');
    expect(routes).toContain('successResponse(SessionListResponseSchema');
  });
});
