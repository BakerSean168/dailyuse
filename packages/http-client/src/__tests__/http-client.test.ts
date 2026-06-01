import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClientError } from '../axios-http-client';
import { createAxiosInstance } from '../axios-instance';
import { DEFAULT_HTTP_CLIENT_CONFIG } from '../types';

describe('HttpClientError', () => {
  it('stores message, code, status, details, cause, and context', () => {
    const cause = new Error('original');
    const err = new HttpClientError('msg', 'CODE', 422, { field: 'x' }, cause, { extra: 1 });

    expect(err.message).toBe('msg');
    expect(err.code).toBe('CODE');
    expect(err.status).toBe(422);
    expect(err.details).toEqual({ field: 'x' });
    expect(err.cause).toBe(cause);
    expect(err.context).toEqual({ extra: 1 });
    expect(err.name).toBe('HttpClientError');
    expect(err).toBeInstanceOf(Error);
  });

  it('allows optional fields to be undefined', () => {
    const err = new HttpClientError('msg', 'ERR', 500);
    expect(err.details).toBeUndefined();
    expect(err.cause).toBeUndefined();
    expect(err.context).toBeUndefined();
  });
});

describe('createAxiosInstance', () => {
  it('creates instance with default config', () => {
    const instance = createAxiosInstance();
    expect(instance.defaults.baseURL).toBe(DEFAULT_HTTP_CLIENT_CONFIG.baseURL);
    expect(instance.defaults.timeout).toBe(DEFAULT_HTTP_CLIENT_CONFIG.timeout);
  });

  it('accepts custom baseURL and timeout', () => {
    const instance = createAxiosInstance({ baseURL: '/custom', timeout: 5000 });
    expect(instance.defaults.baseURL).toBe('/custom');
    expect(instance.defaults.timeout).toBe(5000);
  });

  it('injects Bearer token from tokenProvider', async () => {
    const instance = createAxiosInstance({
      baseURL: 'http://localhost',
      tokenProvider: { getAccessToken: () => 'test-token' },
    });

    // Capture the request config via a spy on the adapter
    const adapter = vi.fn(async (config: any) => ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    instance.defaults.adapter = adapter;

    await instance.get('/test');

    expect(adapter).toHaveBeenCalled();
    const config = adapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not inject Authorization when tokenProvider returns null', async () => {
    const instance = createAxiosInstance({
      baseURL: 'http://localhost',
      tokenProvider: { getAccessToken: () => null },
    });

    const adapter = vi.fn(async (config: any) => ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    instance.defaults.adapter = adapter;

    await instance.get('/test');

    const config = adapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('merges extra axiosConfig', () => {
    const instance = createAxiosInstance({
      axiosConfig: { withCredentials: true },
    });
    expect(instance.defaults.withCredentials).toBe(true);
  });
});

describe('AxiosHttpClient', () => {
  // Dynamically import to avoid circular dep issues
  let AxiosHttpClient: typeof import('../axios-http-client').AxiosHttpClient;

  beforeEach(async () => {
    const mod = await import('../axios-http-client');
    AxiosHttpClient = mod.AxiosHttpClient;
  });

  it('get() returns data from standard envelope', async () => {
    const client = new AxiosHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => ({
      data: { ok: true, data: { id: 1 }, message: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await client.get('/test');
    expect(result).toEqual({ id: 1 });
  });

  it('get() returns raw data when no envelope', async () => {
    const client = new AxiosHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => ({
      data: { raw: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await client.get('/test');
    expect(result).toEqual({ raw: true });
  });

  it('get() throws HttpClientError on ok:false envelope', async () => {
    const client = new AxiosHttpClient({ baseURL: 'http://localhost' });
    const axios = client.getAxiosInstance();

    axios.defaults.adapter = async () => ({
      data: { ok: false, error: { message: 'fail', code: 'ERR', details: null } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    await expect(client.get('/test')).rejects.toThrow(HttpClientError);
    try {
      await client.get('/test');
    } catch (e: any) {
      expect(e.code).toBe('ERR');
      expect(e.message).toBe('fail');
    }
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

  it('get() returns raw data when no envelope', async () => {
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
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ plain: true });
    }
  });
});
