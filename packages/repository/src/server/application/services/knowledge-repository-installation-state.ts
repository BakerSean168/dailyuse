import { createHash, randomBytes } from 'node:crypto';

const STATE_VERSION = 'mfi1';
const ROUTE_KEY_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

export interface KnowledgeRepositoryInstallationStateEnvelope {
  state: string;
  stateHash: string;
  routeKey: string;
}

export function isValidKnowledgeRepositoryInstallationRouteKey(routeKey: string): boolean {
  return ROUTE_KEY_RE.test(routeKey);
}

export function createKnowledgeRepositoryInstallationState(
  routeKey: string,
): KnowledgeRepositoryInstallationStateEnvelope {
  if (!isValidKnowledgeRepositoryInstallationRouteKey(routeKey)) {
    throw new Error('Invalid knowledge repository installation route key');
  }
  const nonce = randomBytes(32).toString('base64url');
  const state = `${STATE_VERSION}.${routeKey}.${nonce}`;
  return { state, stateHash: hashKnowledgeRepositoryInstallationState(state), routeKey };
}

export function parseKnowledgeRepositoryInstallationStateRouteKey(state: string): string | null {
  const [version, routeKey, nonce, ...extra] = state.split('.');
  if (
    version !== STATE_VERSION ||
    !routeKey ||
    !isValidKnowledgeRepositoryInstallationRouteKey(routeKey) ||
    !nonce ||
    nonce.length < 32 ||
    extra.length > 0
  ) {
    return null;
  }
  return routeKey;
}

export function hashKnowledgeRepositoryInstallationState(state: string): string {
  return createHash('sha256').update(state, 'utf8').digest('hex');
}
