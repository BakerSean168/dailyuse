import { describe, expect, it } from 'vitest';
import { createRedactedAIServiceRequestLogContext } from './redact-ai-service-log-payload';

describe('createRedactedAIServiceRequestLogContext', () => {
  it('recursively redacts credential-shaped fields while preserving non-sensitive diagnostic shape', () => {
    const context = createRedactedAIServiceRequestLogContext(
      JSON.stringify({
        provider_config: {
          provider: 'openai-compatible',
          api_key: 'provider-key-secret',
          nested: { serviceSecret: 'service-secret-value' },
        },
        query: 'hello',
      }),
    );

    expect(context.bodyPreview).toContain('openai-compatible');
    expect(context.bodyPreview).toContain('hello');
    expect(context.bodyPreview).toContain('[REDACTED]');
    expect(context.bodyPreview).not.toContain('provider-key-secret');
    expect(context.bodyPreview).not.toContain('service-secret-value');
  });

  it('redacts request secrets from upstream error text that echoes them', () => {
    const context = createRedactedAIServiceRequestLogContext(
      JSON.stringify({ apiKey: 'provider-key-secret', token: 'access-token-secret' }),
    );

    const redacted = context.redactText(
      'provider rejected provider-key-secret while using access-token-secret',
    );

    expect(redacted).toBe('provider rejected [REDACTED] while using [REDACTED]');
  });

  it('fails closed for an unexpected non-JSON body instead of logging the raw body', () => {
    const context = createRedactedAIServiceRequestLogContext(
      'Authorization: Bearer should-never-appear-in-logs',
    );

    expect(context.bodyPreview).toBe('[unavailable non-json body]');
    expect(context.bodyPreview).not.toContain('should-never-appear-in-logs');
  });
});
