import { describe, expect, it } from 'vitest';
import type {
  IKnowledgeRepositoryLeaseRepository,
  KnowledgeRepositoryLeaseRequest,
} from '../ports/knowledge-repository-lease.repository';
import {
  KnowledgeRepositoryLeaseCoordinator,
  KnowledgeRepositoryLeaseLostError,
} from './knowledge-repository-lease-coordinator';

interface LeaseRow {
  ownerToken: string;
  expiresAt: number;
}

class MemoryLeaseRepository implements IKnowledgeRepositoryLeaseRepository {
  readonly rows = new Map<string, LeaseRow>();

  async tryAcquire(request: KnowledgeRepositoryLeaseRequest): Promise<boolean> {
    const current = this.rows.get(request.leaseKey);
    if (current && current.expiresAt > request.now) return false;
    this.rows.set(request.leaseKey, {
      ownerToken: request.ownerToken,
      expiresAt: request.expiresAt,
    });
    return true;
  }

  async renew(request: KnowledgeRepositoryLeaseRequest): Promise<boolean> {
    const current = this.rows.get(request.leaseKey);
    if (!current || current.ownerToken !== request.ownerToken || current.expiresAt <= request.now) {
      return false;
    }
    current.expiresAt = request.expiresAt;
    return true;
  }

  async release(leaseKey: string, ownerToken: string): Promise<void> {
    if (this.rows.get(leaseKey)?.ownerToken === ownerToken) this.rows.delete(leaseKey);
  }
}

describe('KnowledgeRepositoryLeaseCoordinator', () => {
  it('allows only one live owner for a lease key and releases it after completion', async () => {
    const repository = new MemoryLeaseRepository();
    const first = new KnowledgeRepositoryLeaseCoordinator(repository);
    const second = new KnowledgeRepositoryLeaseCoordinator(repository);
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted!: () => void;
    const firstStart = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });

    const firstRun = first.execute('connection:1', async () => {
      firstStarted();
      await firstGate;
      return 'first';
    });
    await firstStart;

    await expect(second.execute('connection:1', async () => 'second')).resolves.toEqual({
      acquired: false,
    });
    releaseFirst();
    await expect(firstRun).resolves.toEqual({ acquired: true, value: 'first' });
    await expect(second.execute('connection:1', async () => 'second')).resolves.toEqual({
      acquired: true,
      value: 'second',
    });
  });

  it('fences an expired owner after another instance takes over', async () => {
    let now = 1_000;
    const repository = new MemoryLeaseRepository();
    const options = { now: () => now, ttlMs: 1_000, renewalIntervalMs: 500 };
    const first = new KnowledgeRepositoryLeaseCoordinator(repository, options);
    const second = new KnowledgeRepositoryLeaseCoordinator(repository, options);
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted!: () => void;
    const firstStart = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });

    const firstRun = first.execute('connection:1', async (guard) => {
      firstStarted();
      await firstGate;
      await guard.ensureHeld();
    });
    await firstStart;
    now = 2_001;

    await expect(second.execute('connection:1', async () => 'replacement')).resolves.toEqual({
      acquired: true,
      value: 'replacement',
    });
    releaseFirst();
    await expect(firstRun).rejects.toBeInstanceOf(KnowledgeRepositoryLeaseLostError);
  });
});
