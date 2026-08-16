import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { IApiModule } from './shared/contracts/api-module';
import { ApiBootstrapper } from './bootstrap';
import { createCloudAuthStub } from './test/cloud-auth.stub';

describe('ApiBootstrapper', () => {
  it('registers modules with the shared transport context and mounts routes on both API prefixes', async () => {
    const db = { tag: 'test-db' };
    const register = vi.fn((context: Parameters<IApiModule['register']>[0]) => {
      context.router.get('/bootstrap-probe', (_req, res) => {
        res.json({ ok: true, route: 'probe' });
      });
    });

    const module: IApiModule = {
      name: 'ProbeModule',
      register,
    };

    const app = await new ApiBootstrapper(db, createCloudAuthStub()).register(module).init();

    expect(register).toHaveBeenCalledTimes(1);
    const context = register.mock.calls[0][0];
    // The registration context is transport-only: no db is ever exposed.
    expect((context as unknown as Record<string, unknown>).db).toBeUndefined();
    expect(context.middleware.auth).toBeTypeOf('function');
    expect(context.middleware.requireRole).toBeTypeOf('function');
    expect(context.openApiRegistry).toBeDefined();

    const apiResponse = await request(app).get('/api/bootstrap-probe');
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.body).toEqual({ ok: true, route: 'probe' });

    const versionedResponse = await request(app).get('/api/v1/bootstrap-probe');
    expect(versionedResponse.status).toBe(200);
    expect(versionedResponse.body).toEqual({ ok: true, route: 'probe' });
  });

  it('destroys registered modules and keeps going when one destroy step fails', async () => {
    const destroyed: string[] = [];
    const failingDestroy = vi.fn(async () => {
      destroyed.push('broken');
      throw new Error('destroy failed');
    });

    const bootstrapper = new ApiBootstrapper({}, createCloudAuthStub());
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

  it('exposes captured Better Auth links only when the test collector is injected', async () => {
    const capture = {
      findLatest: vi.fn((email: string, kind: string) => ({
        email,
        kind,
        url: 'https://api.test/api/auth/verify-email?token=secret',
        capturedAt: '2026-08-02T00:00:00.000Z',
      })),
    };
    const testApp = await new ApiBootstrapper({}, createCloudAuthStub(), capture).init();

    const response = await request(testApp)
      .get('/api/auth/test/last-email-link')
      .query({ email: 'alice@example.com', kind: 'email-verification' });
    expect(response.status).toBe(200);
    expect(response.body.data.url).toContain('token=secret');

    const normalApp = await new ApiBootstrapper({}, createCloudAuthStub()).init();
    expect((await request(normalApp).get('/api/auth/test/last-email-link')).status).toBe(404);
  });
});
