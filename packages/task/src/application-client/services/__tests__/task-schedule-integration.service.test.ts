import { describe, it, expect } from 'vitest';
import {
  TaskScheduleIntegrationService,
  type TaskScheduleConfig,
} from '../task-schedule-integration.service';

describe('TaskScheduleIntegrationService', () => {
  describe('validateScheduleConfig', () => {
    it('should validate valid config', () => {
      const config: TaskScheduleConfig = {
        enabled: true,
        remindersBefore: [5, 30],
        allowSnooze: true,
        snoozeOptions: [5, 10, 30],
        priority: 'MEDIUM',
        alertMethods: ['POPUP', 'SYSTEM_NOTIFICATION'],
      };

      const result = TaskScheduleIntegrationService.validateScheduleConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject config with no remindersBefore', () => {
      const config: TaskScheduleConfig = {
        enabled: true,
        remindersBefore: [],
        allowSnooze: true,
        snoozeOptions: [5, 10, 30],
        priority: 'MEDIUM',
        alertMethods: ['POPUP', 'SYSTEM_NOTIFICATION'],
      };

      const result = TaskScheduleIntegrationService.validateScheduleConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('至少需要设置一个提醒时间');
    });

    it('should reject config with negative remindersBefore', () => {
      const config: TaskScheduleConfig = {
        enabled: true,
        remindersBefore: [-5, 30],
        allowSnooze: true,
        snoozeOptions: [5, 10, 30],
        priority: 'MEDIUM',
        alertMethods: ['POPUP', 'SYSTEM_NOTIFICATION'],
      };

      const result = TaskScheduleIntegrationService.validateScheduleConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('不能为负数'))).toBe(true);
    });

    it('should reject config with no alertMethods', () => {
      const config: TaskScheduleConfig = {
        enabled: true,
        remindersBefore: [5, 30],
        allowSnooze: true,
        snoozeOptions: [5, 10, 30],
        priority: 'MEDIUM',
        alertMethods: [],
      };

      const result = TaskScheduleIntegrationService.validateScheduleConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('至少需要选择一种提醒方式'))).toBe(true);
    });

    it('should reject config with snooze enabled but no options', () => {
      const config: TaskScheduleConfig = {
        enabled: true,
        remindersBefore: [5, 30],
        allowSnooze: true,
        snoozeOptions: [],
        priority: 'MEDIUM',
        alertMethods: ['POPUP', 'SYSTEM_NOTIFICATION'],
      };

      const result = TaskScheduleIntegrationService.validateScheduleConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('启用推迟功能时必须提供推迟选项'))).toBe(true);
    });
  });

  describe('createDefaultScheduleConfig', () => {
    it('should create a valid default config', () => {
      const config = TaskScheduleIntegrationService.createDefaultScheduleConfig();
      const validation = TaskScheduleIntegrationService.validateScheduleConfig(config);
      expect(validation.isValid).toBe(true);
    });

    it('should have expected default values', () => {
      const config = TaskScheduleIntegrationService.createDefaultScheduleConfig();
      expect(config.enabled).toBe(true);
      expect(config.remindersBefore).toEqual([5, 30]);
      expect(config.allowSnooze).toBe(true);
      expect(config.priority).toBe('MEDIUM');
    });
  });

  describe('mapPriority', () => {
    it('should map LOW to LOW', () => {
      const result = TaskScheduleIntegrationService.mapPriority('LOW');
      expect(result).toBe('LOW');
    });

    it('should map MEDIUM to NORMAL', () => {
      const result = TaskScheduleIntegrationService.mapPriority('MEDIUM');
      expect(result).toBe('NORMAL');
    });

    it('should map HIGH to HIGH', () => {
      const result = TaskScheduleIntegrationService.mapPriority('HIGH');
      expect(result).toBe('HIGH');
    });

    it('should default to NORMAL for unknown priority', () => {
      const result = TaskScheduleIntegrationService.mapPriority('UNKNOWN');
      expect(result).toBe('NORMAL');
    });
  });
});
