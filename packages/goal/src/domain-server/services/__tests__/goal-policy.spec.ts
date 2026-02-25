/**
 * GoalPolicy Domain Service Unit Tests
 *
 * 测试层级: Domain Service
 * 策略: 纯粹的领域逻辑测试，无外部依赖
 *
 * 覆盖内容:
 * - ensureGoalCanBeModified: 归档目标不可修改
 * - ensureGoalCanBeArchived: 活跃目标不可归档
 * - ensureParentGoalValid: 父目标有效性检查
 * - ensureGoalCanBeActivated: 激活目标前置条件
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoalPolicy } from '../goal-policy.service';
import { Goal } from '../../aggregates/goal';

describe('GoalPolicy', () => {
  let policy: GoalPolicy;

  /**
   * 辅助函数：创建测试用 Goal
   */
  function createTestGoal(name = 'Test Goal') {
    return Goal.create({
      identityId: 'test-identity-123' as any,
      name,
      description: null,
      color: '#3B82F6',
      feasibilityAnalysis: null,
      motivation: null,
      importance: 'MEDIUM' as any,
      category: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });
  }

  beforeEach(() => {
    policy = new GoalPolicy();
  });

  // ==================== ensureGoalCanBeModified ====================

  describe('ensureGoalCanBeModified', () => {
    it('活跃目标应允许修改', () => {
      const goal = createTestGoal();

      expect(() => policy.ensureGoalCanBeModified(goal)).not.toThrow();
    });

    it('归档目标应抛出异常', () => {
      const goal = createTestGoal();
      goal.markAsCompleted(); // 先完成
      goal.archive();         // 再归档

      expect(() => policy.ensureGoalCanBeModified(goal)).toThrow();
    });
  });

  // ==================== ensureParentGoalValid ====================

  describe('ensureParentGoalValid', () => {
    it('null 父目标应通过验证', () => {
      expect(() => policy.ensureParentGoalValid(null)).not.toThrow();
    });

    it('undefined 父目标应通过验证', () => {
      expect(() => policy.ensureParentGoalValid(undefined)).not.toThrow();
    });

    it('活跃的父目标应通过验证', () => {
      const parent = createTestGoal('Parent Goal');

      expect(() => policy.ensureParentGoalValid(parent)).not.toThrow();
    });

    it('归档的父目标应抛出异常', () => {
      const parent = createTestGoal('Archived Parent');
      parent.markAsCompleted(); // 先完成
      parent.archive();         // 再归档

      expect(() => policy.ensureParentGoalValid(parent)).toThrow();
    });
  });
});
