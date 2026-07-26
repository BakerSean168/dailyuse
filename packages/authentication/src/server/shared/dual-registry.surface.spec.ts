/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 4 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: mask-email-dual.surface.spec.ts, normalize-email-dual.surface.spec.ts, to-challenge-purpose-dual.surface.spec.ts, to-domain-provider-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VerificationChallengePurpose, OAuthProvider } from '../domain';
import { maskEmail } from './mask-email';
import { normalizeEmail } from './normalize-email';
import { toChallengePurpose } from './to-challenge-purpose';
import { toDomainProvider } from './to-domain-provider';

// --- merged from mask-email-dual.surface.spec.ts ---
{
  /**
   * Residual 949: maskEmail triple dual retired.
   * Sole body in mask-email.ts; register / get-current-user / console-email-sender import it.
   * Soft residual 947: http envelope guard duals retired
   *   (apps/desktop/src/main/utils/http-envelope-guards-dual.surface.spec.ts).
   * Soft residual 950: tip focused suite numbers track Residual 950 evidence tip (266/1185).
   * Soft residual 951: app-vue AI isRecord dual retired (is-record-dual.surface.spec.ts).
   * Soft residual 959: normalizeEmail dual retired (normalize-email-dual.surface.spec.ts).
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
}

// --- merged from normalize-email-dual.surface.spec.ts ---
{
  /**
   * Residual 959: normalizeEmail dual retired.
   * Sole body in normalize-email.ts; send-email-verification-code + verify-email-code import it.
   * Soft residual 949: maskEmail dual retired (mask-email-dual.surface.spec.ts).
   * Soft residual 957: vault FS guards dual retired
   *   (packages/repository/src/electron/vault-fs-guards-dual.surface.spec.ts).
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
   * Soft residual 961: toChallengePurpose dual retired (to-challenge-purpose-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('normalizeEmail dual retired (residual 959)', () => {
    const sharedDir = __dirname;
    const sole = readFileSync(resolve(sharedDir, 'normalize-email.ts'), 'utf8');
    const send = readFileSync(
      resolve(sharedDir, '../application/use-cases/commands/send-email-verification-code.use-case.ts'),
      'utf8',
    );
    const verify = readFileSync(
      resolve(sharedDir, '../application/use-cases/commands/verify-email-code.use-case.ts'),
      'utf8',
    );

    it('owns sole normalizeEmail helper body', () => {
      expect(sole).toContain('Residual 959');
      expect(sole).toMatch(/export function normalizeEmail\b/);
      expect(sole).toContain('return email.trim()');
      expect(sole).toContain('Keep original casing');
    });

    it('send and verify use cases import sole without local dual bodies', () => {
      expect(send).toContain('Residual 959');
      expect(send).toContain(
        "import { normalizeEmail } from '../../../shared/normalize-email'",
      );
      expect(send).not.toMatch(/function normalizeEmail\b/);
      expect(send).toContain('normalizeEmail(input.email)');
      expect(send).toContain('normalizeEmail(primary.value)');

      expect(verify).toContain('Residual 959');
      expect(verify).toContain(
        "import { normalizeEmail } from '../../../shared/normalize-email'",
      );
      expect(verify).not.toMatch(/function normalizeEmail\b/);
      expect(verify).toContain('normalizeEmail(input.email)');
    });

    it('trims without lowercasing', () => {
      expect(normalizeEmail('  Alice@Example.COM  ')).toBe('Alice@Example.COM');
      expect(normalizeEmail('\tbob@test.com\n')).toBe('bob@test.com');
      expect(normalizeEmail('')).toBe('');
    });
  });
}

// --- merged from to-challenge-purpose-dual.surface.spec.ts ---
{
  /**
   * Residual 961: toChallengePurpose dual retired.
   * Sole body in to-challenge-purpose.ts; send-email-verification-code + verify-email-code import it.
   * Soft residual 959: normalizeEmail dual retired (normalize-email-dual.surface.spec.ts).
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
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
}

// --- merged from to-domain-provider-dual.surface.spec.ts ---
{
  /**
   * Residual 991: toDomainProvider dual retired (bind/unbind OAuth use cases).
   * Sole body in to-domain-provider.ts; bind + unbind use cases import it.
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
   * Soft residual 893: transport Microsoft keep-boundary → null (domain catalog has no Microsoft).
   * Does not flip §13.2 checkboxes.
   */
  describe('toDomainProvider dual retired (residual 991)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'to-domain-provider.ts'), 'utf8');
    const bind = readFileSync(
      resolve(dir, '../application/use-cases/commands/bind-oauth.use-case.ts'),
      'utf8',
    );
    const unbind = readFileSync(
      resolve(dir, '../application/use-cases/commands/unbind-oauth.use-case.ts'),
      'utf8',
    );

    it('owns sole toDomainProvider helper body', () => {
      expect(sole).toContain('Residual 991');
      expect(sole).toMatch(/export function toDomainProvider\b/);
      expect(sole).toContain('Residual 893');
      expect(sole).toContain('OAuthProvider.Github');
      expect(sole).toContain('OAuthProvider.Google');
      expect(sole).toContain('OAuthProvider.Apple');
    });

    it('bind + unbind use cases import sole without local dual bodies', () => {
      for (const [label, source] of [
        ['bind', bind],
        ['unbind', unbind],
      ] as const) {
        expect(source, label).toContain('Residual 991');
        expect(source, label).toContain(
          "import { toDomainProvider } from '../../../shared/to-domain-provider'",
        );
        expect(source, label).not.toMatch(/function toDomainProvider\b/);
        expect(source, label).toContain('toDomainProvider(');
      }
    });

    it('maps transport providers onto domain catalog and rejects Microsoft', () => {
      expect(toDomainProvider('Github')).toBe(OAuthProvider.Github);
      expect(toDomainProvider('Google')).toBe(OAuthProvider.Google);
      expect(toDomainProvider('Apple')).toBe(OAuthProvider.Apple);
      expect(toDomainProvider('Microsoft')).toBeNull();
    });
  });
}
