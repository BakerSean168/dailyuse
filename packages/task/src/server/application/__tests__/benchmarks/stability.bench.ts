/**
 * Benchmark: Performance Stability
 * Verify that performance doesn't degrade with repeated operations
 * and that variance is acceptable (no occasional spike)
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
 * Simple sort by priority for testing
 */
function sortByPriority(tasks: BenchmarkMockTask[]): BenchmarkMockTask[] {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

describe('Benchmarks: Performance Stability', () => {
  it('should maintain consistent performance over 100 operations', async () => {
    const tasks = createMockTasks(2000);
    const times: number[] = [];
    const sortsPerSample = 10;

    // Warm-up runs to allow JIT compilation
    for (let i = 0; i < 10; i++) {
      sortByPriority(tasks);
    }

    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      for (let j = 0; j < sortsPerSample; j++) {
        sortByPriority(tasks);
      }
      const end = performance.now();
      times.push((end - start) / sortsPerSample);
    }

    const variance = calculateVariance(times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    console.log(
      `[100 ops] avg=${avg.toFixed(2)}ms, variance=${variance.toFixed(2)}%`,
    );

    // Variance should be <100% (realistic for JS runtime with JIT and full test suite)
    expect(variance).toBeLessThan(100);

  });

  it('should not degrade performance between 1st and 100th operation', async () => {
    const tasks = createMockTasks(2000);

    const firstOp = await benchmark(
      'First operation',
      () => sortByPriority(tasks),
      2000,
      1,
    );

    // Run 98 operations to warm up
    for (let i = 0; i < 98; i++) {
      sortByPriority(tasks);
    }

    const hundredthOp = await benchmark(
      'Hundredth operation',
      () => sortByPriority(tasks),
      2000,
      1,
    );

    const degradation =
      ((hundredthOp.avgMs - firstOp.avgMs) / firstOp.avgMs) * 100;

    console.log(`[degradation] 1st=${firstOp.avgMs}ms, 100th=${hundredthOp.avgMs}ms, degradation=${degradation.toFixed(2)}%`);

    // Should not degrade by more than 50% (JS runtime variance is high)
    expect(degradation).toBeLessThan(50);
  });

  it('should show acceptable performance variance with realistic data', async () => {
    const times: number[] = [];
    const sortsPerSample = 10;

    // Simulate realistic load: different task counts
    const counts = [100, 500, 1000, 1500, 2000];

    // Warm-up runs
    for (const count of counts) {
      const warmupTasks = createMockTasks(count);
      sortByPriority(warmupTasks);
    }

    for (let i = 0; i < 20; i++) {
      const count = counts[i % counts.length];
      const tasks = createMockTasks(count);

      const start = performance.now();
      for (let j = 0; j < sortsPerSample; j++) {
        sortByPriority(tasks);
      }
      const end = performance.now();
      times.push((end - start) / sortsPerSample);
    }

    const variance = calculateVariance(times);
    const outliers = findOutliers(times, 2); // More lenient threshold for mixed loads

    console.log(
      `[mixed load] variance=${variance.toFixed(2)}%, outliers=${outliers.length}/20`,
    );

    // Variance can be higher with mixed loads (different task counts)
    expect(variance).toBeLessThan(100); // Very high threshold since task counts vary
    expect(outliers.length).toBeLessThanOrEqual(20 * 0.35); // <=35% outliers acceptable for mixed loads
  });

  it('should not show memory accumulation across operations', async () => {
    if (typeof global.gc !== 'function') {
      console.log('Skipping GC test - run with --expose-gc');
      return;
    }

    const initialMemory = process.memoryUsage().heapUsed;

    // Run 50 sorts
    for (let i = 0; i < 50; i++) {
      const tasks = createMockTasks(1000);
      sortByPriority(tasks);
    }

    global.gc();
    const finalMemory = process.memoryUsage().heapUsed;
    const increase = (finalMemory - initialMemory) / 1024 / 1024; // MB

    console.log(
      `[memory] initial=${(initialMemory / 1024 / 1024).toFixed(2)}MB, final=${(finalMemory / 1024 / 1024).toFixed(2)}MB, increase=${increase.toFixed(2)}MB`,
    );

    // Should not accumulate more than 30MB
    expect(increase).toBeLessThan(30);
  });

  it('should handle high-frequency repeated operations without performance cliff', async () => {
    const tasks = createMockTasks(2000);
    const times: number[] = [];

    // 200 rapid operations
    for (let i = 0; i < 200; i++) {
      const start = performance.now();
      sortByPriority(tasks);
      const end = performance.now();
      times.push(end - start);
    }

    // Check for performance cliff (sudden jump)
    const firstHalf = times.slice(0, 100);
    const secondHalf = times.slice(100, 200);

    const firstHalfAvg =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const degradation =
      ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    console.log(
      `[cliff detection] first 100 avg=${firstHalfAvg.toFixed(2)}ms, second 100 avg=${secondHalfAvg.toFixed(2)}ms, degradation=${degradation.toFixed(2)}%`,
    );

    // No significant degradation
    expect(degradation).toBeLessThan(25);
  });
});
