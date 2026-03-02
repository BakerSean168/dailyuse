/**
 * Task Instance API Smoke Tests
 *
 * Tests the full HTTP pipeline for task instance endpoints:
 *   Supertest -> Express -> Auth MW -> expressAdapter -> Controller -> Use Case -> Mock Repo
 *
 * Each endpoint is tested for:
 *   1. Auth gate (401 without token)
 *   2. Happy path (200 with valid request)
 *   3. Validation / business-rule rejection (422/404 where applicable)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createSmokeApp, TEST_IDENTITY_ID, type SmokeTestApp } from '../helpers/create-smoke-app';
import { TaskInstance } from '@dailyuse/task/domain-server';
import { TaskTimeConfig, TaskTemplateId } from '@dailyuse/task/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared';

// Mock eventBus to prevent console noise and import side-effects from fire-and-forget events
vi.mock('@dailyuse/utils', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    eventBus: { send: vi.fn(), on: vi.fn(), off: vi.fn() },
  };
});

// ============================================================================
// Helpers
// ============================================================================

const FAKE_TEMPLATE_ID = TaskTemplateId.generate();

/**
 * Create a real TaskInstance aggregate via the domain factory method.
 * Uses proper value object classes so toClientDTO() works correctly.
 */
function makeFakeInstance(
  overrides: Partial<{
    templateId: typeof FAKE_TEMPLATE_ID;
    identityId: typeof TEST_IDENTITY_ID;
    status: string;
  }> = {},
): TaskInstance {
  const instance = TaskInstance.create({
    templateId: (overrides.templateId ?? FAKE_TEMPLATE_ID) as any,
    identityId: (overrides.identityId ?? TEST_IDENTITY_ID) as any,
    instanceDate: Date.now(),
    timeConfig: TaskTimeConfig.create({
      timeType: 'AllDay',
      startDate: null,
      timePoint: null,
      timeRange: null,
    }),
    importance: 'Moderate',
  });

  // Transition to desired status if requested
  if (overrides.status === 'InProgress') {
    instance.start();
  } else if (overrides.status === 'Completed') {
    instance.complete();
  } else if (overrides.status === 'Skipped') {
    instance.skip();
  }

  return instance;
}

// ============================================================================
// Tests
// ============================================================================

