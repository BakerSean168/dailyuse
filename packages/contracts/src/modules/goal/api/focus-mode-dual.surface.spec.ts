import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 745: goal focus-mode dual bodies retired.
 * FocusModeDTO reuses FocusModeClientDTOSchema; request interfaces alias *Req.
 */
describe('goal focus-mode dual retired (residual 745)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(resolve(apiDir, '../value-objects/focus-mode.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports FocusModeClientDTOSchema as sole shape from VO module', () => {
    expect(vo).toContain('Residual 745');
    expect(vo).toContain('export const FocusModeClientDTOSchema = z.object({');
  });

  it('semantic DTO/request types are schema aliases without interface dual bodies', () => {
    expect(vo).toContain(
      'export type FocusModeDTO = z.infer<typeof FocusModeClientDTOSchema>',
    );
    expect(vo).not.toMatch(/export interface FocusModeDTO\b/);
    expect(vo).toContain(
      'export type ActivateFocusModeRequest = ActivateFocusModeReq',
    );
    expect(vo).toContain(
      'export type ExtendFocusModeRequest = ExtendFocusModeReq',
    );
    expect(vo).not.toMatch(/export interface ActivateFocusModeRequest\b/);
    expect(vo).not.toMatch(/export interface ExtendFocusModeRequest\b/);
    expect(vo).toContain('export interface FocusMode {');
  });

  it('response-schemas re-exports VO-owned schema (no local dual body)', () => {
    expect(responseSchemas).toContain('Residual 745');
    expect(responseSchemas).toContain("from '../value-objects/focus-mode'");
    expect(responseSchemas).toContain('export { FocusModeClientDTOSchema }');
    expect(responseSchemas).not.toMatch(
      /const FocusModeClientDTOSchema(?::[^=]+)? = z\.object\(\{/,
    );
  });
});
