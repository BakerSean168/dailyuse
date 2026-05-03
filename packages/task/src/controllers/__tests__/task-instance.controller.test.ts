import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, fail, isOk } from '@dailyuse/contracts/result';
import { anIdentityId } from '@dailyuse/task/testing';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import { TaskInstanceController, type TaskInstanceUseCases } from '../task-instance.controller';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUseCases(): TaskInstanceUseCases {
  return {
    getTaskInstance: { execute: vi.fn() },
    listByAccount: { execute: vi.fn() },
    listByTemplate: { execute: vi.fn() },
    listByStatus: { execute: vi.fn() },
    getByDateRange: { execute: vi.fn() },
    complete: { execute: vi.fn() },
    skip: { execute: vi.fn() },
    start: { execute: vi.fn() },
    deleteInstance: { execute: vi.fn() },
  } as unknown as TaskInstanceUseCases;
}

const FAKE_INSTANCE_DTO: TaskInstanceClientDTO = {
  id: 'inst_abc123',
  templateId: 'tmpl_abc123',
  status: 'Pending',
  scheduledDate: 1000,
  createdAt: 1000,
  updatedAt: 1000,
} as unknown as TaskInstanceClientDTO;

const TEST_IDENTITY_ID = anIdentityId();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskInstanceController', () => {
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
      (useCases.getTaskInstance.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_INSTANCE_DTO),
      );

      await controller.getInstance('inst_abc123');

      expect(useCases.getTaskInstance.execute).toHaveBeenCalledWith('inst_abc123');
    });

    it('should pass through use case result directly', async () => {
      const expectedResult = ok(FAKE_INSTANCE_DTO);
      (useCases.getTaskInstance.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getInstance('inst_abc123');

      expect(result).toBe(expectedResult);
    });

    it('should return null result when instance not found', async () => {
      (useCases.getTaskInstance.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));

      const result = await controller.getInstance('inst_nonexistent');

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
      (useCases.listByTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, { templateId: 'tmpl_1' });

      expect(useCases.listByTemplate.execute).toHaveBeenCalledWith('tmpl_1');
      expect(useCases.listByStatus.execute).not.toHaveBeenCalled();
      expect(useCases.listByAccount.execute).not.toHaveBeenCalled();
    });

    it('should call listByStatus when status is provided (and no templateId)', async () => {
      (useCases.listByStatus.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, { status: 'Pending' as any });

      expect(useCases.listByStatus.execute).toHaveBeenCalledWith(TEST_IDENTITY_ID, 'Pending');
      expect(useCases.listByTemplate.execute).not.toHaveBeenCalled();
      expect(useCases.listByAccount.execute).not.toHaveBeenCalled();
    });

    it('should call listByAccount when no filters are provided', async () => {
      (useCases.listByAccount.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID);

      expect(useCases.listByAccount.execute).toHaveBeenCalledWith(TEST_IDENTITY_ID);
      expect(useCases.listByTemplate.execute).not.toHaveBeenCalled();
      expect(useCases.listByStatus.execute).not.toHaveBeenCalled();
    });

    it('should prioritize templateId over status', async () => {
      (useCases.listByTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, {
        templateId: 'tmpl_1',
        status: 'Pending' as any,
      });

      expect(useCases.listByTemplate.execute).toHaveBeenCalledWith('tmpl_1');
      expect(useCases.listByStatus.execute).not.toHaveBeenCalled();
    });

    it('should call listByAccount when filters is empty object', async () => {
      (useCases.listByAccount.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok([]));

      await controller.listInstances(TEST_IDENTITY_ID, {});

      expect(useCases.listByAccount.execute).toHaveBeenCalledWith(TEST_IDENTITY_ID);
    });
  });

  // =========================================================================
  // getInstancesByDateRange
  // =========================================================================
  describe('getInstancesByDateRange', () => {
    it('should call getByDateRange use case with all parameters', async () => {
      // NOTE: The use case returns { data: [...], total: N } but the controller
      // accesses result.data.instances which does not exist on that shape.
      // This is a pre-existing bug in the controller (should be result.data.data).
      // We test the actual behavior here.
      (useCases.getByDateRange.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ data: [FAKE_INSTANCE_DTO], total: 1 }),
      );

      await controller.getInstancesByDateRange(TEST_IDENTITY_ID, 1000, 2000);

      expect(useCases.getByDateRange.execute).toHaveBeenCalledWith(TEST_IDENTITY_ID, 1000, 2000);
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'VALIDATION_ERROR', message: 'Invalid range' });
      (useCases.getByDateRange.execute as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.getInstancesByDateRange(TEST_IDENTITY_ID, 1000, 2000);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return ok with instances from use case result', async () => {
      // The controller does: return ok(result.data.data) — so use case returns { data: [...], total }
      (useCases.getByDateRange.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ data: [FAKE_INSTANCE_DTO], total: 1 }),
      );

      const result = await controller.getInstancesByDateRange(TEST_IDENTITY_ID, 1000, 2000);

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
      const result = await controller.completeInstance('inst_1', { rating: 10 });

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('参数验证失败');
        expect(result.error.details).toBeDefined();
      }
      expect(useCases.complete.execute).not.toHaveBeenCalled();
    });

    it('should accept empty object (all fields optional)', async () => {
      (useCases.complete.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.completeInstance('inst_1', {});

      expect(useCases.complete.execute).toHaveBeenCalledWith('inst_1', {});
      expect(isOk(result)).toBe(true);
    });

    it('should call complete use case with parsed data', async () => {
      (useCases.complete.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      await controller.completeInstance('inst_1', {
        duration: 30,
        note: 'Done well',
        rating: 4,
      });

      expect(useCases.complete.execute).toHaveBeenCalledWith('inst_1', {
        duration: 30,
        note: 'Done well',
        rating: 4,
      });
    });

    it('should unwrap result.data.instance', async () => {
      (useCases.complete.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.completeInstance('inst_1', {});

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_INSTANCE_DTO);
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Instance not found' });
      (useCases.complete.execute as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.completeInstance('inst_1', {});

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should reject non-integer rating', async () => {
      const result = await controller.completeInstance('inst_1', { rating: 3.5 });

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject rating below 1', async () => {
      const result = await controller.completeInstance('inst_1', { rating: 0 });

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
    it('should accept empty object (reason is optional)', async () => {
      (useCases.skip.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.skipInstance('inst_1', {});

      expect(useCases.skip.execute).toHaveBeenCalledWith('inst_1', {});
      expect(isOk(result)).toBe(true);
    });

    it('should call skip use case with reason', async () => {
      (useCases.skip.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      await controller.skipInstance('inst_1', { reason: 'Too tired' });

      expect(useCases.skip.execute).toHaveBeenCalledWith('inst_1', { reason: 'Too tired' });
    });

    it('should unwrap result.data.instance', async () => {
      (useCases.skip.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ instance: FAKE_INSTANCE_DTO }),
      );

      const result = await controller.skipInstance('inst_1', {});

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_INSTANCE_DTO);
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Not found' });
      (useCases.skip.execute as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.skipInstance('inst_1', {});

      expect(isOk(result)).toBe(false);
    });

    it('should return VALIDATION_ERROR for invalid input type', async () => {
      // Pass a non-object to trigger Zod validation failure
      const result = await controller.skipInstance('inst_1', 'invalid');

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
      (useCases.start.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok(FAKE_INSTANCE_DTO));

      await controller.startInstance('inst_1');

      expect(useCases.start.execute).toHaveBeenCalledWith('inst_1');
    });

    it('should pass through use case result directly', async () => {
      const expectedResult = ok(FAKE_INSTANCE_DTO);
      (useCases.start.execute as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const result = await controller.startInstance('inst_1');

      expect(result).toBe(expectedResult);
    });
  });

  // =========================================================================
  // deleteInstance
  // =========================================================================
  describe('deleteInstance', () => {
    it('should call deleteInstance use case with id', async () => {
      (useCases.deleteInstance.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(undefined),
      );

      await controller.deleteInstance('inst_1');

      expect(useCases.deleteInstance.execute).toHaveBeenCalledWith('inst_1');
    });

    it('should pass through use case result directly', async () => {
      const expectedResult = ok(undefined);
      (useCases.deleteInstance.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deleteInstance('inst_1');

      expect(result).toBe(expectedResult);
    });
  });
});
