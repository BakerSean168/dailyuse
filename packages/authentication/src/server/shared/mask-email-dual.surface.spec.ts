import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { maskEmail } from './mask-email';

/**
 * Residual 949: maskEmail triple dual retired.
 * Sole body in mask-email.ts; register / get-current-user / console-email-sender import it.
 * Soft residual 947: http envelope guard duals retired
 *   (apps/desktop/src/main/utils/http-envelope-guards-dual.surface.spec.ts).
 * Soft residual 950: tip focused suite numbers track Residual 950 evidence tip (266/1185).
 * Invalid-email policy unified to non-leaking '***' (was: get-current-user returned raw email).
 * Does not flip §13.2 checkboxes.
 */
describe('maskEmail dual retired (residual 949)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'mask-email.ts'), 'utf8');
  const register = readFileSync(
    resolve(sharedDir, '../application/use-cases/commands/register.use-case.ts'),
    'utf8',
  );
  const getCurrentUser = readFileSync(
    resolve(sharedDir, '../application/use-cases/queries/get-current-user.use-case.ts'),
    'utf8',
  );
  const consoleEmail = readFileSync(
    resolve(sharedDir, '../infrastructure/services/console-email-sender.ts'),
    'utf8',
  );

  it('owns sole maskEmail helper body', () => {
    expect(sole).toContain('Residual 949');
    expect(sole).toMatch(/export function maskEmail\b/);
    expect(sole).toContain("return '***'");
    expect(sole).toContain('local.slice(-1)');
  });

  it('register / get-current-user / console-email-sender import sole without local dual bodies', () => {
    expect(register).toContain('Residual 949');
    expect(register).toContain(
      "import { maskEmail } from '../../../shared/mask-email'",
    );
    expect(register).not.toMatch(/function maskEmail\b/);
    expect(register).toContain('maskEmail(input.email)');

    expect(getCurrentUser).toContain('Residual 949');
    expect(getCurrentUser).toContain(
      "import { maskEmail } from '../../../shared/mask-email'",
    );
    expect(getCurrentUser).not.toMatch(/function maskEmail\b/);
    expect(getCurrentUser).toContain('maskEmail(primaryEmail.value)');
    // Policy unified: no invalid-shape raw-email return dual
    expect(getCurrentUser).not.toContain("if (!local || !domain) return email");

    expect(consoleEmail).toContain('Residual 949');
    expect(consoleEmail).toContain(
      "import { maskEmail } from '../../shared/mask-email'",
    );
    expect(consoleEmail).not.toMatch(/function maskEmail\b/);
    expect(consoleEmail).toContain('maskEmail(normalized)');
  });

  it('masks valid emails and never leaks invalid shapes', () => {
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    expect(maskEmail('alice@example.com')).toBe('a***e@example.com');
    expect(maskEmail('not-an-email')).toBe('***');
    expect(maskEmail('@nodomain')).toBe('***');
    expect(maskEmail('nodomain@')).toBe('***');
    expect(maskEmail('')).toBe('***');
  });
});
