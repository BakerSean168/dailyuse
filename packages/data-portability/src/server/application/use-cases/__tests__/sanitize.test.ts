import { describe, it, expect } from 'vitest';
import { sanitizeSensitiveFields } from '../../sanitize';

describe('sanitizeSensitiveFields', () => {
  it('removes top-level token field', () => {
    const input = { name: 'test', token: 'secret123' };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({ name: 'test' });
  });

  it('removes nested apiKey field', () => {
    const input = {
      provider: {
        name: 'openai',
        apiKey: 'sk-secret',
        model: 'gpt-4',
      },
    };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({
      provider: {
        name: 'openai',
        model: 'gpt-4',
      },
    });
  });

  it('removes deeply nested auth config and identity-like fields', () => {
    const input = {
      config: {
        auth: {
          accessToken: 'bearer-secret',
          refreshToken: 'refresh-secret',
          userId: 'user-1',
        },
        identityId: 'identity-1',
      },
    };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({
      config: {},
    });
  });

  it('removes sensitive fields from array items', () => {
    const input = {
      providers: [
        { name: 'openai', apiKey: 'sk-1' },
        { name: 'anthropic', apiKey: 'sk-2' },
      ],
    };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({
      providers: [{ name: 'openai' }, { name: 'anthropic' }],
    });
  });

  it('handles null and undefined gracefully', () => {
    expect(sanitizeSensitiveFields(null)).toBeNull();
    expect(sanitizeSensitiveFields(undefined)).toBeUndefined();
  });

  it('handles primitive values unchanged', () => {
    expect(sanitizeSensitiveFields('hello')).toBe('hello');
    expect(sanitizeSensitiveFields(42)).toBe(42);
    expect(sanitizeSensitiveFields(true)).toBe(true);
  });

  it('does NOT remove user content that happens to contain sensitive words', () => {
    const input = {
      content: 'My password is not stored here',
      name: 'API key rotation guide',
    };
    const result = sanitizeSensitiveFields(input);
    // Only key names are checked, not values
    expect(result).toEqual(input);
  });

  it('removes password and secret fields', () => {
    const input = {
      username: 'admin',
      password: 'hashed',
      secret: 'jwt-secret',
      sshKey: 'ssh-rsa...',
      privateKey: '-----BEGIN',
    };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({ username: 'admin' });
  });

  it('removes api_key variant', () => {
    const input = { api_key: 'sk-123', name: 'test' };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({ name: 'test' });
  });

  it('removes credential and id-like fields', () => {
    const input = { credential: { type: 'service_account' }, projectId: 'abc' };
    const result = sanitizeSensitiveFields(input);
    expect(result).toEqual({});
  });

  it('removes persistent id fields from nested arrays', () => {
    const input = {
      resources: [
        {
          name: 'note.md',
          id: 'resource-db-id',
          resourceId: 'resource-db-id',
          metadata: { accountId: 'account-1' },
        },
      ],
    };

    const result = sanitizeSensitiveFields(input);

    expect(result).toEqual({
      resources: [
        {
          name: 'note.md',
          metadata: {},
        },
      ],
    });
  });
});
