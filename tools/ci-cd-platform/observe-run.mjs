#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  digest,
  validateDeliveryManifest,
  validateLaneSummary,
  validateRunSummary,
} from './lib/contracts.mjs';

async function findJsonFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findJsonFiles(file)));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(file);
  }
  return files.sort();
}

export async function observeRun({ manifest, evidenceDir, output }) {
  validateDeliveryManifest(manifest);
  const summaries = [];
  for (const file of await findJsonFiles(evidenceDir)) {
    let value;
    try {
      value = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue;
    }
    if (value?.kind !== 'lane-summary-v1') continue;
    validateLaneSummary(value);
    if (value.commit !== manifest.commit || value.manifestDigest !== manifest.digest) {
      throw new Error(`Lane summary provenance does not match manifest: ${file}`);
    }
    summaries.push({ file, value });
  }
  const byLane = new Map();
  for (const summary of summaries) {
    const values = byLane.get(summary.value.lane) ?? [];
    values.push(summary);
    byLane.set(summary.value.lane, values);
  }
  const enabled = Object.entries(manifest.lanes)
    .filter(([, isEnabled]) => isEnabled)
    .map(([lane]) => lane);
  const missing = enabled.filter((lane) => !byLane.has(lane));
  const failures = summaries.filter(({ value }) => value.status !== 'success');
  const startedAt = process.env.DELIVERY_RUN_STARTED_AT
    ? Date.parse(process.env.DELIVERY_RUN_STARTED_AT)
    : Number.NaN;
  const wallClockMs = Number.isFinite(startedAt) ? Math.max(0, Date.now() - startedAt) : null;
  const runnerMinutesValue = Number(process.env.DELIVERY_RUNNER_MINUTES);
  const runnerMinutes =
    Number.isFinite(runnerMinutesValue) && runnerMinutesValue >= 0 ? runnerMinutesValue : null;
  const summary = {
    kind: 'run-summary-v1',
    version: 1,
    commit: manifest.commit,
    manifestDigest: manifest.digest,
    status: failures.length > 0 ? 'failure' : missing.length > 0 ? 'incomplete' : 'success',
    lanes: [...byLane.entries()]
      .map(([lane, values]) => ({
        lane,
        status: values.some(({ value }) => value.status !== 'success') ? 'failure' : 'success',
        timing: {
          setupMs: values.reduce((total, { value }) => total + (value.timing.setupMs ?? 0), 0),
          executionMs: values.reduce(
            (total, { value }) => total + (value.timing.executionMs ?? 0),
            0,
          ),
        },
        failures: values.flatMap(({ value }) => value.failures),
        evidence: values.map(({ file }) => file),
      }))
      .sort((left, right) => left.lane.localeCompare(right.lane)),
    missingLanes: missing,
    timing: {
      setupMs: summaries.reduce((total, { value }) => total + (value.timing.setupMs ?? 0), 0),
      executionMs: summaries.reduce(
        (total, { value }) => total + (value.timing.executionMs ?? 0),
        0,
      ),
      longestLaneMs: Math.max(0, ...summaries.map(({ value }) => value.timing.executionMs ?? 0)),
      wallClockMs,
      runnerMinutes,
    },
    cache: summaries.map(({ value }) => ({ lane: value.lane, cache: value.cache })),
    failures: failures.flatMap(({ value }) => value.failures),
    provenance: {
      generator: 'ci-cd-platform-v2/observe-run@1',
      runner: process.env.RUNNER_OS ?? process.platform,
      runId: process.env.GITHUB_RUN_ID ?? null,
    },
  };
  summary.digest = digest(summary);
  validateRunSummary(summary);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    args.set(process.argv[index].replace(/^--/u, ''), process.argv[index + 1]);
  }
  const manifestPath = path.resolve(args.get('manifest') ?? 'scope/delivery-manifest-v1.json');
  const evidenceDir = path.resolve(args.get('evidence') ?? 'reports/run-evidence');
  const output = path.resolve(args.get('output') ?? 'reports/ci-cd-platform/run-summary-v1.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const summary = await observeRun({ manifest, evidenceDir, output });
  console.log(JSON.stringify({ path: output, status: summary.status }, null, 2));
  if (summary.status !== 'success') process.exitCode = 1;
}
