/**
 * Benchmark Utilities
 * Provides helper functions for performance testing of sorting/filtering
 */

import { ImportanceLevel } from '@memoflow/contracts/shared';

/**
 * Mock task type for benchmark testing
 * Uses Date objects instead of timestamps for easier sorting comparisons
 */
export interface BenchmarkMockTask {
  id: string;
  identityId: string;
  title: string;
  description: string;
  importance: ImportanceLevel;
  dueDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  priority: number;
}

/**
 * Results of a single benchmark run
 */
export interface BenchmarkResult {
  name: string;
  iterationCount: number;
  taskCount: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  medianMs: number;
  stdDevMs: number;
  p95Ms: number;
  p99Ms: number;
}

/**
 * Run a benchmark test multiple times and collect statistics
 *
 * @param name Benchmark name
 * @param fn Test function to benchmark
 * @param taskCount Number of tasks involved
 * @param iterations Number of times to run (default: 10)
 * @returns Benchmark results with statistics
 */
export async function benchmark(
  name: string,
  fn: () => Promise<unknown> | unknown,
  taskCount: number,
  iterations: number = 10,
): Promise<BenchmarkResult> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const stdDev = Math.sqrt(
    times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length
  );

  return {
    name,
    iterationCount: iterations,
    taskCount,
    minMs: Math.round(times[0] * 100) / 100,
    maxMs: Math.round(times[times.length - 1] * 100) / 100,
    avgMs: Math.round(avg * 100) / 100,
    medianMs: Math.round(median * 100) / 100,
    stdDevMs: Math.round(stdDev * 100) / 100,
    p95Ms: Math.round(times[Math.floor(times.length * 0.95)] * 100) / 100,
    p99Ms: Math.round(times[Math.floor(times.length * 0.99)] * 100) / 100,
  };
}

/**
 * Create mock tasks for benchmarking with realistic distribution
 *
 * @param count Number of tasks to generate
 * @param seed Random seed for reproducibility
 * @returns Array of mock BenchmarkMockTask objects for testing
 */
export function createMockTasks(
  count: number,
  seed: number = 42,
): BenchmarkMockTask[] {
  const tasks: BenchmarkMockTask[] = [];
  const rng = seededRandom(seed);

  for (let i = 0; i < count; i++) {
    const importance = [
      ImportanceLevel.Vital,
      ImportanceLevel.Important,
      ImportanceLevel.Moderate,
      ImportanceLevel.Minor,
      ImportanceLevel.Trivial,
    ][Math.floor(rng() * 5)];

    const hasDate = rng() > 0.2; // 80% have due dates
    const dueDate = hasDate
      ? new Date(Date.now() + (rng() - 0.5) * 180 * 24 * 60 * 60 * 1000) // -90 to +90 days
      : null;

    const createdAt = new Date(
      Date.now() - rng() * 365 * 24 * 60 * 60 * 1000, // 0-365 days ago
    );

    tasks.push({
      id: `task-${i}`,
      identityId: 'test-account',
      title: `Task ${i}`,
      description: `Description for task ${i}`,
      importance,
      dueDate,
      status: 'ACTIVE',
      createdAt,
      updatedAt: createdAt,
      priority: Math.random() * 100, // Random priority for unsorted data
    });
  }

  return tasks;
}

/**
 * Seeded random number generator for reproducible test data
 */
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Export benchmark results to CSV format
 *
 * @param results Array of benchmark results
 * @returns CSV string
 */
export function resultsToCSV(results: BenchmarkResult[]): string {
  const lines = [
    'Name,TaskCount,Iterations,MinMs,MaxMs,AvgMs,MedianMs,StdDevMs,P95Ms,P99Ms',
    ...results.map((r) =>
      [
        r.name,
        r.taskCount,
        r.iterationCount,
        r.minMs,
        r.maxMs,
        r.avgMs,
        r.medianMs,
        r.stdDevMs,
        r.p95Ms,
        r.p99Ms,
      ].join(','),
    ),
  ];

  return lines.join('\n');
}

/**
 * Compare two benchmark results and flag regressions
 *
 * @param baseline Baseline benchmark result
 * @param current Current benchmark result
 * @param regressionThreshold Percentage increase that's acceptable (default: 10%)
 * @returns Analysis result with pass/fail and details
 */
export function compareResults(
  baseline: BenchmarkResult,
  current: BenchmarkResult,
  regressionThreshold: number = 10,
) {
  const percentChange = (
    ((current.avgMs - baseline.avgMs) / baseline.avgMs) *
    100
  ).toFixed(2);
  const isRegression = parseFloat(percentChange) > regressionThreshold;

  return {
    baselineAvg: baseline.avgMs,
    currentAvg: current.avgMs,
    percentChange: parseFloat(percentChange),
    isRegression,
    message: isRegression
      ? `⚠️ REGRESSION: ${percentChange}% slower (threshold: ${regressionThreshold}%)`
      : `✓ No regression: ${percentChange}% change`,
  };
}

/**
 * Calculate variance as percentage of mean
 */
export function calculateVariance(times: number[]): number {
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(
    times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length
  );
  return (stdDev / avg) * 100;
}

/**
 * Check for outliers in timing data
 * Outlier = value > threshold * median
 */
export function findOutliers(
  times: number[],
  threshold: number = 1.5,
): number[] {
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return times.filter((t) => t > median * threshold);
}
