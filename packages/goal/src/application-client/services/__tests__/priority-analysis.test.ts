/**
 * Priority Analysis Service - Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PriorityAnalysisService } from '../priority-analysis';
import type { PriorityScore } from '../priority-analysis';

describe('PriorityAnalysisService', () => {
  let service: PriorityAnalysisService;

  beforeEach(() => {
    service = PriorityAnalysisService.getInstance();
    service.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = PriorityAnalysisService.getInstance();
      const instance2 = PriorityAnalysisService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('analyzePriority - Basic Functionality', () => {
    it('should analyze priority for basic task', async () => {
      const result = await service.analyzePriority({
        taskId: 'task-1',
        taskTitle: 'Complete project',
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('factors');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should analyze priority with vital importance and goal', async () => {
      const result = await service.analyzePriority({
        taskId: 'task-2',
        taskTitle: 'Important goal task',
        importance: 'vital',
        urgency: 'high',
        goalId: 'goal-1',
        estimatedMinutes: 15,
      });

      // Verify all components are set
      expect(result.score).toBeGreaterThan(0);
      expect(result.level).toBeTruthy();
      expect(result.factors.importance).toBeGreaterThan(5);
    });

    it('should set level to low for low score', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);

      const result = await service.analyzePriority({
        taskId: 'task-3',
        taskTitle: 'Low priority task',
        deadline: future,
        importance: 'trivial',
        urgency: 'none',
      });

      expect(result.level).toBe('low');
    });
  });

  describe('analyzePriority - Urgency Calculation', () => {
    it('should increase urgency for tasks with deadline today', async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const result = await service.analyzePriority({
        taskId: 'task-4',
        taskTitle: 'Today deadline',
        deadline: today,
      });

      expect(result.factors.urgency).toBeGreaterThan(5);
    });

    it('should increase urgency for overdue tasks', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = await service.analyzePriority({
        taskId: 'task-5',
        taskTitle: 'Overdue task',
        deadline: yesterday,
      });

      expect(result.factors.urgency).toBe(10);
    });

    it('should have low urgency for far future deadline', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 60);

      const result = await service.analyzePriority({
        taskId: 'task-6',
        taskTitle: 'Far future task',
        deadline: future,
      });

      // With 60 days, no urgency bonus applies, so should be default 5
      expect(result.factors.urgency).toBeLessThanOrEqual(5);
    });
  });

  describe('analyzePriority - Importance Calculation', () => {
    it('should increase importance with vital marker', async () => {
      const result1 = await service.analyzePriority({
        taskId: 'task-7',
        taskTitle: 'Vital task',
        importance: 'vital',
      });

      const result2 = await service.analyzePriority({
        taskId: 'task-8',
        taskTitle: 'Trivial task',
        importance: 'trivial',
      });

      expect(result1.factors.importance).toBeGreaterThan(
        result2.factors.importance
      );
    });

    it('should increase importance with goal association', async () => {
      const resultWithGoal = await service.analyzePriority({
        taskId: 'task-9',
        taskTitle: 'Task with goal',
        goalId: 'goal-1',
        importance: 'moderate',
      });

      const resultWithoutGoal = await service.analyzePriority({
        taskId: 'task-10',
        taskTitle: 'Task without goal',
        importance: 'moderate',
      });

      expect(resultWithGoal.factors.importance).toBeGreaterThan(
        resultWithoutGoal.factors.importance
      );
    });
  });

  describe('analyzePriority - Effort Calculation', () => {
    it('should favor quick tasks (low effort)', async () => {
      const quickTask = await service.analyzePriority({
        taskId: 'task-11',
        taskTitle: 'Quick task',
        estimatedMinutes: 15,
        urgency: 'medium',
        importance: 'moderate',
      });

      const slowTask = await service.analyzePriority({
        taskId: 'task-12',
        taskTitle: 'Slow task',
        estimatedMinutes: 480,
        urgency: 'medium',
        importance: 'moderate',
      });

      // Same urgency and importance, low effort task should have >= score
      expect(quickTask.score).toBeGreaterThanOrEqual(slowTask.score);
    });
  });

  describe('Eisenhower Matrix Classification', () => {
    it('should classify urgent-important task', async () => {
      const today = new Date();
      const result = await service.analyzePriority({
        taskId: 'task-13',
        taskTitle: 'Urgent Important',
        deadline: today,
        importance: 'vital',
      });

      expect(result.eisenhowerQuadrant).toBe('urgent-important');
    });

    it('should classify not-urgent-important task', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);

      const result = await service.analyzePriority({
        taskId: 'task-14',
        taskTitle: 'Not Urgent Important',
        deadline: future,
        importance: 'vital',
        urgency: 'none', // Explicitly set to none for low urgency
      });

      expect(result.eisenhowerQuadrant).toBe('not-urgent-important');
    });

    it('should classify urgent-not-important task', async () => {
      const today = new Date();
      const result = await service.analyzePriority({
        taskId: 'task-15',
        taskTitle: 'Urgent Not Important',
        deadline: today,
        importance: 'trivial',
      });

      expect(result.eisenhowerQuadrant).toBe('urgent-not-important');
    });

    it('should classify not-urgent-not-important task', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);

      const result = await service.analyzePriority({
        taskId: 'task-16',
        taskTitle: 'Not Urgent Not Important',
        deadline: future,
        importance: 'trivial',
        urgency: 'none', // Explicitly set to none for low urgency
      });

      expect(result.eisenhowerQuadrant).toBe('not-urgent-not-important');
    });
  });

  describe('batchAnalyzePriority', () => {
    it('should analyze multiple tasks', async () => {
      const requests = [
        { taskId: 'task-17', taskTitle: 'Task 1', importance: 'vital' as const },
        { taskId: 'task-18', taskTitle: 'Task 2', importance: 'moderate' as const },
        { taskId: 'task-19', taskTitle: 'Task 3', importance: 'trivial' as const },
      ];

      const result = await service.batchAnalyzePriority(requests);

      expect(result.tasks).toHaveLength(3);
      expect(result.totalTasks).toBe(3);
    });

    it('should calculate statistics correctly', async () => {
      const today = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 30);

      const requests = [
        {
          taskId: 'task-20',
          taskTitle: 'Critical',
          deadline: today,
          importance: 'vital' as const,
        },
        {
          taskId: 'task-21',
          taskTitle: 'High',
          deadline: today,
          importance: 'important' as const,
        },
        {
          taskId: 'task-22',
          taskTitle: 'Low',
          deadline: future,
          importance: 'trivial' as const,
        },
      ];

      const result = await service.batchAnalyzePriority(requests);

      expect(result.criticalCount + result.highCount + result.mediumCount + result.lowCount).toBe(
        3
      );
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.averageScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Caching', () => {
    it('should cache results', async () => {
      const request = {
        taskId: 'task-23',
        taskTitle: 'Cached task',
      };

      const result1 = await service.analyzePriority(request);
      const result2 = await service.analyzePriority(request);

      expect(result1.score).toBe(result2.score);
    });

    it('should clear specific cache entry', async () => {
      const request = {
        taskId: 'task-24',
        taskTitle: 'Cache clear task',
      };

      await service.analyzePriority(request);
      service.clearCache('priority-task-24');

      // Should still work but cache is cleared
      const result = await service.analyzePriority(request);
      expect(result).toBeDefined();
    });

    it('should clear all cache', async () => {
      await service.analyzePriority({
        taskId: 'task-25',
        taskTitle: 'Task 1',
      });

      service.clearCache();

      // Cache is cleared but service still works
      const result = await service.analyzePriority({
        taskId: 'task-25',
        taskTitle: 'Task 1',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Cache Expiry', () => {
    it('should allow setting cache expiry', () => {
      service.setCacheExpiry(60);
      // Cache expiry is now 60 minutes
      expect(() => service.setCacheExpiry(60)).not.toThrow();
    });
  });

  describe('Reasoning Generation', () => {
    it('should generate reasonable explanation', async () => {
      const result = await service.analyzePriority({
        taskId: 'task-26',
        taskTitle: 'Task with reasoning',
        deadline: new Date(),
        importance: 'vital',
      });

      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should generate recommendation text for all tasks', async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const result = await service.analyzePriority({
        taskId: 'task-27',
        taskTitle: 'Task with deadline',
        deadline: today,
        importance: 'vital',
        urgency: 'critical',
        estimatedMinutes: 15,
      });

      // All tasks should have recommendations
      expect(result.recommendation).toBeTruthy();
      expect(result.recommendation.length).toBeGreaterThan(0);
      expect(typeof result.recommendation).toBe('string');
    });

    it('should generate appropriate recommendation for low priority task', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);

      const result = await service.analyzePriority({
        taskId: 'task-28',
        taskTitle: 'Low priority task',
        deadline: future,
        importance: 'trivial',
      });

      expect(result.recommendation).not.toContain('立即开始');
    });
  });

  describe('Dependencies Handling', () => {
    it('should consider dependency count', async () => {
      const withDeps = await service.analyzePriority({
        taskId: 'task-29',
        taskTitle: 'Task with dependencies',
        dependencyCount: 5,
      });

      const withoutDeps = await service.analyzePriority({
        taskId: 'task-30',
        taskTitle: 'Task without dependencies',
        dependencyCount: 0,
      });

      expect(withDeps.factors.dependencies).toBeGreaterThan(
        withoutDeps.factors.dependencies
      );
    });
  });

  describe('Impact Calculation', () => {
    it('should consider related tasks count', async () => {
      const manyRelated = await service.analyzePriority({
        taskId: 'task-31',
        taskTitle: 'Task with many related',
        relatedTasksCount: 10,
      });

      const fewRelated = await service.analyzePriority({
        taskId: 'task-32',
        taskTitle: 'Task with few related',
        relatedTasksCount: 1,
      });

      expect(manyRelated.factors.impact).toBeGreaterThan(fewRelated.factors.impact);
    });
  });
});
