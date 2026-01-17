/**
 * Unit Tests for TaskQueryValidator
 * Story 2.5: 支持排序参数和过滤选项 - 后端扩展
 */

import { describe, it, expect } from 'vitest';
import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts/task';
import { TaskQueryValidator } from '../services/task-query.validator';

describe('TaskQueryValidator', () => {
  describe('validateSortBy', () => {
    it('should validate valid sortBy values', () => {
      expect(() => TaskQueryValidator.validateSortBy('priority')).not.toThrow();
      expect(() => TaskQueryValidator.validateSortBy('dueDate')).not.toThrow();
      expect(() => TaskQueryValidator.validateSortBy('createdAt')).not.toThrow();
      expect(() => TaskQueryValidator.validateSortBy('importance')).not.toThrow();
    });

    it('should return correct sortBy enum value', () => {
      expect(TaskQueryValidator.validateSortBy('priority')).toBe(TaskSortBy.PRIORITY);
      expect(TaskQueryValidator.validateSortBy('dueDate')).toBe(TaskSortBy.DUE_DATE);
      expect(TaskQueryValidator.validateSortBy('createdAt')).toBe(TaskSortBy.CREATED_AT);
      expect(TaskQueryValidator.validateSortBy('importance')).toBe(TaskSortBy.IMPORTANCE);
    });

    it('should throw on invalid sortBy value', () => {
      expect(() => TaskQueryValidator.validateSortBy('invalid')).toThrow(
        'Invalid sortBy value: "invalid"'
      );
      expect(() => TaskQueryValidator.validateSortBy('unknown')).toThrow();
      expect(() => TaskQueryValidator.validateSortBy('dateCreated')).toThrow();
    });

    it('should return null for undefined or empty sortBy', () => {
      expect(TaskQueryValidator.validateSortBy()).toBeNull();
      expect(TaskQueryValidator.validateSortBy('')).toBeNull();
    });
  });

  describe('validateFilterBy', () => {
    it('should validate valid filterBy values', () => {
      expect(() => TaskQueryValidator.validateFilterBy('importance:vital')).not.toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('status:active')).not.toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('dueDate:overdue')).not.toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('importance:important')).not.toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('importance:moderate')).not.toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('importance:minor')).not.toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('importance:trivial')).not.toThrow();
    });

    it('should return correct filterBy array', () => {
      const result = TaskQueryValidator.validateFilterBy('importance:vital');
      expect(result).toEqual([TaskFilterBy.IMPORTANCE_VITAL]);
    });

    it('should validate array of filterBy values', () => {
      expect(() =>
        TaskQueryValidator.validateFilterBy(['importance:vital', 'status:active'])
      ).not.toThrow();
    });

    it('should return array with correct filterBy values', () => {
      const result = TaskQueryValidator.validateFilterBy([
        'importance:important',
        'status:active',
      ]);
      expect(result).toHaveLength(2);
      expect(result).toEqual([TaskFilterBy.IMPORTANCE_IMPORTANT, TaskFilterBy.STATUS_ACTIVE]);
    });

    it('should throw on invalid filterBy value', () => {
      expect(() => TaskQueryValidator.validateFilterBy('invalid:value')).toThrow(
        'Invalid filterBy value: "invalid:value"'
      );
      expect(() => TaskQueryValidator.validateFilterBy('importance:invalid')).toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('status:unknown')).toThrow();
    });

    it('should throw on any invalid value in array', () => {
      expect(() =>
        TaskQueryValidator.validateFilterBy(['importance:vital', 'invalid:value'])
      ).toThrow();
    });

    it('should return empty array for undefined or empty filterBy', () => {
      expect(TaskQueryValidator.validateFilterBy()).toEqual([]);
      expect(TaskQueryValidator.validateFilterBy([])).toEqual([]);
      expect(TaskQueryValidator.validateFilterBy('')).toEqual([]);
    });
  });

  describe('validate (combined)', () => {
    it('should validate both sortBy and filterBy together', () => {
      const result = TaskQueryValidator.validate('priority', 'importance:vital');
      expect(result.sortBy).toBe(TaskSortBy.PRIORITY);
      expect(result.filterBy).toEqual([TaskFilterBy.IMPORTANCE_VITAL]);
    });

    it('should handle null sortBy with valid filterBy', () => {
      const result = TaskQueryValidator.validate(undefined, 'status:active');
      expect(result.sortBy).toBeNull();
      expect(result.filterBy).toEqual([TaskFilterBy.STATUS_ACTIVE]);
    });

    it('should throw if sortBy is invalid', () => {
      expect(() => TaskQueryValidator.validate('invalid', 'importance:vital')).toThrow();
    });

    it('should throw if filterBy is invalid', () => {
      expect(() => TaskQueryValidator.validate('priority', 'invalid:value')).toThrow();
    });

    it('should handle array of filterBy', () => {
      const result = TaskQueryValidator.validate('dueDate', [
        'importance:important',
        'status:active',
      ]);
      expect(result.sortBy).toBe(TaskSortBy.DUE_DATE);
      expect(result.filterBy).toHaveLength(2);
    });
  });

  describe('getSortByOptions', () => {
    it('should return all valid sortBy options', () => {
      const options = TaskQueryValidator.getSortByOptions();
      expect(options).toContain(TaskSortBy.PRIORITY);
      expect(options).toContain(TaskSortBy.DUE_DATE);
      expect(options).toContain(TaskSortBy.CREATED_AT);
      expect(options).toContain(TaskSortBy.IMPORTANCE);
      expect(options).toHaveLength(4);
    });
  });

  describe('getFilterByOptions', () => {
    it('should return all valid filterBy options', () => {
      const options = TaskQueryValidator.getFilterByOptions();
      
      // Importance-based
      expect(options).toContain(TaskFilterBy.IMPORTANCE_VITAL);
      expect(options).toContain(TaskFilterBy.IMPORTANCE_IMPORTANT);
      expect(options).toContain(TaskFilterBy.IMPORTANCE_MODERATE);
      expect(options).toContain(TaskFilterBy.IMPORTANCE_MINOR);
      expect(options).toContain(TaskFilterBy.IMPORTANCE_TRIVIAL);
      
      // Status-based
      expect(options).toContain(TaskFilterBy.STATUS_ACTIVE);
      expect(options).toContain(TaskFilterBy.STATUS_COMPLETED);
      expect(options).toContain(TaskFilterBy.STATUS_BLOCKED);
      expect(options).toContain(TaskFilterBy.STATUS_CANCELLED);
      
      // Time-based
      expect(options).toContain(TaskFilterBy.DUE_DATE_OVERDUE);
      expect(options).toContain(TaskFilterBy.DUE_DATE_TODAY);
      expect(options).toContain(TaskFilterBy.DUE_DATE_UPCOMING);
      expect(options).toContain(TaskFilterBy.DUE_DATE_NO_DUE_DATE);
      
      expect(options).toHaveLength(13);
    });
  });

  describe('edge cases', () => {
    it('should handle case sensitivity correctly', () => {
      // Enum values are lowercase
      expect(() => TaskQueryValidator.validateSortBy('PRIORITY')).toThrow();
      expect(() => TaskQueryValidator.validateFilterBy('IMPORTANCE:VITAL')).toThrow();
    });

    it('should handle whitespace in values', () => {
      expect(() => TaskQueryValidator.validateSortBy(' priority')).toThrow();
      expect(() => TaskQueryValidator.validateSortBy('priority ')).toThrow();
    });

    it('should handle multiple filterBy with duplicates', () => {
      const result = TaskQueryValidator.validateFilterBy([
        'importance:vital',
        'importance:vital',
        'status:active',
      ]);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(TaskFilterBy.IMPORTANCE_VITAL);
      expect(result[2]).toBe(TaskFilterBy.STATUS_ACTIVE);
    });
  });
});
