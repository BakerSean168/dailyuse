import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 873: OfflineLoginResponse dual retired (sole body in contracts).
 * Residual 925: OfflineLoginResponse name dual fully retired on desktop —
 *   session-types no longer type-aliases; consumers import contracts sole body.
 * Does not flip §13.2 checkboxes.
 */
describe('contracts OfflineLoginResponse dual retired (residual 873/925)', () => {
  const dir = __dirname;
  const source = readFileSync(resolve(dir, 'desktop-auth.types.ts'), 'utf8');
  const protocolIndex = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const sessionTypes = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/desktop/src/main/modules/authentication/infrastructure/session-types.ts',
    ),
    'utf8',
  );
  const sessionManager = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/desktop/src/main/modules/authentication/infrastructure/session-manager.ts',
    ),
    'utf8',
  );
  const loginOrchestrator = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/desktop/src/main/modules/authentication/infrastructure/login-orchestrator.ts',
    ),
    'utf8',
  );
  const infraIndex = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/desktop/src/main/modules/authentication/infrastructure/index.ts',
    ),
    'utf8',
  );

  it('owns OfflineLoginResponse sole interface body in contracts', () => {
    expect(source).toContain('Residual 873');
    expect(source).toMatch(/export interface OfflineLoginResponse\b/);
    expect(source).toContain('ok: boolean');
    expect(source).toContain('authMode?: AuthMode');
    expect(protocolIndex).toContain('OfflineLoginResponse');
  });

  it('desktop drops OfflineLoginResponse name dual (no session-types alias)', () => {
    expect(sessionTypes).toContain('Residual 873');
    expect(sessionTypes).toContain('Residual 925');
    expect(sessionTypes).not.toMatch(/export type OfflineLoginResponse\b/);
    expect(sessionTypes).not.toMatch(/export interface OfflineLoginResponse\b/);
    expect(sessionTypes).not.toContain('ContractOfflineLoginResponse');
  });

  it('desktop consumers import OfflineLoginResponse from contracts sole body', () => {
    expect(sessionManager).toContain('Residual 925');
    expect(sessionManager).toContain(
      "import type { OfflineLoginResponse } from '@dailyuse/contracts/authentication'",
    );
    expect(sessionManager).toContain('Promise<OfflineLoginResponse>');
    expect(loginOrchestrator).toContain('Residual 925');
    expect(loginOrchestrator).toContain('type OfflineLoginResponse');
    expect(loginOrchestrator).toContain("from '@dailyuse/contracts/authentication'");
    expect(infraIndex).toContain('OfflineLoginResponse');
    expect(infraIndex).toContain("from '@dailyuse/contracts/authentication'");
    expect(infraIndex).not.toMatch(
      /OfflineLoginResponse[^;]{0,120}from '\.\/session-types'/,
    );
    expect(infraIndex).toContain(
      "export type {\n  SessionRestoreResult,\n  AutoLoginResult,\n  SessionStatus,\n} from './session-types'",
    );
  });
});
