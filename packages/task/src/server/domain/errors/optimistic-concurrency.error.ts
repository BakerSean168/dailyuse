/**
 * 乐观锁冲突错误（R2-5a）。
 * 聚合写入时期望版本与当前版本不一致 → 并发修改，调用方应重读重试或拒绝。
 */
export class OptimisticConcurrencyError extends Error {
  constructor(
    public readonly aggregateName: string,
    public readonly aggregateId: string,
    expectedVersion: number,
    currentVersion: number,
  ) {
    super(
      `${aggregateName} ${aggregateId} version conflict: expected ${expectedVersion}, current ${currentVersion}`,
    );
    this.name = 'OptimisticConcurrencyError';
  }
}
