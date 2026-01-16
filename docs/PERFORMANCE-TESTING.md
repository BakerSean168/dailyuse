# Performance Testing Guide

## Overview

This guide explains how to run performance benchmarks locally for Task sorting and filtering. The benchmarks verify that sorting and filtering operations complete in acceptable time (<100ms for 2000 tasks) without blocking the UI.

## Prerequisites

- Node.js 18+ with `--expose-gc` flag support (for memory tests)
- pnpm package manager
- Development environment set up (see README.md)

## Quick Start

### Run All Benchmarks

```bash
cd d:/home/projects/dailyuse

# Run all benchmark tests
pnpm nx test application-server --testPathPattern="bench"
```

### Run Specific Benchmark Suite

```bash
# Sorting algorithm performance (pure JavaScript sort)
pnpm nx test application-server --testPathPattern="sort-algorithm.bench"

# Service-level with all sort types and filtering
pnpm nx test application-server --testPathPattern="service-sorting.bench"

# Performance stability and consistency
pnpm nx test application-server --testPathPattern="stability.bench"

# Memory profiling (requires --expose-gc)
node --expose-gc node_modules/.bin/vitest \
  src/modules/task/application/__tests__/benchmarks/memory.bench.ts

# Database vs Sorting breakdown
pnpm nx test application-server --testPathPattern="db-vs-sorting.bench"

# E2E HTTP endpoint testing
pnpm nx test application-server --testPathPattern="http-endpoint.bench"
```

## Benchmark Types Explained

### 1. Sort Algorithm Benchmarks

**File:** `sort-algorithm.bench.ts`

**What it tests:**
- Pure JavaScript sort performance
- Different task counts (100, 500, 1000, 1500, 2000, 3000)
- O(n log n) complexity verification
- Time constants measurement

**Expected Output:**
```
[100 tasks] avg=2.5ms, p95=3.8ms
[500 tasks] avg=12.3ms, p95=15.2ms
[1000 tasks] avg=22.5ms, p95=28.1ms
[1500 tasks] avg=35.2ms, p95=42.3ms
[2000 tasks] avg=45.8ms, p95=54.2ms (TARGET)
[3000 tasks] avg=72.5ms, p95=88.3ms (WARNING: consider pagination)
```

**Target Metrics:**
- 100 tasks: <20ms ✅
- 500 tasks: <40ms ✅
- 1000 tasks: <70ms ✅
- 1500 tasks: <85ms ✅
- 2000 tasks: <100ms ✅ (primary target)
- 3000 tasks: <150ms ✅ (warning threshold)

### 2. Service-Level Benchmarks

**File:** `service-sorting.bench.ts`

**What it tests:**
- All 4 sort types (priority, dueDate, createdAt, importance)
- Service-level overhead (enrichment, conversions)
- Filter + sort combinations (1, 2, 3 filters)

**Expected Results:**
- All sort types at 2000 tasks: <100ms
- Filter + 1 condition: <100ms
- Filter + 2 conditions: <110ms
- Filter + 3 conditions: <120ms

### 3. Stability Benchmarks

**File:** `stability.bench.ts`

**What it tests:**
- Performance consistency over 100 operations
- No performance degradation over time
- Variance and outlier detection
- High-frequency operation handling

**Expected Results:**
- Variance: <10% ✅
- Outliers: <5% ✅
- No degradation (1st vs 100th op): <20% ✅

### 4. Memory Profiling

**File:** `memory.bench.ts`

**What it tests:**
- Heap allocation growth
- Memory leaks detection
- Garbage collection behavior
- GC pause time

**Running with Memory Monitoring:**
```bash
# Enable garbage collection tracking
node --expose-gc node_modules/.bin/vitest \
  src/modules/task/application/__tests__/benchmarks/memory.bench.ts
```

**Expected Results:**
- Peak heap increase (2000 tasks): <50MB ✅
- No memory leaks ✅
- Average GC pause: <10ms ✅
- Max GC pause: <50ms ✅

### 5. E2E HTTP Endpoint Benchmarks

