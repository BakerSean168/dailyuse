/**
 * OAuth state + PKCE verifier store port.
 * OAuth state 与 PKCE verifier 存储端口。
 *
 * Application use cases depend on this port only; concrete stores live in
 * infrastructure (in-memory today, Redis later).
 * 应用层只依赖此端口；具体存储位于基础设施层（当前内存，后续 Redis）。
 */

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

export interface IOAuthStateStore {
  issue(params: {
    provider: string;
    redirectUri?: string;
  }): IssuedOAuthState;

  consume(state: string, provider: string): ConsumedOAuthState | null;
}
