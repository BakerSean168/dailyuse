import { describe, expect, it } from 'vitest';
import {
  isEmailVerificationWhitelisted,
  createRequireEmailVerifiedMiddleware,
} from './require-email-verified.middleware';
import { AuthDomainCode } from '../server/domain/services/i-verification-challenge-store';

function mockRes() {
  const state: {
    statusCode?: number;
    body?: unknown;
    headersSent: boolean;
  } = { headersSent: false };
  const res = {
    get headersSent() {
      return state.headersSent;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      state.headersSent = true;
      return this;
    },
  };
  return { res: res as any, state };
}

describe('email verification gate', () => {
  it('whitelists auth me/logout/refresh/email/password paths', () => {
    expect(isEmailVerificationWhitelisted('/api/v1/auth/me')).toBe(true);
    expect(isEmailVerificationWhitelisted('/api/v1/auth/logout')).toBe(true);
    expect(isEmailVerificationWhitelisted('/api/v1/auth/refresh')).toBe(true);
    expect(isEmailVerificationWhitelisted('/api/v1/auth/email/send-code')).toBe(true);
    expect(isEmailVerificationWhitelisted('/api/v1/auth/password/change')).toBe(true);
    expect(isEmailVerificationWhitelisted('/api/v1/auth/sessions')).toBe(false);
    expect(isEmailVerificationWhitelisted('/api/v1/accounts/me')).toBe(false);
  });

  it('returns 403 EMAIL_VERIFICATION_REQUIRED for Unverified on sensitive path', async () => {
    const gate = createRequireEmailVerifiedMiddleware({
      lookupStatus: async () => 'Unverified',
    });
    const { res, state } = mockRes();
    let nextCalled = false;
    await new Promise<void>((resolve) => {
      void gate(
        {
          originalUrl: '/api/v1/auth/sessions',
          user: { identityId: 'IdentityId_00000000-0000-4000-8000-000000000001' },
        } as any,
        res,
        () => {
          nextCalled = true;
          resolve();
        },
      );
      // gate may respond without next
      setTimeout(resolve, 20);
    });
    expect(nextCalled).toBe(false);
    expect(state.statusCode).toBe(403);
    expect((state.body as any)?.error?.context?.domainCode).toBe(
      AuthDomainCode.EMAIL_VERIFICATION_REQUIRED,
    );
  });

  it('allows Active identities through', async () => {
    const gate = createRequireEmailVerifiedMiddleware({
      lookupStatus: async () => 'Active',
    });
    const { res } = mockRes();
    let nextCalled = false;
    await new Promise<void>((resolve) => {
      void gate(
        {
          originalUrl: '/api/v1/auth/sessions',
          user: { identityId: 'IdentityId_00000000-0000-4000-8000-000000000001' },
        } as any,
        res,
        () => {
          nextCalled = true;
          resolve();
        },
      );
    });
    expect(nextCalled).toBe(true);
  });
});
