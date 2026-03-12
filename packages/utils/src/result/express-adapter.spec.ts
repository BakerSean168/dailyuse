/**
 * Express Adapter Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expressAdapter, expressAdapterWithValidation, formatZodErrors } from './express-adapter';
import { ok, fail } from '@dailyuse/contracts/result';
import { ConflictError } from '../errors/DomainError';

// ============================================================================
// Mock helpers
// ============================================================================

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { identityId: 'user-1', sessionId: 'session-1' },
    traceId: 'trace-1',
    startTime: Date.now(),
    ...overrides,
  };
}

function createMockRes() {
  const res: any = {
    statusCode: 0,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res;
}

function createMockSchema(data: unknown, shouldFail = false) {
  return {
    safeParse: (input: unknown) => {
      if (shouldFail) {
        return {
          success: false as const,
          error: {
            issues: [
              { path: ['name'], message: 'Required' },
              { path: ['nested', 'field'], message: 'Invalid' },
            ],
          },
        };
      }
      return { success: true as const, data };
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('formatZodErrors', () => {
  it('should format Zod issues into ResultErrorDetail array', () => {
    const issues = [
      { path: ['name'], message: 'Required' },
      { path: ['address', 'city'], message: 'Too short' },
    ];

    const result = formatZodErrors(issues);

    expect(result).toEqual([
      { field: 'name', code: 'INVALID_FIELD', message: 'Required' },
      { field: 'address.city', code: 'INVALID_FIELD', message: 'Too short' },
    ]);
  });

  it('should handle empty issues array', () => {
    expect(formatZodErrors([])).toEqual([]);
  });
});

describe('expressAdapter', () => {
  it('should call controller and return success response', async () => {
    const controllerFn = vi.fn().mockResolvedValue(ok({ id: '1', name: 'Test' }));
    const handler = expressAdapter(controllerFn);

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).toHaveBeenCalledWith(req, { identityId: 'user-1', deviceId: 'unknown' });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toEqual({ id: '1', name: 'Test' });
  });

  it('should use custom successStatus', async () => {
    const controllerFn = vi.fn().mockResolvedValue(ok({ id: '1' }));
    const handler = expressAdapter(controllerFn, { successStatus: 201 });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(201);
  });

  it('should return 401 when user is not authenticated and requireAuth is true', async () => {
    const controllerFn = vi.fn();
    const handler = expressAdapter(controllerFn, { requireAuth: true });

    const req = createMockReq({ user: undefined });
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('should skip auth check when requireAuth is false', async () => {
    const controllerFn = vi.fn().mockResolvedValue(ok('public-data'));
    const handler = expressAdapter(controllerFn, { requireAuth: false });

    const req = createMockReq({ user: undefined });
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('should handle controller failure result', async () => {
    const controllerFn = vi.fn().mockResolvedValue(
      fail({
        code: 'NOT_FOUND',
        message: 'Goal not found',
        context: { entity: 'goal', id: 'goal-1' },
      }),
    );
    const handler = expressAdapter(controllerFn);

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.context).toEqual({ entity: 'goal', id: 'goal-1' });
  });

  it('should handle thrown errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const controllerFn = vi.fn().mockRejectedValue(new Error('Database error'));
    const handler = expressAdapter(controllerFn);

    const req = createMockReq();
    const res = createMockRes();

    try {
      await handler(req, res);
    } finally {
      consoleErrorSpy.mockRestore();
    }

    expect(res.statusCode).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  it('should use custom context extractor', async () => {
    const controllerFn = vi.fn().mockResolvedValue(ok('ok'));
    const handler = expressAdapter(controllerFn, {
      extractContext: () => ({ identityId: 'custom-id', deviceId: 'mobile' }),
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).toHaveBeenCalledWith(req, { identityId: 'custom-id', deviceId: 'mobile' });
  });

  it('should preserve domain error context in error responses', async () => {
    const controllerFn = vi
      .fn()
      .mockRejectedValue(
        new ConflictError('Multiple repositories found', { count: 2, repositoryIds: ['repo-1'] }),
      );
    const handler = expressAdapter(controllerFn);

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.context).toEqual({
      count: 2,
      repositoryIds: ['repo-1'],
    });
  });
});

describe('expressAdapterWithValidation', () => {
  it('should validate body and call controller on success', async () => {
    const inputData = { name: 'Test Goal' };
    const schema = createMockSchema(inputData);
    const controllerFn = vi.fn().mockResolvedValue(ok({ id: '1', name: 'Test Goal' }));
    const handler = expressAdapterWithValidation(schema, controllerFn);

    const req = createMockReq({ body: inputData });
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).toHaveBeenCalledWith(
      inputData,
      { identityId: 'user-1', deviceId: 'unknown' },
      req,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should return 400 when validation fails', async () => {
    const schema = createMockSchema(null, true);
    const controllerFn = vi.fn();
    const handler = expressAdapterWithValidation(schema, controllerFn);

    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.details).toHaveLength(2);
    expect(res.body.error.details[0]).toEqual({
      field: 'name',
      code: 'INVALID_FIELD',
      message: 'Required',
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    const schema = createMockSchema({ name: 'Test' });
    const controllerFn = vi.fn();
    const handler = expressAdapterWithValidation(schema, controllerFn);

    const req = createMockReq({ body: { name: 'Test' }, user: undefined });
    const res = createMockRes();

    await handler(req, res);

    expect(controllerFn).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should pass req to controller for accessing params', async () => {
    const schema = createMockSchema({ title: 'Updated' });
    const controllerFn = vi.fn().mockResolvedValue(ok({ id: 'goal-1', title: 'Updated' }));
    const handler = expressAdapterWithValidation(schema, controllerFn);

    const req = createMockReq({
      body: { title: 'Updated' },
      params: { id: 'goal-1' },
    });
    const res = createMockRes();

    await handler(req, res);

    const [, , passedReq] = controllerFn.mock.calls[0];
    expect(passedReq.params.id).toBe('goal-1');
  });

  it('should use custom successStatus', async () => {
    const schema = createMockSchema({ name: 'New' });
    const controllerFn = vi.fn().mockResolvedValue(ok({ id: '1' }));
    const handler = expressAdapterWithValidation(schema, controllerFn, { successStatus: 201 });

    const req = createMockReq({ body: { name: 'New' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(201);
  });

  it('should handle controller errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const schema = createMockSchema({ name: 'Test' });
    const controllerFn = vi.fn().mockRejectedValue(new Error('Unexpected'));
    const handler = expressAdapterWithValidation(schema, controllerFn);

    const req = createMockReq({ body: { name: 'Test' } });
    const res = createMockRes();

    try {
      await handler(req, res);
    } finally {
      consoleErrorSpy.mockRestore();
    }

    expect(res.statusCode).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
