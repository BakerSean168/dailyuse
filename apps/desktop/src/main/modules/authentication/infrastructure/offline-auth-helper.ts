/**
 * Offline Auth Helper
 *
 * Manages offline credential storage and verification.
 * Extracted from SessionManager to isolate offline-auth concern.
 *
 * @module authentication/infrastructure/offline-auth-helper
 */

import { AuthIdentity } from '@dailyuse/authentication/electron';
import type { IdentityId } from '@dailyuse/contracts/authentication';
import type { IAuthIdentityRepository } from '@dailyuse/authentication/electron';
import type { IPasswordHasher } from '@dailyuse/authentication/electron';
import type { ILogger } from '@dailyuse/utils/logger';
// Residual 937: toIdentityId dual retired — session-types sole helper.
import { toIdentityId } from './session-types';

export interface OfflineVerificationResult {
  ok: boolean;
  identityId?: string;
  error?: string;
}

export class OfflineAuthHelper {
  private identityRepository: IAuthIdentityRepository | null = null;
  private passwordHasher: IPasswordHasher | null = null;

  constructor(private readonly logger: ILogger) {}

  get isAvailable(): boolean {
    return this.identityRepository !== null && this.passwordHasher !== null;
  }

  setDependencies(
    identityRepository: IAuthIdentityRepository,
    passwordHasher: IPasswordHasher,
  ): void {
    this.identityRepository = identityRepository;
    this.passwordHasher = passwordHasher;
    this.logger.info('Offline auth dependencies injected');
  }

  async saveCredentials(email: string, plainPassword: string, identityId: string): Promise<void> {
    if (!this.identityRepository || !this.passwordHasher) {
      this.logger.warn('Offline auth dependencies not available, skipping credential cache');
      return;
    }

    try {
      const existing = await this.identityRepository.findByEmail(email);

      if (existing) {
        if (existing.id.toString() === identityId) {
          this.logger.debug('Offline credentials already cached with correct server ID', { email });
          return;
        }
        this.logger.info('Replacing offline credentials with correct server ID', {
          email,
          oldId: existing.id.toString(),
          newId: identityId,
        });
        await this.identityRepository.delete(existing);
      }

      const identity = await AuthIdentity.createWithEmailAndPassword({
        id: toIdentityId(identityId),
        email,
        plainPassword,
        hasher: this.passwordHasher,
      });

      await this.identityRepository.save(identity);
      this.logger.info('Offline credentials cached successfully', { email, identityId });
    } catch (error) {
      this.logger.error('Failed to cache offline credentials', { error, email });
      throw error;
    }
  }

  async removeCredentials(email: string): Promise<void> {
    if (!this.identityRepository) {
      return;
    }

    const identity = await this.identityRepository.findByEmail(email);
    if (!identity) {
      return;
    }

    await this.identityRepository.delete(identity);
  }

  async verifyCredentials(
    email: string,
    plainPassword: string,
  ): Promise<OfflineVerificationResult> {
    if (!this.identityRepository || !this.passwordHasher) {
      return { ok: false, error: 'OFFLINE_AUTH_UNAVAILABLE' };
    }

    let identity: AuthIdentity | null;
    try {
      identity = await this.identityRepository.findByEmail(email);
    } catch (error) {
      this.logger.error('Offline credential lookup failed', { email, error });
      return { ok: false, error: 'OFFLINE_STORAGE_ERROR' };
    }

    if (!identity) {
      return { ok: false, error: 'NO_LOCAL_CREDENTIALS' };
    }

    if (identity.isLocked()) {
      return { ok: false, error: 'ACCOUNT_LOCKED' };
    }

    const verified = await identity.verifyPassword(plainPassword, this.passwordHasher);
    if (!verified) {
      identity.recordFailedLogin();
      try {
        await this.identityRepository.save(identity);
      } catch (error) {
        this.logger.error('Failed to persist failed-login state for offline identity', {
          identityId: identity.id.toString(),
          error,
        });
      }
      return { ok: false, error: 'INVALID_PASSWORD' };
    }

    identity.resetFailedAttempts();
    try {
      await this.identityRepository.save(identity);
    } catch (error) {
      this.logger.error('Failed to persist reset-failed-attempts state for offline identity', {
        identityId: identity.id.toString(),
        error,
      });
      return { ok: false, error: 'OFFLINE_STORAGE_ERROR' };
    }

    return { ok: true, identityId: identity.id.toString() };
  }
}