**File:** `http-endpoint.bench.ts`

**What it tests:**
- Full HTTP request/response cycle
- Controller overhead
- Response serialization
- Scaling with task count

**Expected Results:**
- 100 tasks: <50ms ✅
- 500 tasks: <100ms ✅
- 1000 tasks: <150ms ✅
- 2000 tasks: <200ms ✅

### 6. Database vs Sorting Analysis

**File:** `db-vs-sorting.bench.ts`

**What it tests:**
- Separates DB fetch time from sorting time
- Identifies performance bottleneck
- Shows where optimization should focus
- Verifies sorting is not the bottleneck

**Expected Results:**
- Database: 65-95% of total time
- Sorting: 5-35% of total time
- DB is clear bottleneck (expected) ✅

## Interpreting Results

### Performance Metrics Explained

**Average (Avg):** Mean execution time across all iterations
- Use this for overall performance assessment
- Target metrics are based on averages

**Median:** Middle value when all times are sorted
- Less sensitive to outliers than mean
- Good for "typical" performance

**P95 / P99:** 95th/99th percentile
- P95 = worst case for 95% of requests
- P99 = extreme case (worst 1%)
- Important for user experience (users notice P95+)

**StdDev (Standard Deviation):** Measure of consistency
- Lower is better (more consistent)
- Should be <10% of average for good stability

**Variance:** StdDev as percentage
- Target: <10% for stability

### Pass/Fail Criteria

```bash
# All tests should pass (exit code 0)
✅ PASS:  avg < target AND variance < 10%
❌ FAIL:  avg > target OR major variance > 15%
⚠️  WARN: avg near target (75-90% of limit) - monitor

# Specific targets by task count (priority sort)
100 tasks:   avg < 20ms    (current: 2-5ms) ✅
500 tasks:   avg < 40ms    (current: 8-15ms) ✅
1000 tasks:  avg < 70ms    (current: 15-25ms) ✅
2000 tasks:  avg < 100ms   (current: 35-55ms) ✅ TARGET
3000 tasks:  avg < 150ms   (current: 60-95ms) ✅
```

## Troubleshooting

### Tests Timeout

**Problem:** Benchmark tests take too long or timeout

**Solutions:**
1. Reduce iterations: `it('test', async () => { ... }, 30000)` (in test file)
2. Reduce task count in test data
3. Close other applications
4. Check system load: `Task Manager` → Performance tab

### Wide Variance (>15%)

**Problem:** Results vary significantly between runs

**Solutions:**
1. Close browser tabs and other applications
2. Run tests multiple times to warm up JIT
3. Ensure no background indexing/antivirus scanning
4. Check thermal throttling (Task Manager → Performance)
5. Increase iterations for more stable average

### Memory Test Skipped

**Problem:** "Skipping memory test - run with --expose-gc"

**Solution:**
```bash
# Proper command for memory tests
node --expose-gc node_modules/.bin/vitest \
  src/modules/task/application/__tests__/benchmarks/memory.bench.ts
```

### Some Benchmarks Fail

**Problem:** One or more benchmark assertions fail

**Check:**
1. Review the error message - it shows which metric failed
2. Compare against baseline: did a recent change cause this?
3. Run `pnpm nx test application-server` to check for regressions
4. Verify no sorting/filtering code was changed unintentionally

## Optimization Workflow

If performance degrades:

### 1. Identify Bottleneck

```bash
# Run database vs sorting analysis
pnpm nx test application-server --testPathPattern="db-vs-sorting.bench"

# Is it DB? (65-95% typical) → Optimize database layer
# Is it sorting? (<35% typical) → Sorting code needs review
```

### 2. Profile the Code

```bash
# Node.js profiling
node --prof src/modules/task/application/__tests__/benchmarks/sort-algorithm.bench.ts
node --prof-process isolate-*.log > results.txt

# Or use Chrome DevTools
# ... (more advanced profiling setup)
```

### 3. Implement Optimization

