/**
 * Resolve IVerificationChallengeStore: memory (default) | redis.
 *
 * Never infer from NODE_ENV alone — local-docker is production + single instance.
 * Multi-instance prod should set AUTH_CHALLENGE_STORE=redis and inject a Redis client.
 */

import type { IVerificationChallengeStore } from '../../domain';
import { InMemoryVerificationChallengeStore } from './in-memory-verification-challenge-store';
import {
  RedisVerificationChallengeStore,
  type RedisChallengeClient,
} from './redis-verification-challenge-store';

export type ChallengeStoreBackend = 'memory' | 'redis';

export type ChallengeStoreEnv = {
  AUTH_CHALLENGE_STORE?: string;
};

export type CreateVerificationChallengeStoreOptions = {
  env?: ChallengeStoreEnv;
  /** Required when backend resolves to redis. */
  redis?: RedisChallengeClient;
  /** Override for tests. */
  store?: IVerificationChallengeStore;
  keyPrefix?: string;
};

export class IncompleteRedisChallengeConfigError extends Error {
  readonly code = 'INCOMPLETE_REDIS_CHALLENGE_CONFIG';

  constructor() {
    super(
      'AUTH_CHALLENGE_STORE=redis requires a Redis client at composition root. ' +
        'Pass redis to createVerificationChallengeStore / createAuthenticationModule, ' +
        'or use AUTH_CHALLENGE_STORE=memory.',
    );
    this.name = 'IncompleteRedisChallengeConfigError';
  }
}

export function resolveChallengeStoreBackend(
  env: ChallengeStoreEnv = process.env,
): ChallengeStoreBackend {
  const raw = (env.AUTH_CHALLENGE_STORE ?? '').trim().toLowerCase();
  if (raw === 'redis') return 'redis';
  if (raw === 'memory') return 'memory';
  return 'memory';
}

/**
 * Factory: memory by default; redis when AUTH_CHALLENGE_STORE=redis and client provided.
 */
export function createVerificationChallengeStore(
  options: CreateVerificationChallengeStoreOptions = {},
): IVerificationChallengeStore {
  if (options.store) {
    return options.store;
  }

  const env = options.env ?? process.env;
  const backend = resolveChallengeStoreBackend(env);

  if (backend === 'redis') {
    if (!options.redis) {
      throw new IncompleteRedisChallengeConfigError();
    }
    return new RedisVerificationChallengeStore({
      redis: options.redis,
      keyPrefix: options.keyPrefix,
    });
  }

  return new InMemoryVerificationChallengeStore();
}
