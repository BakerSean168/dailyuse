import { describe, expect, it } from 'vitest';
import { InMemoryOAuthStateStore } from '../in-memory-oauth-state-store';

describe('InMemoryOAuthStateStore', () => {
  it('issues and consumes state with matching provider', () => {
    const store = new InMemoryOAuthStateStore();
    const issued = store.issue({ provider: 'Github', redirectUri: 'http://localhost/cb' });
    expect(issued.state).toBeTruthy();
    expect(issued.codeChallenge).toBeTruthy();

    const consumed = store.consume(issued.state, 'Github');
    expect(consumed?.codeVerifier).toBe(issued.codeVerifier);
    expect(consumed?.redirectUri).toBe('http://localhost/cb');
    expect(store.consume(issued.state, 'Github')).toBeNull();
  });

  it('rejects provider mismatch', () => {
    const store = new InMemoryOAuthStateStore();
    const issued = store.issue({ provider: 'Github' });
    expect(store.consume(issued.state, 'Google')).toBeNull();
  });
});
