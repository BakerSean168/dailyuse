import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAxiosInstance } from '../axios-instance';
import { DEFAULT_HTTP_CLIENT_CONFIG } from '../types';

describe('createAxiosInstance', () => {
  it('creates instance with default config', () => {
    const instance = createAxiosInstance();
    expect(instance.defaults.baseURL).toBe(DEFAULT_HTTP_CLIENT_CONFIG.baseURL);
    expect(instance.defaults.timeout).toBe(DEFAULT_HTTP_CLIENT_CONFIG.timeout);
  });

  it('accepts custom baseURL and timeout', () => {
    const instance = createAxiosInstance({ baseURL: 'https://api.example', timeout: 5000 });
    expect(instance.defaults.baseURL).toBe('https://api.example');
    expect(instance.defaults.timeout).toBe(5000);
  });

  it('injects Bearer token from tokenProvider', async () => {
    const instance = createAxiosInstance({
      tokenProvider: { getAccessToken: () => 'token-abc' },
    });

    let seenAuth: unknown;
    instance.defaults.adapter = async (config) => {
      const headers = config.headers as { get?: (k: string) => unknown; Authorization?: unknown };
      seenAuth = typeof headers?.get === 'function' ? headers.get('Authorization') : headers?.Authorization;
      return {
        data: { ok: true, data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await instance.get('/ping');
    expect(seenAuth).toBe('Bearer token-abc');
  });

  it('does not inject Authorization when tokenProvider returns null', async () => {
    const instance = createAxiosInstance({
      tokenProvider: { getAccessToken: () => null },
    });

    let seenAuth: unknown = 'unset';
    instance.defaults.adapter = async (config) => {
      const headers = config.headers as { get?: (k: string) => unknown; Authorization?: unknown };
      seenAuth = typeof headers?.get === 'function' ? headers.get('Authorization') : headers?.Authorization;
      return {
        data: { ok: true, data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await instance.get('/ping');
    expect(seenAuth == null || seenAuth === false || seenAuth === '').toBe(true);
  });

  it('merges extra axiosConfig', () => {
    const instance = createAxiosInstance({
      axiosConfig: { timeout: 1234 },
    });
    expect(instance.defaults.timeout).toBe(1234);
  });
});

describe('ResultHttpClient', () => {
  let ResultHttpClient: typeof import('../result-http-client').ResultHttpClient;

  beforeEach(async () => {
    const mod = await import('../result-http-client');
    ResultHttpClient = mod.ResultHttpClient;
  });

  it('get() returns Result.ok with envelope data', async () => {
    const client = new ResultHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => ({
      data: { ok: true, data: { value: 42 }, message: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await client.get('/test');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ value: 42 });
    }
  });

  it('get() returns Result.fail on HTTP 500', async () => {
    const client = new ResultHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => {
      throw Object.assign(new Error('Request failed'), {
        response: {
          data: { ok: false, error: { message: 'server err', code: 'INTERNAL' } },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
      });
    };

    const result = await client.get('/test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('server err');
    }
  });

  it('get() returns Result.fail on network error', async () => {
    const client = new ResultHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => {
      throw new Error('Network Error');
    };

    const result = await client.get('/test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('网络连接断开');
    }
  });

  it('get() returns Result.fail on timeout', async () => {
    const client = new ResultHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => {
      throw new Error('timeout of 10000ms exceeded');
    };

    const result = await client.get('/test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('网络请求超时');
    }
  });

  it('get() fails closed when response omits the Result envelope', async () => {
    const client = new ResultHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => ({
      data: { plain: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await client.get('/test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toMatch(/envelope|dual-track/i);
    }
  });

  it('get() fails closed when ok:true envelope omits the data key', async () => {
    const client = new ResultHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => ({
      data: { ok: true, message: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await client.get('/test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toMatch(/envelope|dual-track/i);
    }
  });
});
