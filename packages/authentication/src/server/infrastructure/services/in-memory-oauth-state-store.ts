import { createHash, randomBytes } from 'node:crypto';

export interface IssuedOAuthState {
  readonly state: string;
  readonly codeVerifier: string;
  readonly codeChallenge: string;
  readonly provider: string;
  readonly redirectUri?: string;
}

export interface ConsumedOAuthState {
  readonly provider: string;
  readonly codeVerifier: string;
  readonly redirectUri?: string;
}

interface StoredOAuthState {
  readonly provider: string;
  readonly codeVerifier: string;
  readonly redirectUri?: string;
  readonly expiresAt: number;
}

const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * In-memory OAuth state + PKCE verifier store for single-instance / test runtimes.
 * 单实例与测试用的内存 OAuth state + PKCE verifier 存储。
 */
export class InMemoryOAuthStateStore {
  private readonly entries = new Map<string, StoredOAuthState>();

  issue(params: {
    provider: string;
    redirectUri?: string;
  }): IssuedOAuthState {
    this.cleanup();
    const state = randomBytes(24).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    this.entries.set(state, {
      provider: params.provider,
      codeVerifier,
      redirectUri: params.redirectUri,
      expiresAt: Date.now() + STATE_TTL_MS,
    });
    return {
      state,
      codeVerifier,
      codeChallenge,
      provider: params.provider,
      redirectUri: params.redirectUri,
    };
  }

  consume(state: string, provider: string): ConsumedOAuthState | null {
    this.cleanup();
    const stored = this.entries.get(state);
    if (!stored) {
      return null;
    }
    this.entries.delete(state);
    if (stored.expiresAt < Date.now()) {
      return null;
    }
    if (stored.provider !== provider) {
      return null;
    }
    return {
      provider: stored.provider,
      codeVerifier: stored.codeVerifier,
      redirectUri: stored.redirectUri,
    };
  }

  clearForTests(): void {
    this.entries.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.entries) {
      if (value.expiresAt < now) {
        this.entries.delete(key);
      }
    }
  }
}
