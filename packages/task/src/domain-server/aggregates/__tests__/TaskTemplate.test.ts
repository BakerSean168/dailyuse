
import { describe, it, expect } from 'vitest';
import { TaskTemplate } from '../task-template';
import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskTimeConfig, RecurrenceRule } from '../../value-objects';
import { RecurrenceFrequency } from '@dailyuse/contracts/task';

describe('TaskTemplate Factory Methods', () => {
  const mockIdentityId = IdentityId.of('identity-123');

  describe('createOneTimeTask', () => {
    it('should create a valid one-time task template', () => {
      const template = TaskTemplate.createOneTimeTask({
        identityId: mockIdentityId,
        title: 'Test One Time Task',
        description: 'Test Description',
        importance: ImportanceLevel.Important,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 86400000),
      });

      expect(template).toBeDefined();
      expect(template.title).toBe('Test One Time Task');
      expect(template.description).toBe('Test Description');
      expect(template.importance).toBe(ImportanceLevel.Important);
      expect(template.taskType).toBe('ONE_TIME');
      expect(template.startDate).toBeDefined();
      expect(template.dueDate).toBeDefined();
      expect(template.folderId).toBeNull();
    });

    it('should throw error if title is empty', () => {
      expect(() => {
        TaskTemplate.createOneTimeTask({
          identityId: mockIdentityId,
          title: '',
        });
      }).toThrow('Title is required');
    });

    it('should throw error for invalid date range', () => {
        const start = new Date(Date.now() + 86400000);
        const end = new Date(Date.now());
        expect(() => {
            TaskTemplate.createOneTimeTask({
                identityId: mockIdentityId,
                title: 'Invalid Date Range',
                startDate: start,
                dueDate: end
            });
        }).toThrow();
    });
  });

  describe('createRecurringTask', () => {
    it('should create a valid recurring task template', () => {
      const timeConfig = TaskTimeConfig.createAllDay(new Date());

      const recurrenceRule = RecurrenceRule.createDaily(1);

      const template = TaskTemplate.createRecurringTask({
        identityId: mockIdentityId,
        title: 'Test Recurring Task',
        timeConfig,
        recurrenceRule,
        importance: ImportanceLevel.Moderate,
      });

      expect(template).toBeDefined();
      expect(template.title).toBe('Test Recurring Task');
      expect(template.taskType).toBe('RECURRING');
      expect(template.timeConfig).toBeDefined();
      expect(template.recurrenceRule).toBeDefined();
      expect(template.generateAheadDays).toBe(30);
    });

    it('should throw error if identityId is missing', () => {
        const timeConfig = TaskTimeConfig.createAllDay(new Date());
        const recurrenceRule = RecurrenceRule.createDaily(1);

        expect(() => {
            // @ts-ignore
            TaskTemplate.createRecurringTask({
                title: 'No Identity',
                timeConfig,
                recurrenceRule
            });
        }).toThrow('Identity ID is required');
    });
  });
});