describe('Task Instance API Smoke Tests', () => {
  let ctx: SmokeTestApp;

  beforeEach(() => {
    ctx = createSmokeApp();
  });

  // =========================================================================
  // GET /api/v1/task-instances -- List instances
  // =========================================================================
  describe('GET /api/v1/task-instances', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).get('/api/v1/task-instances');

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return 200 with empty list (default: listByAccount)', async () => {
      const res = await request(ctx.app)
        .get('/api/v1/task-instances')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return instances from repository', async () => {
      const instance = makeFakeInstance();
      (ctx.instanceRepo.findByIdentityId as any).mockResolvedValue([instance]);

      const res = await request(ctx.app)
        .get('/api/v1/task-instances')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('Pending');
      expect(res.body.data[0].importance).toBe('Moderate');
    });

    it('should route to listByTemplate when templateId filter is provided', async () => {
      (ctx.instanceRepo.findByTemplateId as any).mockResolvedValue([]);

      const res = await request(ctx.app)
        .get(`/api/v1/task-instances?templateId=${FAKE_TEMPLATE_ID}`)
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(ctx.instanceRepo.findByTemplateId).toHaveBeenCalled();
    });

    it('should route to listByStatus when status filter is provided', async () => {
      (ctx.instanceRepo.findByStatus as any).mockResolvedValue([]);

      const res = await request(ctx.app)
        .get('/api/v1/task-instances?status=Completed')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(ctx.instanceRepo.findByStatus).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GET /api/v1/task-instances/by-date-range -- Get instances by date range
  // =========================================================================
  describe('GET /api/v1/task-instances/by-date-range', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).get('/api/v1/task-instances/by-date-range');

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return 200 with empty list', async () => {
      const res = await request(ctx.app)
        .get('/api/v1/task-instances/by-date-range?startDate=1000000&endDate=2000000')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return instances within date range', async () => {
      const instance = makeFakeInstance();
      (ctx.instanceRepo.findByDateRange as any).mockResolvedValue([instance]);

      const res = await request(ctx.app)
        .get('/api/v1/task-instances/by-date-range?startDate=1000000&endDate=2000000')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBeDefined();
    });

    it('should pass query params as numbers to use case', async () => {
      const res = await request(ctx.app)
        .get('/api/v1/task-instances/by-date-range?startDate=1704067200000&endDate=1704153600000')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      // The route handler converts query strings to Number()
      expect(ctx.instanceRepo.findByDateRange).toHaveBeenCalledWith(
        TEST_IDENTITY_ID,
        1704067200000,
        1704153600000,
      );
    });
  });

  // =========================================================================
  // GET /api/v1/task-instances/:id -- Get instance by ID
  // =========================================================================
  describe('GET /api/v1/task-instances/:id', () => {
    // Note: Route has requireAuth: false in expressAdapter options, but [auth]
    // middleware is still applied, so token IS required in practice.
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).get('/api/v1/task-instances/some-uuid');

      expect(res.status).toBe(401);
    });

    it('should return 200 with null when instance not found', async () => {
      const res = await request(ctx.app)
        .get('/api/v1/task-instances/some-uuid')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('should return 200 with instance when found', async () => {
      const instance = makeFakeInstance();
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .get(`/api/v1/task-instances/${instance.id}`)
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.templateId).toBeDefined();
    });
  });

  // =========================================================================
  // POST /api/v1/task-instances/:id/start -- Start instance
  // =========================================================================
  describe('POST /api/v1/task-instances/:id/start', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).post('/api/v1/task-instances/some-id/start');

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return 404 when instance not found', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/task-instances/non-existent-id/start')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 and start a Pending instance', async () => {
      const instance = makeFakeInstance(); // Pending by default
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/start`)
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('InProgress');
      expect(ctx.instanceRepo.save).toHaveBeenCalled();
    });

    it('should return 422 when instance cannot be started (already InProgress)', async () => {
      const instance = makeFakeInstance({ status: 'InProgress' });
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/start`)
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // POST /api/v1/task-instances/:id/complete -- Complete instance
  // =========================================================================
  describe('POST /api/v1/task-instances/:id/complete', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).post('/api/v1/task-instances/some-id/complete').send({});

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return 404 when instance not found', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/task-instances/non-existent-id/complete')
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 and complete a Pending instance', async () => {
      const instance = makeFakeInstance(); // Pending by default
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/complete`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('Completed');
      expect(ctx.instanceRepo.save).toHaveBeenCalled();
    });

    it('should return 200 and complete with optional fields', async () => {
      const instance = makeFakeInstance({ status: 'InProgress' });
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/complete`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({ duration: 3600000, note: 'Done well', rating: 5 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('Completed');
    });

    it('should return 422 when instance cannot be completed (already Completed)', async () => {
      const instance = makeFakeInstance({ status: 'Completed' });
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/complete`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // POST /api/v1/task-instances/:id/skip -- Skip instance
  // =========================================================================
  describe('POST /api/v1/task-instances/:id/skip', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).post('/api/v1/task-instances/some-id/skip').send({});

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return 404 when instance not found', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/task-instances/non-existent-id/skip')
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 and skip a Pending instance', async () => {
      const instance = makeFakeInstance(); // Pending by default
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/skip`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('Skipped');
      expect(ctx.instanceRepo.save).toHaveBeenCalled();
    });

    it('should return 200 and skip with optional reason', async () => {
      const instance = makeFakeInstance(); // Pending by default
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/skip`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({ reason: 'Too busy today' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('Skipped');
    });

    it('should return 422 when instance cannot be skipped (already Completed)', async () => {
      const instance = makeFakeInstance({ status: 'Completed' });
      (ctx.instanceRepo.findById as any).mockResolvedValue(instance);

      const res = await request(ctx.app)
        .post(`/api/v1/task-instances/${instance.id}/skip`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // DELETE /api/v1/task-instances/:id -- Delete instance
  // =========================================================================
  describe('DELETE /api/v1/task-instances/:id', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(ctx.app).delete('/api/v1/task-instances/some-id');

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return 200 (idempotent delete, no findById check)', async () => {
      const res = await request(ctx.app)
        .delete('/api/v1/task-instances/non-existent-id')
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should call instanceRepository.delete', async () => {
      const instance = makeFakeInstance();

      const res = await request(ctx.app)
        .delete(`/api/v1/task-instances/${instance.id}`)
        .set('Authorization', `Bearer ${ctx.token}`);

      expect(res.status).toBe(200);
      expect(ctx.instanceRepo.delete).toHaveBeenCalledWith(instance.id.toString());
    });
  });
});
