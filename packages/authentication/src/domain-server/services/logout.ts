import type { LogoutReq } from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../repositories/i-auth-identity.repository';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/domain-shared/shared';
// Business exceptions
export class UserNotFoundForLogoutError extends Error {
  constructor(userId: string) {
    super(`User with ID [${userId}] not found for logout.`);
    this.name = 'UserNotFoundForLogoutError';
  }
}

export class NotLoggedInError extends Error {
  constructor() {
    super('User is not currently logged in.');
    this.name = 'NotLoggedInError';
  }
}

/**
 * Logout Domain Service.
 * Coordinates business rule checks, session cleanup, and state updates during logout.
 */
export class LogoutService {
  // Repository injected via constructor (Dependency Inversion Principle)
  constructor(private readonly identityRepo: IAuthIdentityRepository) {}

  /**
   * Core business: user logout.
   * @param req - Logout request data (contains user ID or session identifier)
   * @returns The identity aggregate root with updated state
   */
  public async logout(req: LogoutReq, ctx: Context): Promise<AuthIdentity> {
    const { identityId: rawId } = ctx;
    const identityId = rawId as IdentityId;

    // 1. Find user identity by ID
    const identity = await this.identityRepo.findById(identityId);
    if (!identity) {
      throw new UserNotFoundForLogoutError(identityId);
    }

    // 2. Verify the user is currently logged in
    // Domain service responsibility: cross-aggregate business rule validation
    if (!identity.isLoggedIn()) {
      throw new NotLoggedInError();
    }

    // 3. Clear login state, session, and tokens
    // Business operations executed within the aggregate root, modifying its state
    identity.clearLogin();

    // 4. Persist updated identity to the database
    // Domain events are implicitly processed and published in the repository's save method (e.g. LoggedOutEvent)
    await this.identityRepo.save(identity);

    return identity;
  }
}
