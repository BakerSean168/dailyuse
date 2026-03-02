/**
 * TaskDependencyPolicy Tests
 *
 * Tests the cross-aggregate circular dependency detection service.
 * Pure graph traversal logic — no persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskDependencyPolicy } from './task-dependency-policy';
import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';

// ─── Helpers ────────────────────────────────────────────────────────

function makeDep(predecessorTaskId: string, successorTaskId: string): TaskDependencyServerDTO {
  return {
    id: `dep-${predecessorTaskId}-${successorTaskId}`,
    predecessorTaskId,
    successorTaskId,
    dependencyType: 'FinishToStart' as any,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('TaskDependencyPolicy', () => {
  let policy: TaskDependencyPolicy;

  beforeEach(() => {
    policy = new TaskDependencyPolicy();
  });

  describe('ensureNoCircularDependency', () => {
    it('should return isValid: true when no dependencies exist', () => {
      const result = policy.ensureNoCircularDependency('A', 'B', []);
      expect(result.isValid).toBe(true);
      expect(result.cycle).toBeUndefined();
      expect(result.message).toBeUndefined();
    });

    it('should return isValid: true for a simple linear chain (A -> B -> C, adding A -> C)', () => {
      // Existing: A is predecessor of B, B is predecessor of C
      const deps = [makeDep('A', 'B'), makeDep('B', 'C')];

      // Adding A -> C (A predecessor, C successor) — no cycle
      const result = policy.ensureNoCircularDependency('A', 'C', deps);
      expect(result.isValid).toBe(true);
    });

    it('should detect direct cycle (A -> B, adding B -> A)', () => {
      // Existing: A is predecessor of B
      const deps = [makeDep('A', 'B')];

      // Adding B -> A (B predecessor, A successor)
      // This means: A depends on B, and now B depends on A => cycle
      const result = policy.ensureNoCircularDependency('B', 'A', deps);
      expect(result.isValid).toBe(false);
      expect(result.cycle).toBeDefined();
      expect(result.message).toContain('cycle');
    });

    it('should detect indirect cycle (A -> B -> C, adding C -> A)', () => {
      const deps = [makeDep('A', 'B'), makeDep('B', 'C')];

      // Adding C -> A
      const result = policy.ensureNoCircularDependency('C', 'A', deps);
      expect(result.isValid).toBe(false);
      expect(result.cycle).toBeDefined();
    });

    it('should return isValid: true when adding to an independent node', () => {
      // Existing: A -> B
      const deps = [makeDep('A', 'B')];

      // Adding C -> D (totally independent)
      const result = policy.ensureNoCircularDependency('C', 'D', deps);
      expect(result.isValid).toBe(true);
    });

    it('should handle diamond pattern without cycle', () => {
      // A -> B, A -> C, B -> D, C -> D (diamond, no cycle)
      const deps = [makeDep('A', 'B'), makeDep('A', 'C'), makeDep('B', 'D'), makeDep('C', 'D')];

      // Adding A -> D — no cycle
      const result = policy.ensureNoCircularDependency('A', 'D', deps);
      expect(result.isValid).toBe(true);
    });

    it('should detect cycle in diamond pattern when closing the loop', () => {
      // A -> B, A -> C, B -> D, C -> D
      const deps = [makeDep('A', 'B'), makeDep('A', 'C'), makeDep('B', 'D'), makeDep('C', 'D')];

      // Adding D -> A creates a cycle
      const result = policy.ensureNoCircularDependency('D', 'A', deps);
      expect(result.isValid).toBe(false);
      expect(result.cycle).toBeDefined();
    });

    it('should handle self-reference (A -> A)', () => {
      // Adding A -> A (predecessor = A, successor = A)
      const result = policy.ensureNoCircularDependency('A', 'A', []);
      // The algorithm checks: starting from successor (A), can we reach predecessor (A)?
      // Since current === target immediately, it should detect cycle
      expect(result.isValid).toBe(false);
    });

    it('should handle long chains without cycle', () => {
      // A -> B -> C -> D -> E -> F
      const deps = [
        makeDep('A', 'B'),
        makeDep('B', 'C'),
        makeDep('C', 'D'),
        makeDep('D', 'E'),
        makeDep('E', 'F'),
      ];

      // Adding A -> F — no cycle
      const result = policy.ensureNoCircularDependency('A', 'F', deps);
      expect(result.isValid).toBe(true);
    });

    it('should detect cycle in long chain when closing the loop', () => {
      // A -> B -> C -> D -> E
      const deps = [makeDep('A', 'B'), makeDep('B', 'C'), makeDep('C', 'D'), makeDep('D', 'E')];

      // Adding E -> A creates a cycle through the entire chain
      const result = policy.ensureNoCircularDependency('E', 'A', deps);
      expect(result.isValid).toBe(false);
      expect(result.cycle).toBeDefined();
    });

    it('should include cycle path in the result', () => {
      const deps = [makeDep('A', 'B'), makeDep('B', 'C')];

      // Adding C -> A
      const result = policy.ensureNoCircularDependency('C', 'A', deps);
      expect(result.isValid).toBe(false);
      expect(result.cycle).toBeDefined();
      // The cycle should include the nodes that form the loop
      expect(result.cycle!.length).toBeGreaterThan(1);
    });

    it('should handle multiple independent branches', () => {
      // Branch 1: A -> B -> C
      // Branch 2: D -> E -> F
      const deps = [makeDep('A', 'B'), makeDep('B', 'C'), makeDep('D', 'E'), makeDep('E', 'F')];

      // Adding C -> D (connecting branches, no cycle)
      const result = policy.ensureNoCircularDependency('C', 'D', deps);
      expect(result.isValid).toBe(true);
    });

    it('should detect cycle when connecting branches creates one', () => {
      // Branch 1: A -> B -> C
      // Branch 2: D -> E -> F
      // Plus C -> D (connects them)
      const deps = [
        makeDep('A', 'B'),
        makeDep('B', 'C'),
        makeDep('C', 'D'),
        makeDep('D', 'E'),
        makeDep('E', 'F'),
      ];

      // Adding F -> A creates a cycle through both branches
      const result = policy.ensureNoCircularDependency('F', 'A', deps);
      expect(result.isValid).toBe(false);
    });
  });
});
