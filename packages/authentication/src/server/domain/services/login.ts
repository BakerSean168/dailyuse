import type { LoginByEmailReq } from '@dailyuse/contracts/authentication';
import { AuthIdentity } from '../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../repositories/i-auth-identity.repository';
import type { IPasswordHasher } from '..';

// Business exceptions
export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User with identifier [${identifier}] not found.`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidPasswordError extends Error {
  constructor() {
    super('Invalid password provided.');
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Login Domain Service.
 * Coordinates business rule checks, identity verification, and credential validation during login.
 */
export class LoginService {
  // Repository injected via constructor (Dependency Inversion Principle)
  constructor(
    private readonly identityRepo: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  /**
   * Core business: email login.
   * @param req - Login request data (typically a DTO parsed by the controller)
   * @returns The verified identity aggregate root
   */
  public async loginByEmail(req: LoginByEmailReq): Promise<AuthIdentity> {
    const { email, password } = req;

    // 1. Look up user identity by email
    const identity = await this.identityRepo.findByEmail(email);
    if (!identity) {
      throw new UserNotFoundError(email);
    }

    // 2. Verify password match
    // This is a domain service responsibility: cross-aggregate business rule validation.
    // Password verification is typically encapsulated in HashedPassword value object's verify method.
    const passwordValid = await identity.verifyPassword(password, this.passwordHasher);
    if (!passwordValid) {
      throw new InvalidPasswordError();
    }

    // 3. Update last login time and login status
    // Business operations executed within the aggregate root, modifying its state.
    // identity.recordLogin();

    // 4. Persist updated identity to the database
    await this.identityRepo.save(identity);

    return identity;
  }
}
