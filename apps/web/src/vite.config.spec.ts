import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config';

describe('web Vite API proxy', () => {
  it('routes both versioned APIs and Better Auth through the shared /api boundary', async () => {
    expect(typeof viteConfig).toBe('function');
    if (typeof viteConfig !== 'function') return;

    const config = await viteConfig({
      command: 'serve',
      mode: 'development',
      isSsrBuild: false,
      isPreview: false,
    });

    expect(config.server?.proxy).toHaveProperty('/api');
    expect(config.server?.proxy).not.toHaveProperty('/api/v1');
  });
});
