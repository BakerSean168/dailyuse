import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, fail, isOk } from '@dailyuse/contracts/result';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import { TaskTemplateController, type TaskTemplateUseCases } from '../task-template.controller';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUseCases(): TaskTemplateUseCases {
  return {
    createTemplate: { execute: vi.fn() },
    getTemplate: { execute: vi.fn() },
    listTemplates: { execute: vi.fn() },
    updateTemplate: { execute: vi.fn() },
    deleteTemplate: { execute: vi.fn() },
    activateTemplate: { execute: vi.fn() },
    pauseTemplate: { execute: vi.fn() },
    archiveTemplate: { execute: vi.fn() },
  } as unknown as TaskTemplateUseCases;
}

const FAKE_TEMPLATE_DTO: TaskTemplateClientDTO = {
  id: 'tmpl_abc123',
  name: 'Test Template',
  taskType: TaskType.Recurring,
  status: 'Active',
  importance: 'Moderate',
  tags: [],
  createdAt: 1000,
  updatedAt: 1000,
} as unknown as TaskTemplateClientDTO;

const VALID_CREATE_INPUT = {
  name: 'My Task',
  taskType: TaskType.OneTime,
  timeConfig: { timeType: 'AllDay', startDate: null, timePoint: null },
  importance: 'Moderate',
};

const VALID_UPDATE_INPUT = {
  name: 'Updated Name',
};

