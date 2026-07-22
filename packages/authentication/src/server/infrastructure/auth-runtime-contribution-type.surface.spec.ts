import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 240: authentication runtime contribution type is single-track.
 * Canonical type is AuthenticationModuleRuntimeContribution from composition root.
 */
describe('authentication runtime contribution type single-track surface', () => {
  const infraDir = __dirname;
  const runtime = readFileSync(
    resolve(infraDir, 'runtime/authentication.runtime.ts'),
    'utf8',
  );
  const runtimeIndex = readFileSync(resolve(infraDir, 'runtime/index.ts'), 'utf8');
  const infraIndex = readFileSync(resolve(infraDir, 'index.ts'), 'utf8');
  const moduleSource = readFileSync(resolve(infraDir, 'authentication.module.ts'), 'utf8');

  it('does not dual-alias AuthenticationRuntimeContribution type', () => {
    expect(runtime).not.toMatch(
      /export type AuthenticationRuntimeContribution\s*=\s*AuthenticationModuleRuntimeContribution/,
    );
    expect(runtime).not.toMatch(/\bexport type AuthenticationRuntimeContribution\b/);
    expect(runtimeIndex).not.toMatch(/\bAuthenticationRuntimeContribution\b(?!Options)/);
    // Dual type alias export path only (ContributionsInput plural remains legitimate).
    expect(infraIndex).not.toMatch(
      /type AuthenticationRuntimeContribution\b(?!s)/,
    );
    expect(infraIndex).not.toMatch(
      /export type \{[^}]*\bAuthenticationRuntimeContribution\b(?!s)/,
    );
  });

  it('factory returns AuthenticationModuleRuntimeContribution', () => {
    expect(runtime).toContain('export function createAuthenticationRuntimeContribution');
    expect(runtime).toContain('): AuthenticationModuleRuntimeContribution');
    expect(moduleSource).toContain('export interface AuthenticationModuleRuntimeContribution');
  });

  it('infrastructure index exports module contribution type from composition root', () => {
    expect(infraIndex).toContain('type AuthenticationModuleRuntimeContribution');
    expect(infraIndex).toContain("from './authentication.module'");
    expect(infraIndex).toContain('createAuthenticationRuntimeContribution');
  });
});
