import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 785: GetFocusStatusRes / GetFocusHistoryRes dual bodies retired.
 * Sole ResSchema + z.infer nested FocusSessionClientDTOSchema.
 * Soft residual 813: FocusSessionClientDTO dual retired via FocusSessionClientDTOSchema
 * (see focus-session-client-dto-dual surface).
 */
describe('focus status/history res duals retired (residual 785)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'focus-session.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('dto owns status/history ResSchema and z.infer aliases', () => {
    expect(dto).toContain('Residual 785');
    expect(dto).toContain("from './response-schemas'");
    expect(dto).toContain('export const GetFocusStatusResSchema = z.object({');
    expect(dto).toContain(
      'export type GetFocusStatusRes = z.infer<typeof GetFocusStatusResSchema>',
    );
    expect(dto).toContain('export const GetFocusHistoryResSchema = z.object({');
    expect(dto).toContain(
      'export type GetFocusHistoryRes = z.infer<typeof GetFocusHistoryResSchema>',
    );
    expect(dto).toContain('session: FocusSessionClientDTOSchema.nullable()');
    expect(dto).toContain('data: z.array(FocusSessionClientDTOSchema)');
    expect(dto).not.toMatch(/export interface GetFocusStatusRes\b/);
    expect(dto).not.toMatch(/export interface GetFocusHistoryRes\b/);
  });

  it('nests FocusSessionClientDTOSchema from response-schemas', () => {
    expect(responseSchemas).toContain(
      'export const FocusSessionClientDTOSchema = z.object({',
    );
    expect(dto).toContain('FocusSessionClientDTOSchema');
  });
});