const TEST_IDENTITY_ID = anIdentityId();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskTemplateController', () => {
  let useCases: TaskTemplateUseCases;
  let controller: TaskTemplateController;

  beforeEach(() => {
    useCases = createMockUseCases();
    controller = new TaskTemplateController(useCases);
  });

  // =========================================================================
  // createTemplate
  // =========================================================================
  describe('createTemplate', () => {
    it('should return VALIDATION_ERROR when input is invalid', async () => {
      const result = await controller.createTemplate({}, TEST_IDENTITY_ID);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('参数验证失败');
        expect(result.error.details).toBeDefined();
        expect(result.error.details!.length).toBeGreaterThan(0);
      }
      // Use case should NOT have been called
      expect(useCases.createTemplate.execute).not.toHaveBeenCalled();
    });

    it('should call createTemplate use case with parsed data', async () => {
      (useCases.createTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ template: FAKE_TEMPLATE_DTO, instanceCount: 0 }),
      );

      const result = await controller.createTemplate(VALID_CREATE_INPUT, TEST_IDENTITY_ID);

      expect(useCases.createTemplate.execute).toHaveBeenCalledOnce();
      const args = (useCases.createTemplate.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(args.identityId).toBe(TEST_IDENTITY_ID);
      expect(args.name).toBe('My Task');
      expect(args.taskType).toBe(TaskType.OneTime);
      expect(args.importance).toBe('Moderate');
    });

    it('should unwrap ok result to return template DTO', async () => {
      (useCases.createTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ template: FAKE_TEMPLATE_DTO, instanceCount: 5 }),
      );

      const result = await controller.createTemplate(VALID_CREATE_INPUT, TEST_IDENTITY_ID);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_TEMPLATE_DTO);
      }
    });

    it('should forward use case failure without modification', async () => {
      const useCaseError = fail({
        code: 'VALIDATION_ERROR',
        message: 'Name too long',
      });
      (useCases.createTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.createTemplate(VALID_CREATE_INPUT, TEST_IDENTITY_ID);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Name too long');
      }
    });

    it('should reject missing name field', async () => {
      const result = await controller.createTemplate(
        { taskType: TaskType.OneTime, timeConfig: { timeType: 'AllDay' }, importance: 'Moderate' },
        TEST_IDENTITY_ID,
      );
      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject empty name string', async () => {
      const result = await controller.createTemplate(
        { ...VALID_CREATE_INPUT, name: '' },
        TEST_IDENTITY_ID,
      );
      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // =========================================================================
  // getTemplate
  // =========================================================================
  describe('getTemplate', () => {
    it('should call getTemplate use case with id and default includeChildren=false', async () => {
      (useCases.getTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_TEMPLATE_DTO),
      );

      await controller.getTemplate('tmpl_abc123');

      expect(useCases.getTemplate.execute).toHaveBeenCalledWith('tmpl_abc123', false);
    });

    it('should call getTemplate use case with includeChildren=true', async () => {
      (useCases.getTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_TEMPLATE_DTO),
      );

      await controller.getTemplate('tmpl_abc123', true);

      expect(useCases.getTemplate.execute).toHaveBeenCalledWith('tmpl_abc123', true);
    });

    it('should pass through use case result data directly', async () => {
      // GetTaskTemplate use case returns ok(DTO | null) — NOT wrapped in { template: ... }
      (useCases.getTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_TEMPLATE_DTO),
      );

      const result = await controller.getTemplate('tmpl_abc123');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_TEMPLATE_DTO);
      }
    });

    it('should return null when template not found', async () => {
      // GetTaskTemplate use case returns ok(null) when not found
      (useCases.getTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));

      const result = await controller.getTemplate('tmpl_nonexistent');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBeNull();
      }
    });
  });

  // =========================================================================
  // listTemplates
  // =========================================================================
  describe('listTemplates', () => {
    it('should call listTemplates use case with identityId', async () => {
      (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ templates: [], total: 0 }),
      );

      await controller.listTemplates(TEST_IDENTITY_ID);

      expect(useCases.listTemplates.execute).toHaveBeenCalledOnce();
      const args = (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(args.identityId).toBe(TEST_IDENTITY_ID);
    });

    it('should wrap single status into array', async () => {
      (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ templates: [], total: 0 }),
      );

      await controller.listTemplates(TEST_IDENTITY_ID, { status: 'Active' as any });

      const args = (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(args.status).toEqual(['Active']);
    });

    it('should pass through folderId, goalId, tags filters', async () => {
      (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ templates: [], total: 0 }),
      );

      await controller.listTemplates(TEST_IDENTITY_ID, {
        folderId: 'folder-1',
        goalId: 'goal-1',
        tags: ['tag1', 'tag2'],
      });

      const args = (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(args.folderId).toBe('folder-1');
      expect(args.goalId).toBe('goal-1');
      expect(args.tags).toEqual(['tag1', 'tag2']);
    });

    it('should return templates and total', async () => {
      const templates = [FAKE_TEMPLATE_DTO];
      (useCases.listTemplates.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ templates, total: 1 }),
      );

      const result = await controller.listTemplates(TEST_IDENTITY_ID);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual({ templates, total: 1 });
      }
    });
  });

  // =========================================================================
  // updateTemplate
  // =========================================================================
  describe('updateTemplate', () => {
    it('should return VALIDATION_ERROR for invalid input', async () => {
      // name must be min(1) if provided
      const result = await controller.updateTemplate('tmpl_1', { name: '' });

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(useCases.updateTemplate.execute).not.toHaveBeenCalled();
    });

    it('should call updateTemplate use case with id and parsed data', async () => {
      (useCases.updateTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_TEMPLATE_DTO),
      );

      await controller.updateTemplate('tmpl_1', VALID_UPDATE_INPUT);

      expect(useCases.updateTemplate.execute).toHaveBeenCalledWith('tmpl_1', {
        name: 'Updated Name',
        description: undefined,
        recurrenceRule: undefined,
        importance: undefined,
        folderId: undefined,
        tags: undefined,
        color: undefined,
      });
    });

    it('should return use case result directly (no unwrap)', async () => {
      const expectedResult = ok(FAKE_TEMPLATE_DTO);
      (useCases.updateTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.updateTemplate('tmpl_1', VALID_UPDATE_INPUT);

      expect(result).toBe(expectedResult);
    });

    it('should accept empty object (all fields optional)', async () => {
      (useCases.updateTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_TEMPLATE_DTO),
      );

      const result = await controller.updateTemplate('tmpl_1', {});

      expect(isOk(result)).toBe(true);
      expect(useCases.updateTemplate.execute).toHaveBeenCalledOnce();
    });
  });

  // =========================================================================
  // deleteTemplate
  // =========================================================================
  describe('deleteTemplate', () => {
    it('should call deleteTemplate use case with id', async () => {
      (useCases.deleteTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(undefined),
      );

      await controller.deleteTemplate('tmpl_1');

      expect(useCases.deleteTemplate.execute).toHaveBeenCalledWith('tmpl_1');
    });

    it('should pass through use case result', async () => {
      const expectedResult = ok(undefined);
      (useCases.deleteTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deleteTemplate('tmpl_1');

      expect(result).toEqual(expectedResult);
    });
  });

  // =========================================================================
  // activateTemplate
  // =========================================================================
  describe('activateTemplate', () => {
    it('should call activateTemplate use case with id', async () => {
      (useCases.activateTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ template: FAKE_TEMPLATE_DTO, instancesGenerated: 10 }),
      );

      await controller.activateTemplate('tmpl_1');

      expect(useCases.activateTemplate.execute).toHaveBeenCalledWith('tmpl_1');
    });

    it('should unwrap result.data.template', async () => {
      (useCases.activateTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ template: FAKE_TEMPLATE_DTO, instancesGenerated: 10 }),
      );

      const result = await controller.activateTemplate('tmpl_1');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_TEMPLATE_DTO);
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Template not found' });
      (useCases.activateTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        useCaseError,
      );

      const result = await controller.activateTemplate('tmpl_1');

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  // =========================================================================
  // pauseTemplate
  // =========================================================================
  describe('pauseTemplate', () => {
    it('should call pauseTemplate use case with id', async () => {
      (useCases.pauseTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ template: FAKE_TEMPLATE_DTO, instancesSkipped: 3 }),
      );

      await controller.pauseTemplate('tmpl_1');

      expect(useCases.pauseTemplate.execute).toHaveBeenCalledWith('tmpl_1');
    });

    it('should unwrap result.data.template', async () => {
      (useCases.pauseTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ template: FAKE_TEMPLATE_DTO, instancesSkipped: 3 }),
      );

      const result = await controller.pauseTemplate('tmpl_1');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(FAKE_TEMPLATE_DTO);
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Not found' });
      (useCases.pauseTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.pauseTemplate('tmpl_1');

      expect(isOk(result)).toBe(false);
    });
  });

  // =========================================================================
  // archiveTemplate
  // =========================================================================
  describe('archiveTemplate', () => {
    it('should call archiveTemplate use case with id', async () => {
      (useCases.archiveTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok(FAKE_TEMPLATE_DTO),
      );

      await controller.archiveTemplate('tmpl_1');

      expect(useCases.archiveTemplate.execute).toHaveBeenCalledWith('tmpl_1');
    });

    it('should pass through use case result directly (no unwrap)', async () => {
      const expectedResult = ok(FAKE_TEMPLATE_DTO);
      (useCases.archiveTemplate.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.archiveTemplate('tmpl_1');

      // archiveTemplate passes through directly (no .data.template unwrap)
      expect(result).toBe(expectedResult);
    });
  });
});
