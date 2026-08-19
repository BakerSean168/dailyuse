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
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        AUTH_BASE_URL: 'http://auth.example.com/api/auth',
        MEMOFLOW_WEB_URL: 'https://app.example.com',
      }),
    ).toThrow(/AUTH_BASE_URL must use HTTPS/);
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        AUTH_BASE_URL: 'https://api.example.com/api/auth',
      }),
    ).toThrow(/MEMOFLOW_WEB_URL is required/);
  });

  it('allows loopback HTTP only in the explicit local validation lane', () => {
    expect(
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'http://localhost:12136/api/auth',
        MEMOFLOW_WEB_URL: 'http://127.0.0.1:12137',
      }),
    ).toMatchObject({ LOCAL_VALIDATION: true });
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'http://api.example.com/api/auth',
        MEMOFLOW_WEB_URL: 'http://app.example.com',
      }),
    ).toThrow(/must use HTTPS/);
  });
});

describe('envSchema Tailscale MagicDNS HTTP in local validation lane', () => {
  const required = { JWT_SECRET: 'local-validation-secret-at-least-32-characters' };

  it('rejects MagicDNS HTTP in production without LOCAL_VALIDATION', () => {
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        AUTH_BASE_URL: 'http://oracle.taile92a8e.ts.net:53080/api/auth',
        MEMOFLOW_WEB_URL: 'https://app.example.com',
      }),
    ).toThrow(/AUTH_BASE_URL must use HTTPS/);
  });

  it('rejects loopback HTTP in production without LOCAL_VALIDATION', () => {
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        AUTH_BASE_URL: 'http://localhost:12136/api/auth',
        MEMOFLOW_WEB_URL: 'http://127.0.0.1:12137',
      }),
    ).toThrow(/AUTH_BASE_URL must use HTTPS/);
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        AUTH_BASE_URL: 'https://api.example.com/api/auth',
        MEMOFLOW_WEB_URL: 'http://[::1]:8080',
      }),
    ).toThrow(/MEMOFLOW_WEB_URL must use HTTPS/);
  });

  it('allows MagicDNS HTTP in production with LOCAL_VALIDATION', () => {
    expect(
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'http://oracle.taile92a8e.ts.net:53080/api/auth',
        MEMOFLOW_WEB_URL: 'http://memoflow.taile92a8e.ts.net:57021',
      }),
    ).toMatchObject({ LOCAL_VALIDATION: true });
  });

  it('still allows HTTPS MagicDNS origins in production with LOCAL_VALIDATION', () => {
    expect(
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'https://oracle.taile92a8e.ts.net:53080/api/auth',
        MEMOFLOW_WEB_URL: 'https://app.example.com',
      }),
    ).toMatchObject({ LOCAL_VALIDATION: true });
  });

  it('still allows loopback HTTP in production with LOCAL_VALIDATION', () => {
    expect(
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'http://127.0.0.1:8080/api/auth',
        MEMOFLOW_WEB_URL: 'http://localhost:12137',
      }),
    ).toMatchObject({ LOCAL_VALIDATION: true });
  });

  it('still rejects arbitrary public HTTP hosts in production with LOCAL_VALIDATION', () => {
    expect(() =>
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'http://example.com/api/auth',
        MEMOFLOW_WEB_URL: 'http://app.example.com',
      }),
    ).toThrow(/must use HTTPS/);
  });

  it('accepts any MagicDNS suffix host (not only the reserved tailnet) with LOCAL_VALIDATION', () => {
    expect(
      envSchema.parse({
        ...required,
        NODE_ENV: 'production',
        LOCAL_VALIDATION: '1',
        AUTH_BASE_URL: 'http://foo.example.ts.net:53080/api/auth',
        MEMOFLOW_WEB_URL: 'https://app.example.com',
      }),
    ).toMatchObject({ LOCAL_VALIDATION: true });
  });
});

describe('envSchema OpenTelemetry (Phase 6 opt-in)', () => {
  const required = { JWT_SECRET: 'local-validation-secret-at-least-32-characters' };

  it('keeps tracing disabled by default with no collector requirement', () => {
    expect(envSchema.parse(required).OTEL_TRACING_ENABLED).toBe('0');
  });

  it('fails fast when tracing is enabled without an OTLP endpoint', () => {
    expect(() =>
      envSchema.parse({
        ...required,
        OTEL_TRACING_ENABLED: '1',
        OTEL_SERVICE_NAME: 'memoflow-api',
      }),
    ).toThrow(/OTEL_EXPORTER_OTLP_ENDPOINT is required/);
  });

  it('fails fast when tracing is enabled without a service name', () => {
    expect(() =>
      envSchema.parse({
        ...required,
        OTEL_TRACING_ENABLED: '1',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318/v1/traces',
      }),
    ).toThrow(/OTEL_SERVICE_NAME is required/);
  });

  it('accepts a complete opt-in configuration', () => {
    expect(
      envSchema.parse({
        ...required,
        OTEL_TRACING_ENABLED: '1',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318/v1/traces',
        OTEL_SERVICE_NAME: 'memoflow-api',
      }),
    ).toMatchObject({
      OTEL_TRACING_ENABLED: '1',
      OTEL_SERVICE_NAME: 'memoflow-api',
    });
  });
});
