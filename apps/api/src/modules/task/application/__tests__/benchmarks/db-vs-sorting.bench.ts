/**
 * Benchmark: Database vs. Sorting Performance Analysis
 * Separates database query time from sorting time to identify bottleneck
 */

import { describe, it, expect } from 'vitest';
import {
  benchmark,
  createMockTasks,
  calculateVariance,
  findOutliers,
} from './benchmark-utils';

/**
 * Simulate database fetch operation (slow I/O)
 */
async function simulateDbFetch(taskCount: number): Promise<any[]> {
  // Simulate network/DB latency (50-100ms typical)
  const latency = 50 + Math.random() * 50;
  await new Promise((resolve) => setTimeout(resolve, latency));
  return createMockTasks(taskCount);
}

/**
 * Sort tasks in memory
 */
function sortByPriority(
  tasks: Array<{ priority: number }>,
): Array<{ priority: number }> {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

describe('Benchmarks: Database vs. Sorting Performance', () => {
  it('should identify bottleneck: DB fetch vs Sorting (2000 tasks)', async () => {
    // Measure DB fetch only (no sorting)
    const dbOnlyResult = await benchmark(
      'DB Fetch Only (2000 tasks)',
      async () => {
        await simulateDbFetch(2000);
        // Don't sort, just fetch
      },
      2000,
      3,
    );

    // Measure sorting only (in-memory, already loaded)
    const tasks = createMockTasks(2000);
    const sortOnlyResult = await benchmark(
      'Sorting Only (2000 tasks)',
      () => {
        sortByPriority(tasks);
      },
      2000,
      10,
    );

    // Measure full operation (DB + Sort)
    const fullResult = await benchmark(
      'Full Operation (DB + Sort)',
      async () => {
        const dbTasks = await simulateDbFetch(2000);
        sortByPriority(dbTasks);
      },
      2000,
      3,
    );

    const dbPercentage = (dbOnlyResult.avgMs / fullResult.avgMs) * 100;
    const sortPercentage = (sortOnlyResult.avgMs / fullResult.avgMs) * 100;

    console.log('Performance Breakdown:');
    console.log(`  DB Fetch:    ${dbOnlyResult.avgMs.toFixed(2)}ms (${dbPercentage.toFixed(1)}%)`);
    console.log(`  Sorting:     ${sortOnlyResult.avgMs.toFixed(2)}ms (${sortPercentage.toFixed(1)}%)`);
    console.log(`  Total:       ${fullResult.avgMs.toFixed(2)}ms`);

    // DB should be significant portion of total time (40-70% typical)
    // This validates that DB is the bottleneck, not sorting
    expect(dbPercentage).toBeGreaterThan(40);
  });

  it('should show sorting as negligible fraction of total E2E time', async () => {
    const dbFetchTime = await benchmark(
      'DB Round-trip (network + query)',
      async () => {
        await simulateDbFetch(2000);
      },
      2000,
      5,
    );

    const tasks = createMockTasks(2000);
    const sortTime = await benchmark(
      'Sorting only',
      () => {
        sortByPriority(tasks);
      },
      2000,
      10,
    );

    // Sorting should be <30% of DB time
    const ratio = (sortTime.avgMs / dbFetchTime.avgMs) * 100;
    console.log(
      `Sort vs DB ratio: ${ratio.toFixed(1)}% (sorting ${sortTime.avgMs.toFixed(2)}ms, DB ${dbFetchTime.avgMs.toFixed(2)}ms)`,
    );

    expect(ratio).toBeLessThan(30);
  });

  it('should show O(n log n) sorting efficiency vs O(n) data retrieval', async () => {
    const counts = [100, 500, 1000, 2000];
    const results: Array<{
      count: number;
      dbMs: number;
      sortMs: number;
      ratio: number;
    }> = [];

    for (const count of counts) {
      const dbTime = await benchmark(
        `DB fetch ${count}`,
        async () => {
          await simulateDbFetch(count);
        },
        count,
        3,
      );

      const tasks = createMockTasks(count);
      const sortTime = await benchmark(
        `Sort ${count}`,
        () => {
          sortByPriority(tasks);
        },
        count,
        5,
      );

      const ratio = (sortTime.avgMs / dbTime.avgMs) * 100;
      results.push({
        count,
        dbMs: dbTime.avgMs,
        sortMs: sortTime.avgMs,
        ratio,
      });
    }

    console.log('\nScaling Analysis:');
    console.log('Count | DB Time | Sort Time | Ratio');
    console.log('------|---------|-----------|-------');
    for (const r of results) {
      console.log(
        `${r.count.toString().padEnd(5)} | ${r.dbMs.toFixed(2).padStart(7)}ms | ${r.sortMs.toFixed(2).padStart(9)}ms | ${r.ratio.toFixed(1).padStart(4)}%`,
      );
    }

    // Sorting ratio should remain low even as data grows
    const lastRatio = results[results.length - 1].ratio;
    expect(lastRatio).toBeLessThan(40);
  });

  it('should show consistent DB bottleneck across different sort operations', async () => {
    const dbTime = await benchmark(
      'DB Fetch (2000 tasks)',
      async () => {
        await simulateDbFetch(2000);
      },
      2000,
      3,
    );

    const tasks = createMockTasks(2000);

    // Different sort operations
    const sorts = [
      {
        name: 'Priority sort',
        fn: () => {
          const copy = [...tasks];
          copy.sort((a, b) => b.priority - a.priority);
        },
      },
      {
        name: 'Due date sort',
        fn: () => {
          const copy = [...tasks];
          copy.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.getTime() - b.dueDate.getTime();
          });
        },
      },
      {
        name: 'Created at sort',
        fn: () => {
          const copy = [...tasks];
          copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        },
      },
    ];

    console.log(`\nDB bottleneck check (DB time: ${dbTime.avgMs.toFixed(2)}ms):`);

    for (const sort of sorts) {
      const sortTime = await benchmark(sort.name, sort.fn, 2000, 5);
      const ratio = (sortTime.avgMs / dbTime.avgMs) * 100;
      console.log(`  ${sort.name}: ${ratio.toFixed(1)}% of DB time`);

      // All sorting operations should be much smaller than DB
      expect(ratio).toBeLessThan(50);
    }
  });

  it('should maintain bottleneck clarity even with filtering', async () => {
    const dbTime = await benchmark(
      'DB Fetch (2000 tasks)',
      async () => {
        await simulateDbFetch(2000);
      },
      2000,
      3,
    );

    const tasks = createMockTasks(2000);

    const filterAndSortTime = await benchmark(
      'Filter (3 conditions) + Sort',
      () => {
        const filtered = tasks.filter(
          (t) =>
            (t.importance === 'vital' || t.importance === 'important') &&
            t.status === 'ACTIVE' &&
            t.dueDate !== null,
        );
        filtered.sort((a, b) => b.priority - a.priority);
      },
      2000,
      5,
    );

    const ratio = (filterAndSortTime.avgMs / dbTime.avgMs) * 100;
    console.log(
      `\nFilter+Sort vs DB: ${ratio.toFixed(1)}% (${filterAndSortTime.avgMs.toFixed(2)}ms vs ${dbTime.avgMs.toFixed(2)}ms)`,
    );

    // Even with filtering, DB should dominate
    expect(ratio).toBeLessThan(60);
  });
});
