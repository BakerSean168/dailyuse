import { randomBytes } from 'node:crypto';
import type {
  IKnowledgeRepositoryInstallationStateStore,
  KnowledgeRepositoryInstallationState,
} from '../../application/ports/github-app-client.port';

interface StateRecord extends KnowledgeRepositoryInstallationState {
  consumed: boolean;
}

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export class InMemoryKnowledgeRepositoryInstallationStateStore implements IKnowledgeRepositoryInstallationStateStore {
  private readonly states = new Map<string, StateRecord>();
  private readonly claims = new Map<string, number>();

  constructor(
    private readonly ttlMs = DEFAULT_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  issue(identityId: string, returnUrl?: string): { state: string; expiresAt: number } {
    this.prune();
    const state = randomBytes(32).toString('base64url');
    const expiresAt = this.now() + this.ttlMs;
    this.states.set(state, {
      identityId,
      returnUrl: returnUrl ?? null,
      expiresAt,
      consumed: false,
    });
    return { state, expiresAt };
  }

  consume(state: string): KnowledgeRepositoryInstallationState | null {
    this.prune();
    const record = this.states.get(state);
    if (!record || record.consumed || record.expiresAt <= this.now()) return null;
    record.consumed = true;
    return {
      identityId: record.identityId,
      returnUrl: record.returnUrl,
      expiresAt: record.expiresAt,
    };
  }

  claimInstallation(identityId: string, installationId: string): void {
    this.claims.set(this.claimKey(identityId, installationId), this.now() + this.ttlMs);
  }

  hasInstallationClaim(identityId: string, installationId: string): boolean {
    this.prune();
    return (this.claims.get(this.claimKey(identityId, installationId)) ?? 0) > this.now();
  }

  releaseInstallationClaim(identityId: string, installationId: string): void {
    this.claims.delete(this.claimKey(identityId, installationId));
  }

  private claimKey(identityId: string, installationId: string): string {
    return `${identityId}:${installationId}`;
  }

  private prune(): void {
    const now = this.now();
    for (const [state, record] of this.states) {
      if (record.expiresAt <= now) this.states.delete(state);
    }
    for (const [claim, expiresAt] of this.claims) {
      if (expiresAt <= now) this.claims.delete(claim);
    }
  }
}
