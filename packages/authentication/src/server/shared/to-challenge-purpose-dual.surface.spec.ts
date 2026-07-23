import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VerificationChallengePurpose } from '../domain';
import { toChallengePurpose } from './to-challenge-purpose';

/**
 * Residual 961: toChallengePurpose dual retired.
 * Sole body in to-challenge-purpose.ts; send-email-verification-code + verify-email-code import it.
 * Soft residual 959: normalizeEmail dual retired (normalize-email-dual.surface.spec.ts).
 * Soft residual 1020: tip focused suite numbers track Residual 1020 evidence tip (300/1303).
 * Soft residual 963: findSSEBoundary dual retired (packages/ai/src/shared/find-sse-boundary-dual.surface.spec.ts).
 * Transport EmailVerificationPurpose maps onto domain VerificationChallengePurpose.
 * Does not flip §13.2 checkboxes.
 */
describe('toChallengePurpose dual retired (residual 961)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'to-challenge-purpose.ts'), 'utf8');
  const send = readFileSync(
    resolve(sharedDir, '../application/use-cases/commands/send-email-verification-code.use-case.ts'),
    'utf8',
  );
  const verify = readFileSync(
    resolve(sharedDir, '../application/use-cases/commands/verify-email-code.use-case.ts'),
    'utf8',
  );

  it('owns sole toChallengePurpose helper body', () => {
    expect(sole).toContain('Residual 961');
    expect(sole).toMatch(/export function toChallengePurpose\b/);
    expect(sole).toContain("case 'EmailBind'");
    expect(sole).toContain('VerificationChallengePurpose.EmailVerify');
    expect(sole).toContain('EmailVerificationPurpose');
  });

  it('send and verify use cases import sole without local dual bodies', () => {
    expect(send).toContain('Residual 961');
    expect(send).toContain(
      "import { toChallengePurpose } from '../../../shared/to-challenge-purpose'",
    );
    expect(send).not.toMatch(/function toChallengePurpose\b/);
    expect(send).toContain('toChallengePurpose(purpose)');

    expect(verify).toContain('Residual 961');
    expect(verify).toContain(
      "import { toChallengePurpose } from '../../../shared/to-challenge-purpose'",
    );
    expect(verify).not.toMatch(/function toChallengePurpose\b/);
    expect(verify).toContain('toChallengePurpose(purpose)');
  });

  it('maps transport purposes onto domain challenge purposes', () => {
    expect(toChallengePurpose('EmailBind')).toBe(VerificationChallengePurpose.EmailBind);
    expect(toChallengePurpose('EmailChange')).toBe(VerificationChallengePurpose.EmailChange);
    expect(toChallengePurpose('EmailVerify')).toBe(VerificationChallengePurpose.EmailVerify);
    expect(toChallengePurpose(undefined)).toBe(VerificationChallengePurpose.EmailVerify);
  });
});
