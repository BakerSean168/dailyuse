import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { IApiModuleContext } from '../../shared/contracts/api-module.js';
import { composeLabelApiModule } from './module.js';

function createContext(): IApiModuleContext {
  return {
    app: {} as IApiModuleContext['app'],
    router: Router(),
    middleware: {
      auth: (req, _res, next) => {
        (req as { user?: { identityId: string } }).user = { identityId: 'identity-1' };
        next();
      },
      requireRole: () => (_req, _res, next) => next(),
    },
  };
}

async function createHttpHarness(service: {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}) {
  const module = composeLabelApiModule({ service });
  const context = createContext();
  module.register(context);
  const expressModule = await import('express');
  const expressApp = expressModule.default();
  expressApp.use(expressModule.default.json());
  expressApp.use('/api', context.router);
  return expressApp;
}

describe('composeLabelApiModule', () => {
  it('lists current-user labels without returning identity ownership fields', async () => {
    const service = {
      list: vi.fn().mockResolvedValue([
        {
          id: 'label-1',
          identityId: 'identity-1',
          name: 'Work',
          normalizedName: 'work',
          color: '#3b82f6',
          createdAt: 1,
          updatedAt: 2,
        },
      ]),
      create: vi.fn(),
    };
    const app = await createHttpHarness(service);

    const res = await request(app).get('/api/labels?search=work&limit=20');

    expect(res.status).toBe(200);
    expect(service.list).toHaveBeenCalledWith({
      identityId: 'identity-1',
      search: 'work',
      limit: 20,
    });
    expect(res.body.data).toEqual([
      { id: 'label-1', name: 'Work', color: '#3b82f6', createdAt: 1, updatedAt: 2 },
    ]);
    expect(JSON.stringify(res.body.data)).not.toContain('identity-1');
    expect(JSON.stringify(res.body.data)).not.toContain('normalizedName');
  });

  it('creates through authenticated identity and rejects invalid requests before the service', async () => {
    const service = {
      list: vi.fn(),
      create: vi.fn().mockResolvedValue({
        id: 'label-2',
        identityId: 'identity-1',
        name: 'Health',
        normalizedName: 'health',
        color: null,
        createdAt: 3,
        updatedAt: 3,
      }),
    };
    const app = await createHttpHarness(service);

    const created = await request(app).post('/api/labels').send({ name: ' Health ', color: null });
    expect(created.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith({
      identityId: 'identity-1',
      name: 'Health',
      color: null,
    });
    expect(created.body.data).toMatchObject({ id: 'label-2', name: 'Health', color: null });

    service.create.mockClear();
    const invalid = await request(app).post('/api/labels').send({ name: '' });
    expect(invalid.status).toBe(422);
    expect(invalid.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(service.create).not.toHaveBeenCalled();
  });
});
