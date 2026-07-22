import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 282: AuthenticationClientPort is a type alias of IAuthApiClient
 * (no second interface dual body; pure Result pass-through service).
 */
describe('authentication client port dual single-track surface', () => {
  const service = readFileSync(resolve(__dirname, 'services/auth-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'ports/auth-api-client.port.ts'), 'utf8');

  it('defines IAuthApiClient once in ports', () => {
    expect(port).toContain('export interface IAuthApiClient');
    expect(port).toContain('loginRememberedDesktopAccount');
  });

  it('AuthenticationClientPort is type alias, not a second interface', () => {
    expect(service).toMatch(/export type AuthenticationClientPort\s*=\s*IAuthApiClient/);
    expect(service).not.toMatch(/export interface AuthenticationClientPort\s*\{/);
    expect(service).toContain('implements IAuthApiClient');
  });
});
