/**
 * Task Priority Calculator Service Tests
 * 任务优先级计算服务测�?
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateTaskPriority } from './priority-calculator.service';
import { PriorityCalculationError } from '../errors/priority-calculation.error';

describe('PriorityCalculator Service', () => {
  let now: Date;

  beforeEach(() => {
    now = new Date('2024-01-15T12:00:00Z');
  });

  describe('calculateTaskPriority - Basic functionality', () => {
    it('should return a number between 0 and 100', () => {
      const result = calculateTaskPriority('moderate', null, now);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should accept valid ImportanceLevel values', () => {
      const levels = ['vital', 'important', 'moderate', 'minor', 'trivial'] as const;
      
      levels.forEach((level) => {
        const result = calculateTaskPriority(level, null, now);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
      });
    });

    it('should be deterministic - same input produces same output', () => {
      const dueDate = new Date('2024-01-20T12:00:00Z');
      
      const result1 = calculateTaskPriority('important', dueDate, now);
      const result2 = calculateTaskPriority('important', dueDate, now);
      
      expect(result1).toBe(result2);
    });
  });

  describe('calculateTaskPriority - Normal tasks (with dueDate)', () => {
    it('should calculate priority for task due in 7 days', () => {
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', dueDate, now);
      
      // Important (40) + 7-30 days weight (15) = 55
      expect(result).toBeGreaterThan(40);
      expect(result).toBeLessThan(70);
    });

    it('should calculate priority for task due in 3 days', () => {
      const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', dueDate, now);
      
      // Story 1.3: Important (weight=4, 4*20*0.6=48) + Time (1/3*100*0.4~13) ≈ 61
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(75);
    });

    it('should calculate priority for task due tomorrow', () => {
      const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', dueDate, now);
      
      // Story 1.3: Important (48) + Time (1/1*100*0.4=40) ≈ 88
      expect(result).toBeGreaterThan(75);
      expect(result).toBeLessThan(100);
    });

    it('should calculate priority for task due in 12 hours', () => {
      const dueDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', dueDate, now);
      
      // Story 1.3: Important (48) + Time (1/0.5*100*0.4=80) clamped to 100
      expect(result).toBeGreaterThan(90);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should give highest priority to vital tasks due soon', () => {
      const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const result = calculateTaskPriority('vital', dueDate, now);
      
      // Story 1.3: Vital (100) + Time extreme => clamped to 100
      expect(result).toBe(100);
    });

    it('should give lower priority to trivial tasks far in future', () => {
      const dueDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
      const result = calculateTaskPriority('trivial', dueDate, now);
      
      // Story 1.3: Trivial (1*20*0.6=12) + Time (1/60*100*0.4≈0.67) ≈ 12.67
      expect(result).toBeGreaterThan(10);
      expect(result).toBeLessThan(15);
    });
  });

  describe('calculateTaskPriority - Backlog tasks (null dueDate)', () => {
    it('should handle backlog tasks with null dueDate', () => {
      const result = calculateTaskPriority('moderate', null, now);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should give vital backlog tasks higher score than trivial', () => {
      const vitalBacklog = calculateTaskPriority('vital', null, now);
      const trivialBacklog = calculateTaskPriority('trivial', null, now);
      
      expect(vitalBacklog).toBeGreaterThan(trivialBacklog);
    });

    it('vital backlog should have priority score around 30', () => {
      const result = calculateTaskPriority('vital', null, now);
      // Vital (5 * 5) + 5 = 30
      expect(result).toBe(30);
    });

    it('important backlog should have priority score around 25', () => {
      const result = calculateTaskPriority('important', null, now);
      // Important (4 * 5) + 5 = 25
      expect(result).toBe(25);
    });

    it('moderate backlog should have priority score around 20', () => {
      const result = calculateTaskPriority('moderate', null, now);
      // Moderate (3 * 5) + 5 = 20
      expect(result).toBe(20);
    });

    it('minor backlog should have priority score around 15', () => {
      const result = calculateTaskPriority('minor', null, now);
      // Minor (2 * 5) + 5 = 15
      expect(result).toBe(15);
    });

    it('trivial backlog should have priority score around 10', () => {
      const result = calculateTaskPriority('trivial', null, now);
      // Trivial (1 * 5) + 5 = 10
      expect(result).toBe(10);
    });

    it('backlog tasks should not be completely ignored', () => {
      const backlogs = ['vital', 'important', 'moderate', 'minor', 'trivial'] as const;
      backlogs.forEach((importance) => {
        const result = calculateTaskPriority(importance, null, now);
        expect(result).toBeGreaterThan(0);
      });
    });

    it('backlog tasks should have lower priority than urgent tasks', () => {
      const backlogImportant = calculateTaskPriority('important', null, now);
      const urgentTrivial = calculateTaskPriority('trivial', new Date(now.getTime() + 2 * 60 * 60 * 1000), now);
      
      expect(backlogImportant).toBeLessThan(urgentTrivial);
    });
  });

  describe('calculateTaskPriority - Overdue tasks', () => {
    it('should give high priority to overdue tasks', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('moderate', yesterday, now);
      
      // Story 1.3: Moderate (60) + Time (1/1*100*0.4=40) + Overdue(50) = clamped to 100
      expect(result).toBe(100);
    });

    it('should give very high priority to overdue vital tasks', () => {
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('vital', twoDaysAgo, now);
      
      // Vital (50) + overdue weight (50) = 100
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should give high priority even to overdue trivial tasks', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('trivial', threeDaysAgo, now);
      
      // Story 1.3: Trivial (20) + Time (1/3*100*0.4~13) + Overdue(50) = 83 → 75+
      expect(result).toBeGreaterThan(70);
      expect(result).toBeLessThanOrEqual(85);
    });
  });

  describe('calculateTaskPriority - Zero days remaining (today)', () => {
    it('should handle tasks due today', () => {
      const dueDate = new Date(now);
      const result = calculateTaskPriority('vital', dueDate, now);
      
      // Story 1.3: Vital (100) + extreme time pressure => clamped to 100
      expect(result).toBe(100);
    });

    it('should handle tasks due very soon (same day, different time)', () => {
      const sameDayLater = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours later
      const result = calculateTaskPriority('important', sameDayLater, now);
      
      // Story 1.3: Important (48) + Time (1/0.25*100*0.4=160 clamped) → 100
      expect(result).toBe(100);
    });

    it('should give less priority to important tasks due 30+ days away', () => {
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', thirtyDaysLater, now);
      
      // Important (40) + 30+ days weight (5) = 45
      expect(result).toBeGreaterThan(40);
      expect(result).toBeLessThan(50);
    });
  });

  describe('calculateTaskPriority - Edge cases and boundaries', () => {
    it('should handle dueDate exactly at time boundary (1 day)', () => {
      const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', oneDay, now);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle dueDate exactly at time boundary (3 days)', () => {
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', threeDays, now);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle dueDate exactly at time boundary (7 days)', () => {
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('important', sevenDays, now);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle very far future dates (365 days)', () => {
      const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const result = calculateTaskPriority('vital', oneYear, now);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should never return score > 100', () => {
      // Try various combinations that might cause overflow
      const testCases = [
        { importance: 'vital' as const, daysOffset: -100 },
        { importance: 'vital' as const, daysOffset: 0 },
        { importance: 'vital' as const, daysOffset: 1000 },
      ];

      testCases.forEach(({ importance, daysOffset }) => {
        const dueDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        const result = calculateTaskPriority(importance, dueDate, now);
        expect(result).toBeLessThanOrEqual(100);
      });
    });

    it('should never return score < 0', () => {
      // Backlog tasks should not go below 0
      const result = calculateTaskPriority('trivial', null, now);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTaskPriority - Input validation and error handling', () => {
    it('should throw PriorityCalculationError for invalid importance', () => {
      expect(() => {
        calculateTaskPriority('invalid-level' as any, null, now);
      }).toThrow(PriorityCalculationError);
    });

    it('should throw PriorityCalculationError for invalid currentTime', () => {
      expect(() => {
        calculateTaskPriority('moderate', null, 'not-a-date' as any);
      }).toThrow(PriorityCalculationError);
    });

    it('should throw PriorityCalculationError for invalid Date object', () => {
      expect(() => {
        calculateTaskPriority('moderate', null, new Date('invalid-date'));
      }).toThrow(PriorityCalculationError);
    });

    it('should throw PriorityCalculationError for invalid dueDate', () => {
      expect(() => {
        calculateTaskPriority('moderate', 'not-a-date' as any, now);
      }).toThrow(PriorityCalculationError);
    });

    it('should throw PriorityCalculationError for invalid dueDate object', () => {
      expect(() => {
        calculateTaskPriority('moderate', new Date('invalid-date'), now);
      }).toThrow(PriorityCalculationError);
    });

    it('should not throw for null dueDate', () => {
      expect(() => {
        calculateTaskPriority('moderate', null, now);
      }).not.toThrow();
    });

    it('should provide descriptive error message', () => {
      expect(() => {
        calculateTaskPriority('invalid' as any, null, now);
      }).toThrow(/Invalid importance level/);
    });
  });

  describe('calculateTaskPriority - Importance levels comparison', () => {
    it('vital should always have higher score than trivial (same conditions)', () => {
      const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      const vital = calculateTaskPriority('vital', dueDate, now);
      const trivial = calculateTaskPriority('trivial', dueDate, now);
      
      expect(vital).toBeGreaterThan(trivial);
    });

    it('important should have higher score than minor for same deadline', () => {
      const dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      
      const important = calculateTaskPriority('important', dueDate, now);
      const minor = calculateTaskPriority('minor', dueDate, now);
      
      expect(important).toBeGreaterThan(minor);
    });

    it('importance ordering should be preserved', () => {
      const dueDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      
      const vital = calculateTaskPriority('vital', dueDate, now);
      const important = calculateTaskPriority('important', dueDate, now);
      const moderate = calculateTaskPriority('moderate', dueDate, now);
      const minor = calculateTaskPriority('minor', dueDate, now);
      const trivial = calculateTaskPriority('trivial', dueDate, now);
      
      expect(vital).toBeGreaterThan(important);
      expect(important).toBeGreaterThan(moderate);
      expect(moderate).toBeGreaterThan(minor);
      expect(minor).toBeGreaterThan(trivial);
    });
  });

  describe('calculateTaskPriority - Time sensitivity comparison', () => {
    it('urgent deadline should have higher score than distant deadline (same importance)', () => {
      const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const urgent = calculateTaskPriority('moderate', nextDay, now);
      const distant = calculateTaskPriority('moderate', nextMonth, now);
      
      expect(urgent).toBeGreaterThan(distant);
    });

    it('overdue should have highest priority', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const overdue = calculateTaskPriority('moderate', yesterday, now);
      const urgent = calculateTaskPriority('moderate', tomorrow, now);
      const distant = calculateTaskPriority('moderate', nextMonth, now);
      
      expect(overdue).toBeGreaterThan(urgent);
      expect(urgent).toBeGreaterThan(distant);
    });
  });

  describe('calculateTaskPriority - Real-world scenarios', () => {
    it('should handle common business scenarios', () => {
      // Scenario 1: Important work task due tomorrow
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const workScore = calculateTaskPriority('important', tomorrow, now);
      expect(workScore).toBeGreaterThan(70);

      // Scenario 2: Vital personal task overdue
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const vitalScore = calculateTaskPriority('vital', yesterday, now);
      expect(vitalScore).toBeGreaterThan(90);

      // Scenario 3: Trivial learning task due in 60 days (backlog)
      const twoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const learningScore = calculateTaskPriority('trivial', twoMonths, now);
      expect(learningScore).toBeLessThan(20);

      // Scenario 4: Moderate task without deadline
      const backlogScore = calculateTaskPriority('moderate', null, now);
      expect(backlogScore).toBeGreaterThan(10);
      expect(backlogScore).toBeLessThan(40);
    });
  });

  describe('calculateTaskPriority - Story 1.3 Algorithm: Weighted Formula', () => {
    /**
     * Story 1.3 Algorithm: Priority = Importance*W1 + (1/TimeRemaining)*W2
     * W1 = 0.6 (Importance weight)
     * W2 = 0.4 (Time weight)
     * Overdue boost: +50
     * All results clamped to [0, 100]
     */

    it('Scenario 1: Very Important & Today - should have high score close to max', () => {
      // Vital task due 2 hours from now
      const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const score = calculateTaskPriority('vital', dueDate, now);
      
      // Vital: weight=5, importance=5*20*0.6=60
      // Time: ~1/0.083 days * 0.4 * 100 ≈ 480 (clamped to contribution)
      // Expected: score > 80 (very high, possibly clamped to 100)
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('Scenario 2: Important & Next Week - should have medium-high score', () => {
      // Important task due in 7 days
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const score = calculateTaskPriority('important', dueDate, now);
      
      // Important: weight=4, importance=4*20*0.6=48
      // Time: (1/7)*100*0.4 ≈ 5.71
      // Expected: ~53-55
      expect(score).toBeGreaterThan(45);
      expect(score).toBeLessThan(65);
    });

    it('Scenario 3: Minor & Backlog - should have low score but > 0', () => {
      // Minor task without deadline
      const score = calculateTaskPriority('minor', null, now);
      
      // Backlog formula: (2 * 5) + 5 = 15
      expect(score).toBe(15);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(20);
    });

    it('Scenario 4: Overdue - should have very high score with boost', () => {
      // Vital task overdue by 2 days
      const dueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const score = calculateTaskPriority('vital', dueDate, now);
      
      // Vital: importance=5*20*0.6=60
      // Time (with overdue): 1/0.5 * 100 * 0.4 = 80 (clamped from higher value)
      // Overdue boost: +50
      // Total would be > 100, clamped to 100
      expect(score).toBe(100);
    });

    it('Scenario 5: Zero Days Remaining - task due today', () => {
      // Task due at exactly same time
      const dueDate = new Date(now.getTime()); // Same as currentTime
      const score = calculateTaskPriority('vital', dueDate, now);
      
      // daysRemaining = 0, use max(0.01) to avoid division by zero
      // Expected: high score due to extreme time pressure
      expect(score).toBeGreaterThan(90);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle all importance levels with correct weighting', () => {
      const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

      const vitalScore = calculateTaskPriority('vital', dueDate, now);
      const importantScore = calculateTaskPriority('important', dueDate, now);
      const moderateScore = calculateTaskPriority('moderate', dueDate, now);
      const minorScore = calculateTaskPriority('minor', dueDate, now);
      const trivialScore = calculateTaskPriority('trivial', dueDate, now);

      // Higher importance should yield higher scores
      expect(vitalScore).toBeGreaterThan(importantScore);
      expect(importantScore).toBeGreaterThan(moderateScore);
      expect(moderateScore).toBeGreaterThan(minorScore);
      expect(minorScore).toBeGreaterThan(trivialScore);

      // All should be within range
      [vitalScore, importantScore, moderateScore, minorScore, trivialScore].forEach(
        (score) => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      );
    });

    it('should handle time proximity correctly - closer deadline = higher score', () => {
      const importance = 'important' as const;

      const score30Days = calculateTaskPriority(importance, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), now);
      const score7Days = calculateTaskPriority(importance, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), now);
      const score1Day = calculateTaskPriority(importance, new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), now);
      const scoreToday = calculateTaskPriority(importance, new Date(now.getTime() + 2 * 60 * 60 * 1000), now);

      // Closer deadline should have higher score
      expect(scoreToday).toBeGreaterThan(score1Day);
      expect(score1Day).toBeGreaterThan(score7Days);
      expect(score7Days).toBeGreaterThan(score30Days);
    });

    it('should clamp results to [0, 100] range', () => {
      // Test boundary cases
      const cases = [
        { importance: 'vital' as const, daysFromNow: 0.001 }, // Extremely urgent
        { importance: 'vital' as const, daysFromNow: -10 }, // Very overdue
        { importance: 'trivial' as const, daysFromNow: 365 }, // Very far away
      ];

      cases.forEach(({ importance, daysFromNow }) => {
        const dueDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
        const score = calculateTaskPriority(importance, dueDate, now);
        
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Number.isNaN(score)).toBe(false);
        expect(Number.isFinite(score)).toBe(true);
      });
    });
  });
});


