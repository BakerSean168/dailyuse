#!/usr/bin/env node
/* eslint-disable @nx/enforce-module-boundaries -- governance tool validates the Web-owned manifest */
import { readFile, writeFile } from 'node:fs/promises';
import { WEB_FLOW_SPECS } from '../../apps/web/web-flow-specs.mjs';
import { balanceShards } from './lib/shard-balance.mjs';

const durationsPath = 'reports/test-system-v2/web-spec-durations.json';
const historical = JSON.parse(await readFile(durationsPath, 'utf8').catch(() => '{}'));
const specs = await Promise.all(
  WEB_FLOW_SPECS.map(async (spec) => {
    const source = await readFile(`apps/web/e2e/${spec}`, 'utf8');
    const fallbackWeight =
      Math.max(1, [...source.matchAll(/\btest(?:\.\w+)?\s*\(/g)].length) * 60_000;
    return { path: spec, durationMs: historical[spec]?.durationMs ?? fallbackWeight };
  }),
);
const shards = balanceShards(specs, 4);
const output = {
  version: 1,
  durationSource: Object.keys(historical).length
    ? durationsPath
    : 'test-count fallback; replace from first V2 Actions JSON',
  shards: shards.map((shard) => ({
    shard: shard.index + 1,
    estimatedDurationMs: shard.totalMs,
    specs: shard.specs,
  })),
};
await writeFile('tools/test-system-v2/web-shards.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(output.shards.map((shard) => `${shard.shard}:${shard.estimatedDurationMs}`).join(' '));
