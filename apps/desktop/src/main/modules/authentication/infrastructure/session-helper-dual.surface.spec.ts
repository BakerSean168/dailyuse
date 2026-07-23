import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 937: toIdentityId / toDeviceInfoDTO helper duals retired.
 * Sole bodies live in session-types; guest/offline/remembered import them.
 * Soft residual 935: LifecycleSessionRestoreResult name dual retired
 *   (application/session-restore-result-extension-keep-boundary.surface.spec.ts).
 * Soft residual 925: OfflineLoginResponse contracts sole body.
 * Does not flip §13.2 checkboxes.
 */
describe('session helper duals retired (residual 937)', () => {
  const infraDir = __dirname;
  const sessionTypes = readFileSync(resolve(infraDir, 'session-types.ts'), 'utf8');
  const guest = readFileSync(resolve(infraDir, 'guest-identity-helper.ts'), 'utf8');
  const offline = readFileSync(resolve(infraDir, 'offline-auth-helper.ts'), 'utf8');
  const remembered = readFileSync(resolve(infraDir, 'remembered-accounts-service.ts'), 'utf8');
  const loginOrchestrator = readFileSync(resolve(infraDir, 'login-orchestrator.ts'), 'utf8');

  it('owns sole toIdentityId / toDeviceInfoDTO helper bodies in session-types', () => {
    expect(sessionTypes).toContain('Residual 937');
    expect(sessionTypes).toMatch(/export function toIdentityId\b/);
    expect(sessionTypes).toMatch(/export function toDeviceInfoDTO\b/);
    expect(sessionTypes).toContain('IdentityIdValue.of(String(value))');
    expect(sessionTypes).toContain('deviceFingerprint: client.deviceFingerprint ?? \'\'');
  });

  it('guest/offline/remembered import helpers and drop local dual function bodies', () => {
    expect(guest).toContain('Residual 937');
    expect(guest).toContain(
      "import { GUEST_ACCESS_TOKEN, toDeviceInfoDTO, toIdentityId } from './session-types'",
    );
    expect(guest).not.toMatch(/function toIdentityId\b/);
    expect(guest).not.toMatch(/function toDeviceInfoDTO\b/);
    expect(guest).not.toContain('IdentityIdValue');

    expect(offline).toContain('Residual 937');
    expect(offline).toContain("import { toIdentityId } from './session-types'");
    expect(offline).not.toMatch(/function toIdentityId\b/);
    expect(offline).not.toContain('IdentityIdValue');

    expect(remembered).toContain('Residual 937');
    expect(remembered).toContain("import { toIdentityId } from './session-types'");
    expect(remembered).not.toMatch(/function toIdentityId\b/);
    expect(remembered).not.toContain('IdentityIdValue');
  });

  it('login-orchestrator already consumes session-types helpers without local duals', () => {
    expect(loginOrchestrator).toContain(
      "import { toIdentityId, toDeviceInfoDTO, toErrorLog, LOCAL_ACCESS_TOKEN } from './session-types'",
    );
    expect(loginOrchestrator).not.toMatch(/function toIdentityId\b/);
    expect(loginOrchestrator).not.toMatch(/function toDeviceInfoDTO\b/);
    // still invokes helpers
    expect(loginOrchestrator).toContain('toIdentityId(');
    expect(loginOrchestrator).toContain('toDeviceInfoDTO(');
  });
});
