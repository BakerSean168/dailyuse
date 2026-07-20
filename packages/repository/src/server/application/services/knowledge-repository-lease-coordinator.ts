import { randomUUID } from 'node:crypto';
import type {
  IKnowledgeRepositoryLeaseRepository,
  KnowledgeRepositoryLeaseRequest,
} from '../ports/knowledge-repository-lease.repository';

export const KNOWLEDGE_REPOSITORY_LEASE_TTL_MS = 60_000;
export const KNOWLEDGE_REPOSITORY_LEASE_RENEWAL_INTERVAL_MS = 20_000;

export class KnowledgeRepositoryLeaseLostError extends Error {
  constructor() {
    super('Knowledge repository lease ownership was lost');
    this.name = 'KnowledgeRepositoryLeaseLostError';
  }
}

export interface KnowledgeRepositoryLeaseGuard {
  ensureHeld(): Promise<void>;
}

export interface KnowledgeRepositoryLeaseCoordinatorOptions {
  now?: () => number;
  ttlMs?: number;
  renewalIntervalMs?: number;
}

export class KnowledgeRepositoryLeaseCoordinator {
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly renewalIntervalMs: number;

  constructor(
    private readonly repository: IKnowledgeRepositoryLeaseRepository | null | undefined,
    options: KnowledgeRepositoryLeaseCoordinatorOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.ttlMs = Math.max(1_000, options.ttlMs ?? KNOWLEDGE_REPOSITORY_LEASE_TTL_MS);
    this.renewalIntervalMs = Math.max(
      250,
      Math.min(
        options.renewalIntervalMs ?? KNOWLEDGE_REPOSITORY_LEASE_RENEWAL_INTERVAL_MS,
        Math.floor(this.ttlMs / 2),
      ),
    );
  }

  async execute<T>(
    leaseKey: string,
    task: (guard: KnowledgeRepositoryLeaseGuard) => Promise<T>,
  ): Promise<{ acquired: boolean; value?: T }> {
    if (!this.repository) {
      return { acquired: true, value: await task({ ensureHeld: async () => undefined }) };
    }

    const ownerToken = randomUUID();
    const request = (): KnowledgeRepositoryLeaseRequest => {
      const now = this.now();
      return { leaseKey, ownerToken, now, expiresAt: now + this.ttlMs };
    };
    if (!(await this.repository.tryAcquire(request()))) return { acquired: false };

    let held = true;
    let renewal: Promise<void> | null = null;
    const renew = async (): Promise<void> => {
      if (!held) return;
      renewal ??= this.repository!.renew(request())
        .then((renewed) => {
          held = renewed;
        })
        .catch(() => {
          held = false;
        })
        .finally(() => {
          renewal = null;
        });
      await renewal;
    };
    const timer = setInterval(() => void renew(), this.renewalIntervalMs);
    timer.unref?.();
    const guard: KnowledgeRepositoryLeaseGuard = {
      ensureHeld: async () => {
        await renew();
        if (!held) throw new KnowledgeRepositoryLeaseLostError();
      },
    };
    try {
      return { acquired: true, value: await task(guard) };
    } finally {
      clearInterval(timer);
      await renewal;
      held = false;
      await this.repository.release(leaseKey, ownerToken).catch(() => undefined);
    }
  }
}

export function knowledgeRepositoryConnectionLeaseKey(connectionId: string): string {
  return `knowledge-connection:${connectionId}`;
}

export function knowledgeRepositoryDeliveryLeaseKey(deliveryId: string): string {
  return `knowledge-delivery:${deliveryId}`;
}
