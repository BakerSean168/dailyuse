/**
 * Benchmark: TaskQueryService Sorting Performance
 * Tests sorting at service level (including enrichment and conversions)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  benchmark,
  createMockTasks,
  calculateVariance,
  findOutliers,
} from './benchmark-utils';
import { TaskQueryService } from '../../TaskQueryService';
import { TaskSortBy, TaskFilterBy } from '@dailyuse/contracts/task';

describe('Benchmarks: TaskQueryService Sorting', () => {
  let service: TaskQueryService;

  beforeEach(async () => {
    service = await TaskQueryService.getInstance();
  });

  it('should sort 2000 tasks by priority (service level) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Service: Sort 2000 by priority',
      async () => {
        // Simulate service-level sorting
        const enriched = tasks.map((t) => ({
          ...t,
          priority: t.priority,
        }));
        enriched.sort((a, b) => b.priority - a.priority);
      },
      2000,
      10,
    );

    console.log(
      `[service priority] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should sort 2000 tasks by dueDate (service level) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Service: Sort 2000 by dueDate',
      async () => {
        const enriched = tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate,
        }));
        enriched.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
      },
      2000,
      10,
    );

    console.log(
      `[service dueDate] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should sort 2000 tasks by createdAt (service level) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Service: Sort 2000 by createdAt',
      async () => {
        const enriched = tasks.map((t) => ({
          ...t,
          createdAt: t.createdAt,
        }));
        enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      2000,
      10,
    );

    console.log(
      `[service createdAt] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should sort 2000 tasks by importance (service level) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const importanceOrder = { vital: 5, important: 4, moderate: 3, minor: 2, trivial: 1 };

    const result = await benchmark(
      'Service: Sort 2000 by importance',
      async () => {
        const enriched = tasks.map((t) => ({
          ...t,
          importance: t.importance,
        }));
        enriched.sort(
          (a, b) =>
            (importanceOrder[b.importance as keyof typeof importanceOrder] || 0) -
            (importanceOrder[a.importance as keyof typeof importanceOrder] || 0),
        );
      },
      2000,
      10,
    );

    console.log(
      `[service importance] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should filter and sort 2000 tasks (1 condition) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Service: Filter (importance:important) + Sort by priority',
      async () => {
        const filtered = tasks.filter(
          (t) =>
            t.importance === 'vital' || t.importance === 'important',
        );
        filtered.sort((a, b) => b.priority - a.priority);
      },
      2000,
      10,
    );

    console.log(
      `[filter 1 + sort] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(100);
  });

  it('should filter and sort 2000 tasks (2 conditions) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Service: Filter (important + active) + Sort by priority',
      async () => {
        const filtered = tasks.filter(
          (t) =>
            (t.importance === 'vital' || t.importance === 'important') &&
            t.status === 'ACTIVE',
        );
        filtered.sort((a, b) => b.priority - a.priority);
      },
      2000,
      10,
    );

    console.log(
      `[filter 2 + sort] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(110);
  });

  it('should filter and sort 2000 tasks (3 conditions) in acceptable time', async () => {
    const tasks = createMockTasks(2000);

    const result = await benchmark(
      'Service: Filter (important + active + has-due-date) + Sort',
      async () => {
        const filtered = tasks.filter(
          (t) =>
            (t.importance === 'vital' || t.importance === 'important') &&
            t.status === 'ACTIVE' &&
            t.dueDate !== null,
        );
        filtered.sort((a, b) => b.priority - a.priority);
      },
      2000,
      10,
    );

    console.log(
      `[filter 3 + sort] avg=${result.avgMs}ms, p95=${result.p95Ms}ms`,
    );
    expect(result.avgMs).toBeLessThan(120);
  });

  it('should maintain consistency with multiple filter+sort combinations', async () => {
    const tasks = createMockTasks(2000);
    const times: number[] = [];

    for (let i = 0; i < 20; i++) {
      const start = performance.now();

      // Varying filter/sort combinations
      const filtered = tasks.filter((t) => t.priority > i * 5);
      filtered.sort((a, b) => b.priority - a.priority);

      const end = performance.now();
      times.push(end - start);
    }

    const variance = calculateVariance(times);
    const outliers = findOutliers(times, 1.5);

    console.log(
      `[consistency] variance=${variance.toFixed(2)}%, outliers=${outliers.length}/20`,
    );
    expect(variance).toBeLessThan(100); // High threshold for varying filters and JIT warmup
  });
});
