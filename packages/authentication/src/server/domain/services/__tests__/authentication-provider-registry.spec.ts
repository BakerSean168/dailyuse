/**
 * AuthenticationProviderRegistry Tests
 *
 * Verifies the dispatch seam of the pluggable authentication architecture:
 * - registration and duplicate rejection;
 * - resolution and unsupported-method rejection;
 * - introspection (has / methods).
 */
import { describe, it, expect } from 'vitest';
import { AuthenticationProviderRegistry } from '../authentication-provider-registry';
import {
  AuthenticationMethod,
  DuplicateAuthenticationProviderError,
  UnsupportedAuthenticationMethodError,
  type AuthenticationProvider,
  type AuthenticationResult,
} from '../authentication-provider';

function stubProvider(method: string): AuthenticationProvider {
  return {
    method,
    authenticate: async (): Promise<AuthenticationResult> => {
      throw new Error('not used in these tests');
    },
  };
}

describe('AuthenticationProviderRegistry', () => {
  it('registers providers passed to the constructor', () => {
    const registry = new AuthenticationProviderRegistry([
      stubProvider(AuthenticationMethod.Password),
      stubProvider(AuthenticationMethod.Github),
    ]);

    expect(registry.has(AuthenticationMethod.Password)).toBe(true);
    expect(registry.has(AuthenticationMethod.Github)).toBe(true);
    expect(registry.methods()).toEqual([
      AuthenticationMethod.Password,
      AuthenticationMethod.Github,
    ]);
  });

  it('resolves the provider registered for a method', () => {
    const password = stubProvider(AuthenticationMethod.Password);
    const registry = new AuthenticationProviderRegistry([password]);

    expect(registry.resolve(AuthenticationMethod.Password)).toBe(password);
  });

  it('throws UnsupportedAuthenticationMethodError for an unregistered method', () => {
    const registry = new AuthenticationProviderRegistry();

    expect(() => registry.resolve(AuthenticationMethod.Github)).toThrow(
      UnsupportedAuthenticationMethodError,
    );
  });

  it('rejects duplicate registration for the same method', () => {
    const registry = new AuthenticationProviderRegistry([
      stubProvider(AuthenticationMethod.Password),
    ]);

    expect(() => registry.register(stubProvider(AuthenticationMethod.Password))).toThrow(
      DuplicateAuthenticationProviderError,
    );
  });

  it('supports registering arbitrary third-party method ids (open extension)', () => {
    const registry = new AuthenticationProviderRegistry();
    registry.register(stubProvider('custom-sso'));

    expect(registry.has('custom-sso')).toBe(true);
    expect(registry.methods()).toContain('custom-sso');
  });
});
