#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { compareTimingSamples } from './compare-timings.mjs';
import { digest } from './lib/contracts.mjs';
import { validateQualityShadowSample } from './quality-shadow.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(`Quality shadow comparison invalid: ${message}`);
}

export function compareQualityShadow({ samples, minimumSamples = 5 }) {
  if (!Array.isArray(samples) || samples.length < minimumSamples) {
    throw new Error(`at least ${minimumSamples} paired quality shadow samples are required`);
  }
  samples.forEach(validateQualityShadowSample);
  const first = samples[0];
  assert(
    samples.every((sample) => sample.status === 'success'),
    'every paired sample must succeed',
  );
  assert(
    samples.every(
      (sample) =>
        sample.workload.name === first.workload.name &&
        sample.workload.base === first.workload.base &&
        sample.workload.head === first.workload.head,
    ),
    'all samples must use the same workload',
  );
  assert(
    new Set(samples.map((sample) => sample.runId)).size === samples.length,
    'run ids must be unique',
  );

  const split = compareTimingSamples({
    samples: samples.map((sample) => sample.split),
    profile: 'quality-split',
    minimumSamples,
  });
  const consolidated = compareTimingSamples({
    samples: samples.map((sample) => sample.consolidated),
    profile: 'quality-consolidated',
    minimumSamples,
  });
  const metricDelta = Object.fromEntries(
    ['setupMs', 'executionMs', 'longestLaneMs', 'wallClockMs', 'runnerMinutes'].map((metric) => [
      metric,
      {
        p50: consolidated.metrics[metric].p50 - split.metrics[metric].p50,
        p95: consolidated.metrics[metric].p95 - split.metrics[metric].p95,
      },
    ]),
  );
  const wallNonRegressing = metricDelta.wallClockMs.p50 <= 0 && metricDelta.wallClockMs.p95 <= 0;
  const runnerImproves = metricDelta.runnerMinutes.p50 < 0 && metricDelta.runnerMinutes.p95 < 0;
  const decision = wallNonRegressing && runnerImproves ? 'promote-consolidated' : 'retain-split';
  const report = {
    kind: 'quality-shadow-report-v1',
    version: 1,
    workload: first.workload,
    sampleCount: samples.length,
    decision,
    criteria: { wallNonRegressing, runnerImproves, childParity: true },
    split,
    consolidated,
    delta: metricDelta,
    provenance: {
      generator: 'ci-cd-platform-v3/compare-quality-shadow@1',
      sourceRuns: samples.map((sample) => sample.runId),
      controlPlaneShas: [...new Set(samples.map((sample) => sample.controlPlaneSha))],
    },
  };
  report.digest = digest(report);
  return report;
}

async function readSamples(input) {
  const entries = await readdir(input, { withFileTypes: true });
  const values = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const value = JSON.parse(await readFile(path.join(input, entry.name), 'utf8'));
    if (value?.kind === 'quality-shadow-sample-v1') values.push(value);
  }
  return values.sort((left, right) => left.runId.localeCompare(right.runId));
}

async function main() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2)
    args.set(process.argv[index].replace(/^--/u, ''), process.argv[index + 1]);
  const input = path.resolve(args.get('input') ?? 'reports/ci-cd-platform/quality-shadow-samples');
  const output = path.resolve(
    args.get('output') ?? 'reports/ci-cd-platform/quality-shadow-report-v1.json',
  );
  const minimumSamples = Number.parseInt(args.get('minimum-samples') ?? '5', 10);
  const report = compareQualityShadow({ samples: await readSamples(input), minimumSamples });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      { output, decision: report.decision, sampleCount: report.sampleCount, delta: report.delta },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      `[quality-shadow-compare] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
