import { describe, expect, it } from 'vitest';
import {
  isOAuthAuthenticatedIdentity,
  readWebAuthSessionIdentity,
} from '../e2e/helpers/read-web-auth-session-identity';

describe('readWebAuthSessionIdentity (residual 1339)', () => {
  it('returns null for empty or invalid storage', () => {
    expect(readWebAuthSessionIdentity(null)).toBeNull();
    expect(readWebAuthSessionIdentity(undefined)).toBeNull();
    expect(readWebAuthSessionIdentity('')).toBeNull();
    expect(readWebAuthSessionIdentity('{')).toBeNull();
  });

  it('reads hasOAuth identity from shipped authentication storage shape', () => {
    const raw = JSON.stringify({
      accessToken: 'tok',
      currentIdentity: { hasOAuth: true, status: 'Active', email: 'u@example.com' },
    });
    const identity = readWebAuthSessionIdentity(raw);
    expect(identity?.hasOAuth).toBe(true);
    expect(identity?.status).toBe('Active');
    expect(isOAuthAuthenticatedIdentity(identity)).toBe(true);
  });

  it('does not treat password-only session as OAuth authenticated', () => {
    const raw = JSON.stringify({
      currentIdentity: { hasOAuth: false, status: 'Active' },
    });
    expect(isOAuthAuthenticatedIdentity(readWebAuthSessionIdentity(raw))).toBe(false);
  });
});
