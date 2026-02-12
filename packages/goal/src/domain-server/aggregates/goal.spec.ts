/**
 * Goal Aggregate Domain Tests
 *
 * Tests for T018 (calculateProgress weighted average) and T019 (weight validation).
 * Critical Path Testing: complex domain logic requires high test coverage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Goal } from '../aggregates/goal';
import type { KeyResult } from '../entities/key-result';

// ============================================================
// Helper: Create a Goal with key results for testing
// ============================================================

/**
 * Creates a test goal with optional key results.
 * Uses Goal.create() factory and createAndAddKeyResult() to build the aggregate.
 */
function createTestGoal(opts?: { name?: string }): Goal {
  return Goal.create({
    identityId: 'test-identity-id' as any,
    name: opts?.name ?? 'Test Goal',
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

function addKeyResult(
  goal: Goal,
  params: {
    title: string;
    targetValue: number;
    currentValue?: number;
    weight: number;
  },
): KeyResult {
  return goal.createAndAddKeyResult({
    title: params.title,
    valueType: 'NUMERIC',
    targetValue: params.targetValue,
    currentValue: params.currentValue ?? 0,
    weight: params.weight,
  });
}

// ============================================================
// T018: Goal.calculateProgress() Tests
// ============================================================

describe('Goal.calculateProgress()', () => {
  let goal: Goal;

  beforeEach(() => {
    goal = createTestGoal();
  });

  it('should return 0 when there are no key results', () => {
    expect(goal.calculateProgress()).toBe(0);
  });

  it('should calculate simple weighted average with equal weights', () => {
    // KR1: 50% complete, weight 50
    // KR2: 100% complete, weight 50
    // Expected: (50 * 50 + 100 * 50) / 100 = 75
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 50, weight: 50 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 100, weight: 50 });

    expect(goal.calculateProgress()).toBe(75);
  });

  it('should calculate weighted average with unequal weights', () => {
    // KR1: 50% complete, weight 30
    // KR2: 100% complete, weight 70
    // Expected: (50 * 30 + 100 * 70) / 100 = (1500 + 7000) / 100 = 85
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 50, weight: 30 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 100, weight: 70 });

    expect(goal.calculateProgress()).toBe(85);
  });

  it('should return 0 when all key results have 0 progress', () => {
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 0, weight: 50 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 0, weight: 50 });

    expect(goal.calculateProgress()).toBe(0);
  });

  it('should return 100 when all key results are 100% complete', () => {
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 100, weight: 50 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 100, weight: 50 });

    expect(goal.calculateProgress()).toBe(100);
  });

  it('should handle a single key result correctly', () => {
    addKeyResult(goal, { title: 'KR1', targetValue: 200, currentValue: 100, weight: 100 });
    // 100/200 = 50%
    expect(goal.calculateProgress()).toBe(50);
  });

  it('should handle key results with different target values', () => {
    // KR1: 50/100 = 50%, weight 40
    // KR2: 75/150 = 50%, weight 60
    // Expected: (50 * 40 + 50 * 60) / 100 = 50
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 50, weight: 40 });
    addKeyResult(goal, { title: 'KR2', targetValue: 150, currentValue: 75, weight: 60 });

    expect(goal.calculateProgress()).toBe(50);
  });

  it('should round to 2 decimal places', () => {
    // KR1: 33/100 = 33%, weight 33
    // KR2: 66/100 = 66%, weight 33
    // KR3: 99/100 = 99%, weight 34
    // Expected: (33*33 + 66*33 + 99*34) / 100 = (1089 + 2178 + 3366) / 100 = 66.33
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 33, weight: 33 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 66, weight: 33 });
    addKeyResult(goal, { title: 'KR3', targetValue: 100, currentValue: 99, weight: 34 });

    const progress = goal.calculateProgress();
    expect(progress).toBe(66.33);
  });

  it('should use simple average when all weights are 0', () => {
    // When totalWeight is 0, falls back to simple average
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 40, weight: 0 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 80, weight: 0 });

    // Simple average: (40 + 80) / 2 = 60
    expect(goal.calculateProgress()).toBe(60);
  });

  it('should update progress when key result progress changes', () => {
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 0, weight: 50 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 0, weight: 50 });

    expect(goal.calculateProgress()).toBe(0);

    // Update KR1 progress to 80
    const kr1 = goal.keyResults[0];
    goal.updateKeyResultProgress(kr1.id as unknown as string, 80);

    // (80*50 + 0*50) / 100 = 40
    expect(goal.calculateProgress()).toBe(40);
  });

  it('should clamp individual key result percentage to 0-100', () => {
    // If currentValue exceeds targetValue, percentage should be capped at 100
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 150, weight: 50 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 50, weight: 50 });

    // KR1 capped at 100%, KR2 at 50%
    // (100*50 + 50*50) / 100 = 75
    expect(goal.calculateProgress()).toBe(75);
  });
});

