import type { ServerHeldDataDisclosureDataV1 } from '@memoflow/contracts/data-portability';

/**
 * Read-only source for repository-cloud records already held by the server.
 * Implementations must use an explicit allowlist and must not return tokens,
 * encrypted credentials, private keys, or other replayable authorization.
 */
export interface ServerHeldDataDisclosureSource {
  readForIdentity(identityId: string): Promise<ServerHeldDataDisclosureDataV1>;
}
