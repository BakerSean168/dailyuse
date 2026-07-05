import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { IApiModule } from './shared/contracts/api-module';
import { ApiBootstrapper } from './bootstrap';

describe('ApiBootstrapper', () => {
  it('registers modules with the shared context and mounts routes on both API prefixes', async () => {
    const db = { tag: 'test-db' };
    const register = vi.fn((context: Parameters<IApiModule['register']>[0]) => {
      context.router.get('/bootstrap-probe', (_req, res) => {
        res.json({ ok: true, dbTag: (context.db as typeof db).tag });
      });
    });

    const module: IApiModule = {
      name: 'ProbeModule',
      register,
    };

    const app = await new ApiBootstrapper(db).register(module).init();

    expect(register).toHaveBeenCalledTimes(1);
    const context = register.mock.calls[0][0];
    expect(context.db).toBe(db);
    expect(context.middleware.auth).toBeTypeOf('function');
    expect(context.middleware.requireRole).toBeTypeOf('function');
    expect(context.openApiRegistry).toBeDefined();

    const apiResponse = await request(app).get('/api/bootstrap-probe');
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.body).toEqual({ ok: true, dbTag: 'test-db' });

    const versionedResponse = await request(app).get('/api/v1/bootstrap-probe');
    expect(versionedResponse.status).toBe(200);
    expect(versionedResponse.body).toEqual({ ok: true, dbTag: 'test-db' });
  });

  it('destroys registered modules and keeps going when one destroy step fails', async () => {
    const destroyed: string[] = [];
    const failingDestroy = vi.fn(async () => {
      destroyed.push('broken');
      throw new Error('destroy failed');
    });

    const bootstrapper = new ApiBootstrapper({});
    bootstrapper.register({
      name: 'BrokenModule',
      register: vi.fn(),
      destroy: failingDestroy,
    });
    bootstrapper.register({
      name: 'HealthyModule',
      register: vi.fn(),
      destroy: vi.fn(async () => {
        destroyed.push('healthy');
      }),
    });

    await bootstrapper.destroy();

    expect(failingDestroy).toHaveBeenCalledTimes(1);
    expect(destroyed).toEqual(['broken', 'healthy']);
  });
});
