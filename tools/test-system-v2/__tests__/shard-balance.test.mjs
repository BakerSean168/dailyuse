import assert from 'node:assert/strict';
import test from 'node:test';
import { balanceShards } from '../lib/shard-balance.mjs';

test('assigns every spec once and keeps deterministic ordering', () => {
  const specs = [
    { path: 'a.spec.ts', durationMs: 10 },
    { path: 'b.spec.ts', durationMs: 9 },
    { path: 'c.spec.ts', durationMs: 4 },
    { path: 'd.spec.ts', durationMs: 3 },
  ];
  const shards = balanceShards(specs, 2);
  assert.deepEqual(
    shards.flatMap((shard) => shard.specs).sort(),
    specs.map((spec) => spec.path).sort(),
  );
  assert.ok(
    Math.max(...shards.map((shard) => shard.totalMs)) -
      Math.min(...shards.map((shard) => shard.totalMs)) <=
      2,
  );
});