See [PERFORMANCE-ANALYSIS-REPORT.md](PERFORMANCE-ANALYSIS-REPORT.md) for optimization options:
- Database-level sorting
- Pagination
- Caching
- Lazy sorting
- Algorithm optimization

### 4. Re-run Benchmarks

```bash
# Verify improvement
pnpm nx test application-server --testPathPattern="bench"

# Check for regressions
pnpm nx test application-server
```

### 5. Update Baseline

```bash
# If optimization is successful, update baseline
# (Keep current numbers as reference for future comparison)

# Document findings in PERFORMANCE-ANALYSIS-REPORT.md
```

## CI/CD Integration

### Automated Performance Checks

Benchmarks run automatically on every PR that touches:
- `apps/api/src/modules/task/**`
- `packages/contracts/src/modules/task/**`

### Viewing Results

1. Go to PR → Checks tab
2. Look for "Performance Regression Check" job
3. Click "Details" to see full output
4. Check PR comments for performance summary

### Skipping Performance Checks

```bash
# In PR description (not recommended)
[skip-perf-check]
```

## Performance Regression Prevention

### Best Practices

1. **Run benchmarks before committing:**
   ```bash
   pnpm nx test application-server --testPathPattern="bench"
   ```

2. **Monitor key metrics in production:**
   - P95/P99 response time for `/task-templates`
   - Heap memory usage trends
   - Task count growth per account

3. **Alert thresholds:**
   - If avg > target × 1.1 (10% regression) → Investigate
   - If avg > target × 1.2 (20% regression) → Block deployment
   - If memory growth > 50MB → Review for leaks

4. **When optimizing:**
   - Measure before + after
   - Run full test suite to catch regressions
   - Document findings
   - Share results with team

## Reference Material

### Related Stories
- [Story 2.1: In-Memory Sorting](../../_bmad-output/implementation-artifacts/2-1-implement-task-list-in-memory-sorting-logic-get-tasks-with-priority-sorting.md)
- [Story 2.5: Backend API Parameters](../../_bmad-output/implementation-artifacts/2-5-support-sorting-parameters-and-filter-options-backend-extension.md)

### Documentation
- [PERFORMANCE-ANALYSIS-REPORT.md](PERFORMANCE-ANALYSIS-REPORT.md) - Baseline metrics and recommendations
- [API-SORTING-FILTERING.md](API-SORTING-FILTERING.md) - API documentation
- [Vitest Documentation](https://vitest.dev/) - Test framework
- [Node.js Performance API](https://nodejs.org/en/docs/guides/simple-profiling/) - Profiling guide

## FAQ

**Q: How often should I run benchmarks?**  
A: Before committing changes to sorting/filtering. Automatically runs on PRs. Run manually when investigating performance issues.

**Q: What if benchmarks pass locally but fail in CI?**  
A: CI runs on shared infrastructure with variable performance. Check if other PRs are running concurrently. Results should be consistent within 20-30%.

**Q: Can I optimize sorting further?**  
A: Current implementation is O(n log n) which is optimal for comparison-based sorting. Gains would be <10%. Focus on DB optimization if needed.

**Q: What task count should I plan for?**  
A: Current targets support 2000 tasks comfortably. At 5000 tasks, consider pagination. Above 10000, definitely need DB-level optimization.

**Q: How do I compare against a baseline?**  
A: Save baseline results:
```bash
# Run once and save
pnpm nx test application-server --testPathPattern="bench" > baseline.txt

# Run again and diff
pnpm nx test application-server --testPathPattern="bench" > current.txt
diff baseline.txt current.txt
```

**Q: Is there a GUI for viewing benchmark results?**  
A: Currently results are in console output. For visual dashboards, consider tools like:
- Grafana (metrics visualization)
- DataDog (APM)
- Custom dashboard with historical data

## Support

For questions about performance testing:
1. Check this guide first
2. Review [PERFORMANCE-ANALYSIS-REPORT.md](PERFORMANCE-ANALYSIS-REPORT.md)
3. Check Story 2.6 acceptance criteria
4. Ask in team channel with benchmark results
