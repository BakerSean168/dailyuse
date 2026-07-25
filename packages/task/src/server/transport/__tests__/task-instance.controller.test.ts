import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, fail, isOk } from '@dailyuse/contracts/result';
import { anIdentityId } from '@/testing';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import { TaskInstanceController, type TaskInstanceUseCases } from '../task-instance.controller';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUseCases(): TaskInstanceUseCases {
  return {
    getTaskInstance: vi.fn(),
    listByAccount: vi.fn(),
    listByTemplate: vi.fn(),
    listByStatus: vi.fn(),
    getByDateRange: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    start: vi.fn(),
    deleteInstance: vi.fn(),
    checkExpired: vi.fn(),
  } as unknown as TaskInstanceUseCases;
}

const TEST_IDENTITY_ID = anIdentityId();

const FAKE_INSTANCE_DTO: TaskInstanceClientDTO = {
  id: 'inst_abc123',
  templateId: 'tmpl_abc123',
  identityId: TEST_IDENTITY_ID,
  instanceDate: 1000,
  timeConfig: { timeType: 'AllDay', startDate: null, timePoint: null, timeRange: null },
  importance: 'Moderate',
  priority: 1,
  status: 'Pending',
  actualStartTime: null,
  actualEndTime: null,
  comment: null,
  version: 1,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
} as unknown as TaskInstanceClientDTO;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskInstanceController', () => {
  const ctx = { identityId: TEST_IDENTITY_ID } as any;
  let useCases: TaskInstanceUseCases;
  let controller: TaskInstanceController;

  beforeEach(() => {
    useCases = createMockUseCases();
    controller = new TaskInstanceController(useCases);
  });

  // =========================================================================
  // getInstance
  // =========================================================================
  describe('getInstance', () => {
    it('should call getTaskInstance use case with id', async () => {
      (useCases.getTaskInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_INSTANCE_DTO),
      );

      await controller.getInstance('inst_abc123', ctx);

      expect(useCases.getTaskInstance).toHaveBeenCalledWith('inst_abc123', TEST_IDENTITY_ID);
    });

    it('should pass through use case result directly', async () => {
      const expectedResult = ok(FAKE_INSTANCE_DTO);
      (useCases.getTaskInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getInstance('inst_abc123', ctx);

      expect(result).toBe(expectedResult);
    });

    it('should return null result when instance not found', async () => {
      (useCases.getTaskInstance as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));

      const result = await controller.getInstance('inst_nonexistent', ctx);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBeNull();
      }
    });
  });

  // =========================================================================
  // listInstances — routing logic
  // =========================================================================
  describe('listInstances', () => {
    it('should call listByTemplate when templateId is provided', async () => {
      (useCases.listByTemplate as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, { templateId: 'tmpl_1' });

      expect(useCases.listByTemplate).toHaveBeenCalledWith('tmpl_1', TEST_IDENTITY_ID);
      expect(useCases.listByStatus).not.toHaveBeenCalled();
      expect(useCases.listByAccount).not.toHaveBeenCalled();
    });

    it('should call listByStatus when status is provided (and no templateId)', async () => {
      (useCases.listByStatus as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, { status: 'Pending' as any });

      expect(useCases.listByStatus).toHaveBeenCalledWith(TEST_IDENTITY_ID, 'Pending');
      expect(useCases.listByTemplate).not.toHaveBeenCalled();
      expect(useCases.listByAccount).not.toHaveBeenCalled();
    });

    it('should call listByAccount when no filters are provided', async () => {
      (useCases.listByAccount as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID);

      expect(useCases.listByAccount).toHaveBeenCalledWith(TEST_IDENTITY_ID);
      expect(useCases.listByTemplate).not.toHaveBeenCalled();
      expect(useCases.listByStatus).not.toHaveBeenCalled();
    });

    it('should prioritize templateId over status', async () => {
      (useCases.listByTemplate as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, {
        templateId: 'tmpl_1',
        status: 'Pending' as any,
      });

      expect(useCases.listByTemplate).toHaveBeenCalledWith('tmpl_1', TEST_IDENTITY_ID);
      expect(useCases.listByStatus).not.toHaveBeenCalled();
    });

    it('should call listByAccount when filters is empty object', async () => {
      (useCases.listByAccount as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, {});

      expect(useCases.listByAccount).toHaveBeenCalledWith(TEST_IDENTITY_ID);
    });
  });

  // =========================================================================
  // getInstancesByDateRange
  // =========================================================================
  describe('getInstancesByDateRange', () => {
    it('should call getByDateRange use case with all parameters', async () => {
      (useCases.getByDateRange as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ data: [FAKE_INSTANCE_DTO], total: 1 }),
      );

      await controller.getInstancesByDateRange(TEST_IDENTITY_ID, { startDate: 1000, endDate: 2000 });

      expect(useCases.getByDateRange).toHaveBeenCalledWith(TEST_IDENTITY_ID, 1000, 2000);
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'VALIDATION_ERROR', message: 'Invalid range' });
      (useCases.getByDateRange as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.getInstancesByDateRange(TEST_IDENTITY_ID, { startDate: 1000, endDate: 2000 });

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return ok with instances from use case result', async () => {
      (useCases.getByDateRange as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ data: [FAKE_INSTANCE_DTO], total: 1 }),
      );

      const result = await controller.getInstancesByDateRange(TEST_IDENTITY_ID, { startDate: 1000, endDate: 2000 });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual([FAKE_INSTANCE_DTO]);
      }
    });
  });

  // =========================================================================
  // completeInstance
  // =========================================================================
  describe('completeInstance', () => {
    it('should return VALIDATION_ERROR for invalid input', async () => {
      // rating must be integer 1-5
      const result = await controller.completeInstance('inst_1', { rating: 10 }, ctx);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('参数验证失败');
        expect(result.error.details).toBeDefined();
      }
      expect(useCases.complete).not.toHaveBeenCalled();
    });

    it('should accept empty object (all fields optional)', async () => {
      (useCases.complete as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.completeInstance('inst_1', {}, ctx);

      expect(useCases.complete).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID, {});
      expect(isOk(result)).toBe(true);
    });

    it('should normalize a missing transport body to an empty object', async () => {
      (useCases.complete as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.completeInstance('inst_1', undefined, ctx);

      expect(useCases.complete).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID, {});
      expect(isOk(result)).toBe(true);
    });

    it('should call complete use case with parsed data', async () => {
      (useCases.complete as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      await controller.completeInstance('inst_1', {
        duration: 30,
        note: 'Done well',
        rating: 4,
      }, ctx);

      expect(useCases.complete).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID, {
        duration: 30,
        note: 'Done well',
        rating: 4,
      });
    });

    it('should unwrap result.data.instance', async () => {
      (useCases.complete as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.completeInstance('inst_1', {}, ctx);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_INSTANCE_DTO);
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Instance not found' });
      (useCases.complete as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.completeInstance('inst_1', {}, ctx);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should reject non-integer rating', async () => {
      const result = await controller.completeInstance('inst_1', { rating: 3.5 }, ctx);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject rating below 1', async () => {
      const result = await controller.completeInstance('inst_1', { rating: 0 }, ctx);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // =========================================================================
  // skipInstance
  // =========================================================================
  describe('skipInstance', () => {
    it('should normalize a missing transport body to an empty object', async () => {
      (useCases.skip as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.skipInstance('inst_1', undefined, ctx);

      expect(useCases.skip).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID, {});
      expect(isOk(result)).toBe(true);
    });

    it('should accept empty object (reason is optional)', async () => {
      (useCases.skip as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.skipInstance('inst_1', {}, ctx);

      expect(useCases.skip).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID, {});
      expect(isOk(result)).toBe(true);
    });

    it('should call skip use case with reason', async () => {
      (useCases.skip as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      await controller.skipInstance('inst_1', { reason: 'Too tired' }, ctx);

      expect(useCases.skip).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID, { reason: 'Too tired' });
    });

    it('should unwrap result.data.instance', async () => {
      (useCases.skip as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.skipInstance('inst_1', {}, ctx);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_INSTANCE_DTO);
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Not found' });
      (useCases.skip as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.skipInstance('inst_1', {}, ctx);

      expect(isOk(result)).toBe(false);
    });

    it('should return VALIDATION_ERROR for invalid input type', async () => {
      // Pass a non-object to trigger Zod validation failure
      const result = await controller.skipInstance('inst_1', 'invalid', ctx);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // =========================================================================
  // startInstance
  // =========================================================================
  describe('startInstance', () => {
    it('should call start use case with id', async () => {
      (useCases.start as ReturnType<typeof vi.fn>).mockResolvedValue(ok(FAKE_INSTANCE_DTO));

      await controller.startInstance('inst_1', ctx);

      expect(useCases.start).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID);
    });

    it('should pass through use case result directly', async () => {
      const expectedResult = ok(FAKE_INSTANCE_DTO);
      (useCases.start as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const result = await controller.startInstance('inst_1', ctx);

      expect(result).toBe(expectedResult);
    });
  });

  // =========================================================================
  // deleteInstance
  // =========================================================================
  describe('deleteInstance', () => {
    it('should call deleteInstance use case with id', async () => {
      (useCases.deleteInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(undefined),
      );

      await controller.deleteInstance('inst_1', ctx);

      expect(useCases.deleteInstance).toHaveBeenCalledWith('inst_1', TEST_IDENTITY_ID);
    });

    it('should normalize success to ok(null)', async () => {
      (useCases.deleteInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(undefined),
      );

      const result = await controller.deleteInstance('inst_1', ctx);

      expect(result).toEqual(ok(null));
    });
  });
});
