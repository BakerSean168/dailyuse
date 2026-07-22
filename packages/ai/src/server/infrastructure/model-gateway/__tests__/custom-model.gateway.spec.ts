import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomModelGateway, CUSTOM_MODEL_GATEWAY_ID } from '../custom-model.gateway';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomModelGateway', () => {
  it('exposes openai_compatible descriptor without credentialsInEvents', () => {
    const gateway = new CustomModelGateway();
    expect(gateway.descriptor.gatewayId).toBe(CUSTOM_MODEL_GATEWAY_ID);
    expect(gateway.descriptor.kind).toBe('openai_compatible');
    expect(gateway.descriptor.placement).toBe('server');
    expect(gateway.descriptor.credentialsInEvents).toBe(false);
  });

  it('complete returns content + modelBindingId and never echoes apiKey', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            model: 'gpt-4.1-mini',
            choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const gateway = new CustomModelGateway();
    const result = await gateway.complete({
      auth: {
        bindingId: 'provider-cfg-1',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-secret-must-not-leak',
      },
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.content).toBe('ok');
    expect(result.modelBindingId).toBe('provider-cfg-1');
    expect(JSON.stringify(result)).not.toContain('sk-secret-must-not-leak');
    expect(JSON.stringify(result)).not.toContain('apiKey');
  });

  it('stream yields a single final chunk from complete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'streamed' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const gateway = new CustomModelGateway();
    const chunks: Array<{ content: string; finishReason?: string }> = [];
    for await (const chunk of gateway.stream({
      auth: {
        bindingId: 'b1',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-x',
      },
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual([{ content: 'streamed', finishReason: 'stop' }]);
  });
});
