import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiBaseUrl } from '../api-config';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
}));

describe('getApiBaseUrl', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('prefers explicit desktop API env injection', () => {
    process.env.DAILYUSE_API_URL = 'https://desktop-api.example.com/api/v1';
    delete process.env.PROXY_TARGET_URL;

    expect(getApiBaseUrl()).toBe('https://desktop-api.example.com/api/v1');
  });

  it('derives desktop API URL from proxy target when explicit env is absent', () => {
    delete process.env.DAILYUSE_API_URL;
    delete process.env.API_BASE_URL;
    delete process.env.VITE_API_URL;
    process.env.VITE_API_BASE_URL = '/api/v1';
    process.env.PROXY_TARGET_URL = 'http://localhost:3000';

    expect(getApiBaseUrl()).toBe('http://localhost:3000/api/v1');
  });

  it('throws when no usable API env is provided', () => {
    delete process.env.DAILYUSE_API_URL;
    delete process.env.API_BASE_URL;
    delete process.env.VITE_API_URL;
    delete process.env.VITE_API_BASE_URL;
    delete process.env.PROXY_TARGET_URL;
    delete process.env.API_DOMAIN;

    expect(() => getApiBaseUrl()).toThrow(/Desktop API base URL is not configured/);
  });
});
