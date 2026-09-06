#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, validateRunSummary, validateTimingReport } from './lib/contracts.mjs';

const METRICS = Object.freeze([
  ['setupMs', false],
  ['executionMs', false],
  ['longestLaneMs', false],
  ['wallClockMs', false],
  ['runnerMinutes', true],
]);

function percentile(values, probability) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function laneSignature(summary) {
  return summary.lanes
    .map((lane) => lane.lane)
    .sort()
    .join(',');
}

function sampleFromSummary(summary) {
  const timing = summary.timing;
  return {
    runId: summary.provenance.runId ?? null,
    commit: summary.commit,
    lanes: summary.lanes.map((lane) => lane.lane).sort(),
    setupMs: timing.setupMs,
    executionMs: timing.executionMs,
    longestLaneMs: timing.longestLaneMs,
    wallClockMs: timing.wallClockMs ?? null,
    runnerMinutes: timing.runnerMinutes ?? null,
  };
}

export function compareTimingSamples({ samples, profile, minimumSamples = 5 }) {
  if (!Array.isArray(samples) || samples.length < minimumSamples) {
    throw new Error(`at least ${minimumSamples} comparable timing runs are required`);
  }
  if (!profile || typeof profile !== 'string') throw new Error('timing profile is required');
  for (const sample of samples) {
    if (!sample.commit || typeof sample.commit !== 'string')
      throw new Error('timing sample commit is required');
    if (!Array.isArray(sample.lanes) || sample.lanes.some((lane) => typeof lane !== 'string'))
      throw new Error('timing sample lanes are required');
    for (const field of ['setupMs', 'executionMs', 'longestLaneMs']) {
      if (!Number.isFinite(sample[field]) || sample[field] < 0)
        throw new Error(`timing sample ${field} must be non-negative`);
    }
    for (const field of ['wallClockMs', 'runnerMinutes']) {
      if (sample[field] !== null && (!Number.isFinite(sample[field]) || sample[field] < 0))
        throw new Error(`timing sample ${field} must be non-negative or null`);
    }
  }
  const signatures = new Set(samples.map((sample) => [...sample.lanes].sort().join(',')));
  if (signatures.size !== 1) throw new Error('timing runs do not have the same enabled lane set');
  const metrics = Object.fromEntries(
    METRICS.map(([field, allowNull]) => {
      const values = samples
        .map((sample) => sample[field])
        .filter((value) => Number.isFinite(value));
      if (values.length === 0 && allowNull) return [field, { p50: null, p95: null, samples: 0 }];
      if (values.length !== samples.length) {
        throw new Error(`timing metric ${field} is missing from comparable runs`);
      }
      return [
        field,
        {
          p50: percentile(values, 0.5),
          p95: percentile(values, 0.95),
          samples: values.length,
        },
      ];
    }),
  );
  const report = {
    kind: 'timing-report-v1',
    version: 1,
    profile,
    sampleCount: samples.length,
    samples,
    metrics,
    provenance: {
      generator: 'ci-cd-platform-v2/compare-timings@1',
      sourceRuns: samples.map((sample) => sample.runId).filter(Boolean),
    },
  };
  report.digest = digest(report);
  validateTimingReport(report);
  return report;
}

export function compareTimings({ summaries, profile, minimumSamples = 5 }) {
  if (!Array.isArray(summaries) || summaries.length < minimumSamples) {
    throw new Error(`at least ${minimumSamples} comparable timing runs are required`);
  }
  summaries.forEach(validateRunSummary);
  const signatures = new Set(summaries.map(laneSignature));
  if (signatures.size !== 1) throw new Error('timing runs do not have the same enabled lane set');
  return compareTimingSamples({
    samples: summaries.map(sampleFromSummary),
    profile,
    minimumSamples,
  });
}

async function inputFiles(input) {
  const entries = await readdir(input, { withFileTypes: true }).catch((error) => {
    if (!['ENOENT', 'ENOTDIR'].includes(error?.code)) throw error;
    return null;
  });
  if (!entries) return [input];
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(input, entry.name))
    .sort();
}

async function main() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    args.set(process.argv[index].replace(/^--/u, ''), process.argv[index + 1]);
  }
  const input = path.resolve(args.get('input') ?? 'reports/ci-cd-platform/timing-runs');
  const output = path.resolve(args.get('output') ?? 'reports/ci-cd-platform/timing-report-v1.json');
  const profile = args.get('profile');
  const minimumSamples = Number.parseInt(args.get('minimum-samples') ?? '5', 10);
  const summaries = [];
  for (const file of await inputFiles(input))
    summaries.push(JSON.parse(await readFile(file, 'utf8')));
  const report = compareTimings({ summaries, profile, minimumSamples });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      { path: output, profile, sampleCount: report.sampleCount, digest: report.digest },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`[timing] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
