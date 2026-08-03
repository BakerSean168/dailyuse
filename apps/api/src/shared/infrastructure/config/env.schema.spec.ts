import { describe, expect, it } from 'vitest';
import { envSchema } from './env.schema';

describe('envSchema LOCAL_VALIDATION', () => {
  const required = { JWT_SECRET: 'local-validation-secret-at-least-32-characters' };

  it('keeps local validation controls disabled by default', () => {
    expect(envSchema.parse(required).LOCAL_VALIDATION).toBe(false);
  });

  it('enables local validation controls only for the explicit 1 value', () => {
    expect(envSchema.parse({ ...required, LOCAL_VALIDATION: '1' }).LOCAL_VALIDATION).toBe(true);
    expect(envSchema.parse({ ...required, LOCAL_VALIDATION: '0' }).LOCAL_VALIDATION).toBe(false);
  });

  it('requires explicit HTTPS auth origins in production', () => {
    expect(() => envSchema.parse({
      ...required,
      NODE_ENV: 'production',
      AUTH_BASE_URL: 'http://auth.example.com/api/auth',
      MEMOFLOW_WEB_URL: 'https://app.example.com',
    })).toThrow(/AUTH_BASE_URL must use HTTPS/);
    expect(() => envSchema.parse({
      ...required,
      NODE_ENV: 'production',
      AUTH_BASE_URL: 'https://api.example.com/api/auth',
    })).toThrow(/MEMOFLOW_WEB_URL is required/);
  });

  it('allows loopback HTTP only in the explicit local validation lane', () => {
    expect(envSchema.parse({
      ...required,
      NODE_ENV: 'production',
      LOCAL_VALIDATION: '1',
      AUTH_BASE_URL: 'http://localhost:12136/api/auth',
      MEMOFLOW_WEB_URL: 'http://127.0.0.1:12137',
    })).toMatchObject({ LOCAL_VALIDATION: true });
    expect(() => envSchema.parse({
      ...required,
      NODE_ENV: 'production',
      LOCAL_VALIDATION: '1',
      AUTH_BASE_URL: 'http://api.example.com/api/auth',
      MEMOFLOW_WEB_URL: 'http://app.example.com',
    })).toThrow(/must use HTTPS/);
  });
});