// ============================================================
// T018: getProgressBreakdown() Tests
// ============================================================

describe('Goal.getProgressBreakdown()', () => {
  it('should return breakdown with calculation mode "weighted_average"', () => {
    const goal = createTestGoal();
    addKeyResult(goal, { title: 'KR1', targetValue: 100, currentValue: 50, weight: 60 });
    addKeyResult(goal, { title: 'KR2', targetValue: 100, currentValue: 100, weight: 40 });

    const breakdown = goal.getProgressBreakdown();

    expect(breakdown.calculationMode).toBe('weighted_average');
    expect(breakdown.totalProgress).toBe(70); // (50*60 + 100*40) / 100 = 70
    expect(breakdown.krContributions).toHaveLength(2);
    expect(breakdown.krContributions[0].keyResultName).toBe('KR1');
    expect(breakdown.krContributions[0].weight).toBe(60);
    expect(breakdown.krContributions[1].keyResultName).toBe('KR2');
    expect(breakdown.krContributions[1].weight).toBe(40);
  });
});

// ============================================================
// T019: Weight Validation Tests
// ============================================================

describe('Goal weight validation', () => {
  let goal: Goal;

  beforeEach(() => {
    goal = createTestGoal();
  });

  describe('validateKeyResultWeight()', () => {
    it('should accept weight of 0', () => {
      expect(() => Goal.validateKeyResultWeight(0)).not.toThrow();
    });

    it('should accept weight of 100', () => {
      expect(() => Goal.validateKeyResultWeight(100)).not.toThrow();
    });

    it('should accept weight of 50', () => {
      expect(() => Goal.validateKeyResultWeight(50)).not.toThrow();
    });

    it('should reject negative weight', () => {
      expect(() => Goal.validateKeyResultWeight(-1)).toThrow();
    });

    it('should reject weight exceeding 100', () => {
      expect(() => Goal.validateKeyResultWeight(101)).toThrow();
    });
  });

  describe('total weight validation in createAndAddKeyResult', () => {
    it('should allow adding key results when total weight <= 100', () => {
      expect(() => {
        addKeyResult(goal, { title: 'KR1', targetValue: 100, weight: 50 });
        addKeyResult(goal, { title: 'KR2', targetValue: 100, weight: 50 });
      }).not.toThrow();
    });

    it('should reject adding key result when total weight would exceed 100', () => {
      addKeyResult(goal, { title: 'KR1', targetValue: 100, weight: 60 });

      expect(() => {
        addKeyResult(goal, { title: 'KR2', targetValue: 100, weight: 50 });
      }).toThrow(); // 60 + 50 = 110 > 100
    });

    it('should allow adding key result up to exactly 100 total', () => {
      addKeyResult(goal, { title: 'KR1', targetValue: 100, weight: 60 });

      expect(() => {
        addKeyResult(goal, { title: 'KR2', targetValue: 100, weight: 40 });
      }).not.toThrow(); // 60 + 40 = 100, exactly at limit
    });
  });

  describe('key result weight getter', () => {
    it('should return the assigned weight for each key result', () => {
      addKeyResult(goal, { title: 'KR1', targetValue: 100, weight: 30 });
      addKeyResult(goal, { title: 'KR2', targetValue: 100, weight: 70 });

      expect(goal.keyResults[0].weight).toBe(30);
      expect(goal.keyResults[1].weight).toBe(70);
    });
  });
});

// ============================================================
// Goal Lifecycle Tests (Archive/Activate guard)
// ============================================================

describe('Goal lifecycle guards', () => {
  it('should not allow modifying an archived goal', () => {
    const goal = createTestGoal();
    goal.archive();

    expect(() => {
      addKeyResult(goal, { title: 'KR1', targetValue: 100, weight: 50 });
    }).toThrow();
  });

  it('should allow modifying after activating an archived goal', () => {
    const goal = createTestGoal();
    goal.archive();
    goal.activate();

    expect(() => {
      addKeyResult(goal, { title: 'KR1', targetValue: 100, weight: 50 });
    }).not.toThrow();
  });
});
