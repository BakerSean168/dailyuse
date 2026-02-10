/**
 * Benchmark: Sorting Algorithm Performance
 * Tests pure JavaScript sort performance at different task counts
 * Goal: Verify O(n log n) complexity and measure time constants
 */

import { describe, it, expect } from 'vitest';
import {
  benchmark,
  createMockTasks,
  calculateVariance,
  findOutliers,
} from './benchmark-utils';
import type { BenchmarkMockTask } from './benchmark-utils';

/**
 * Simple in-memory sort by priority (descending)
 */
function sortByPriority(tasks: BenchmarkMockTask[]): BenchmarkMockTask[] {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

/**
 * Simple in-memory sort by due date (ascending, no-due-date last)
 */
function sortByDueDate(tasks: BenchmarkMockTask[]): BenchmarkMockTask[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

/**
 * Simple in-memory sort by created date (descending)
 */
function sortByCreatedAt(tasks: BenchmarkMockTask[]): BenchmarkMockTask[] {
  return [...tasks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

describe('Benchmarks: Sort Algorithm Performance', () => {
  it('should sort 100 tasks by priority in acceptable time', async () => {
    const tasks = createMockTasks(100);

    const result = await benchmark(
      'Sort 100 tasks by priority',
      () => {
        sortByPriority(tasks);
      },
      100,
      10,
    );

    console.log(`[100 tasks] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`);
    expect(result.avgMs).toBeLessThan(20); // 100 tasks: <20ms
  });

  it('should sort 500 tasks by priority in acceptable time', async () => {
    const tasks = createMockTasks(500);

    const result = await benchmark(
      'Sort 500 tasks by priority',
      () => {
        sortByPriority(tasks);
      },
      500,
      10,
    );

    console.log(`[500 tasks] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`);
    expect(result.avgMs).toBeLessThan(40); // 500 tasks: <40ms
  });

  it('should sort 1000 tasks by priority in acceptable time', async () => {
    const tasks = createMockTasks(1000);

    const result = await benchmark(
      'Sort 1000 tasks by priority',
      () => {
        sortByPriority(tasks);
      },
      1000,
      10,
    );

    console.log(`[1000 tasks] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`);
    expect(result.avgMs).toBeLessThan(70); // 1000 tasks: <70ms
  });

  it('should sort 1500 tasks by priority in acceptable time', async () => {
    const tasks = createMockTasks(1500);

    const result = await benchmark(
      'Sort 1500 tasks by priority',
      () => {
        sortByPriority(tasks);
      },
      1500,
      10,
    );

    console.log(`[1500 tasks] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`);
    expect(result.avgMs).toBeLessThan(85); // 1500 tasks: <85ms
  });

  it('should sort 2000 tasks by priority in acceptable time (TARGET)', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Sort 2000 tasks by priority',
      () => {
        sortByPriority(tasks);
      },
      2000,
      10,
    );

    console.log(
      `[2000 tasks] avg=${result.avgMs}ms, p95=${result.p95Ms}ms, p99=${result.p99Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(100); // 2000 tasks: <100ms TARGET
  });

  it('should sort 3000 tasks by priority (warning threshold)', async () => {
    const tasks = createMockTasks(3000);

    const result = await benchmark(
      'Sort 3000 tasks by priority',
      () => {
        sortByPriority(tasks);
      },
      3000,
      5, // Fewer iterations for larger sets
    );

    console.log(
      `[3000 tasks] avg=${result.avgMs}ms, p95=${result.p95Ms}ms (warning: consider pagination)`,
    );
    expect(result.avgMs).toBeLessThan(150); // Warning: should still be <150ms
  });

  it('should sort 2000 tasks by due date in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Sort 2000 by dueDate',
      () => {
        sortByDueDate(tasks);
      },
      2000,
      10,
    );

    console.log(`[dueDate sort] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`);
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should sort 2000 tasks by created date in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Sort 2000 by createdAt',
      () => {
        sortByCreatedAt(tasks);
      },
      2000,
      10,
    );

    console.log(`[createdAt sort] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`);
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should maintain consistent performance across multiple runs', async () => {
    const tasks = createMockTasks(2000);
    const times: number[] = [];

    // Warm-up runs to allow JIT compilation
    for (let i = 0; i < 5; i++) {
      sortByPriority(tasks);
    }

    // Actual measurement runs
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      sortByPriority(tasks);
      const end = performance.now();
      times.push(end - start);
    }

    const variance = calculateVariance(times);
    const outliers = findOutliers(times, 1.5);

    console.log(
      `[stability] variance=${variance.toFixed(2)}%, outliers=${outliers.length}/20`,
    );

    expect(variance).toBeLessThan(50); // Variance <50% (more realistic for JS)
    expect(outliers.length).toBeLessThan(20 * 0.15); // <15% outliers
  });
});
