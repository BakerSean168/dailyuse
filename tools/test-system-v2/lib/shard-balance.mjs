export function balanceShards(specs, shardCount = 4) {
  const shards = Array.from({ length: shardCount }, (_, index) => ({
    index,
    totalMs: 0,
    specs: [],
  }));
  for (const spec of [...specs].sort(
    (a, b) => b.durationMs - a.durationMs || a.path.localeCompare(b.path),
  )) {
    const shard = shards.reduce((least, current) =>
      current.totalMs < least.totalMs ? current : least,
    );
    shard.specs.push(spec.path);
    shard.totalMs += spec.durationMs;
  }
  return shards;
}
