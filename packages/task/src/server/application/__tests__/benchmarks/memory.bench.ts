/**
 * Benchmark: Memory Usage
 * Monitor heap allocation and garbage collection
 */

import { describe, it, expect } from 'vitest';
import { createMockTasks } from './benchmark-utils';

/**
 * Simple sort by priority for testing
 */
function sortByPriority(tasks: Array<{ priority: number }>): Array<{ priority: number }> {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

describe('Benchmarks: Memory Usage', () => {
  it('should not leak memory during sorting operations', async () => {
    if (typeof global.gc !== 'function') {
      throw new Error('Memory experiment requires Node --expose-gc');
    }

    const taskCounts = [100, 500, 1000, 2000];

    for (const count of taskCounts) {
      // Force garbage collection before measurement
      global.gc();

      const before = process.memoryUsage();
      const tasks = createMockTasks(count);

      // Sort 10 times
      for (let i = 0; i < 10; i++) {
        sortByPriority(tasks);
      }

      // Force garbage collection after
      global.gc();

      const after = process.memoryUsage();

      const heapDelta = (after.heapUsed - before.heapUsed) / 1024 / 1024; // MB

      console.log(
        `Tasks: ${count.toString().padStart(4)}, Heap increase: ${heapDelta.toFixed(2).padStart(6)} MB`,
      );

      // Heap increase should be less than 50MB even for 2000 tasks
      expect(Math.abs(heapDelta)).toBeLessThan(50);
    }
  });

  it('should not show excessive GC pauses', async () => {
    if (typeof global.gc !== 'function') {
      throw new Error('Memory experiment requires Node --expose-gc');
    }

    const gcPauses: number[] = [];

    // Measure time around GC
    for (let i = 0; i < 20; i++) {
      const before = performance.now();
      global.gc();
      const after = performance.now();
      gcPauses.push(after - before);
    }

    const avgPause = gcPauses.reduce((a, b) => a + b, 0) / gcPauses.length;
    const maxPause = Math.max(...gcPauses);

    console.log(`Average GC pause: ${avgPause.toFixed(2)}ms, Max: ${maxPause.toFixed(2)}ms`);

    // Average GC pause should be <10ms
    expect(avgPause).toBeLessThan(10);
    // Max pause should be <50ms
    expect(maxPause).toBeLessThan(50);
  });

  it('should handle large task sets without excessive heap growth', async () => {
    if (typeof global.gc !== 'function') {
      throw new Error('Memory experiment requires Node --expose-gc');
    }

    global.gc();
    const baseline = process.memoryUsage().heapUsed;

    // Create and sort progressively larger sets
    const results: Array<{ count: number; heapMB: number }> = [];

    for (let count = 500; count <= 5000; count += 500) {
      const tasks = createMockTasks(count);
      sortByPriority(tasks);

      const current = process.memoryUsage().heapUsed;
      const heapMB = (current - baseline) / 1024 / 1024;

      results.push({ count, heapMB });

      console.log(
        `Heap at ${count.toString().padStart(4)} tasks: ${heapMB.toFixed(2).padStart(6)} MB`,
      );
    }

    // Verify linear growth (no exponential spike)
    // At 5000 tasks, should still be <200MB
    const final = results[results.length - 1];
    expect(final.heapMB).toBeLessThan(200);

    // Growth rate should be reasonable (roughly linear with task count)
    const growthPerTask = final.heapMB / final.count;
    expect(growthPerTask).toBeLessThan(0.05); // <0.05MB per task on average
  });

  it('should not accumulate dead objects after sorting', async () => {
    if (typeof global.gc !== 'function') {
      throw new Error('Memory experiment requires Node --expose-gc');
    }

    global.gc();
    const baseline = process.memoryUsage().external;

    // Sort many times
    for (let i = 0; i < 100; i++) {
      const tasks = createMockTasks(1000);
      sortByPriority(tasks);
    }

    global.gc();
    const final = process.memoryUsage().external;
    const externalDelta = (final - baseline) / 1024 / 1024;

    console.log(`External memory delta: ${externalDelta.toFixed(2)} MB`);

    // External memory should not grow significantly (sorted arrays are GC'd)
    expect(Math.abs(externalDelta)).toBeLessThan(20);
  });

  it('should show realistic memory patterns for real-world load', async () => {
    if (typeof global.gc !== 'function') {
      throw new Error('Memory experiment requires Node --expose-gc');
    }

    const samples: number[] = [];

    // Simulate realistic user workflow
    // Users have varying task counts (100-3000)
    for (let i = 0; i < 50; i++) {
      global.gc();

      const count = 100 + ((i * 7919) % 2900);
      const tasks = createMockTasks(Math.floor(count));

      const before = process.memoryUsage().heapUsed;
      sortByPriority(tasks);
      const after = process.memoryUsage().heapUsed;

      samples.push((after - before) / 1024 / 1024);
    }

    const avgMemory = samples.reduce((a, b) => a + b, 0) / samples.length;
    const maxMemory = Math.max(...samples);

    console.log(
      `Realistic load - avg heap per sort: ${avgMemory.toFixed(2)}MB, max: ${maxMemory.toFixed(2)}MB`,
    );

    // Should be reasonable memory usage
    expect(avgMemory).toBeLessThan(50); // Reasonable average
    expect(maxMemory).toBeLessThan(100); // Reasonable maximum
  });
});
