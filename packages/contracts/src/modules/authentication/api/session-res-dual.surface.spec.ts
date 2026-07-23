import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 769: session ValidateTokenRes / GuestModeRes dual bodies retired.
 * Res types are z.infer aliases of sole *ResSchema shapes.
 */
describe('session res duals retired (residual 769)', () => {
  const session = readFileSync(resolve(__dirname, 'session.dto.ts'), 'utf8');

  it('owns ValidateTokenResSchema and z.infer alias', () => {
    expect(session).toContain('Residual 769');
    expect(session).toContain(
      'export const ValidateTokenResSchema = z.object({',
    );
    expect(session).toContain(
      'export type ValidateTokenRes = z.infer<typeof ValidateTokenResSchema>',
    );
    expect(session).not.toMatch(/export interface ValidateTokenRes\b/);
  });

  it('owns GuestModeResSchema and z.infer alias', () => {
    expect(session).toContain(
      'export const GuestModeResSchema = z.object({',
    );
    expect(session).toContain(
      'export type GuestModeRes = z.infer<typeof GuestModeResSchema>',
    );
    expect(session).not.toMatch(/export interface GuestModeRes\b/);
  });

  it('keeps residual 713 current-user / session-list single-track aliases', () => {
    expect(session).toContain('Residual 713');
    expect(session).toContain(
      'export type CurrentUserDTO = z.infer<typeof CurrentUserResponseSchema>',
    );
    expect(session).toContain(
      'export type ListSessionsRes = z.infer<typeof SessionListResponseSchema>',
    );
  });
});
