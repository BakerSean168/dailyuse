import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { WEB_FLOW_SPECS } from '../../../apps/web/web-flow-specs.mjs';

test('Web Flow shards have no omissions or duplicates', async () => {
  const manifest = JSON.parse(await readFile('tools/test-system-v2/web-shards.json', 'utf8'));
  const collected = manifest.shards.flatMap((shard) => shard.specs);
  assert.equal(collected.length, new Set(collected).size);
  assert.deepEqual([...collected].sort(), [...WEB_FLOW_SPECS].sort());
});
