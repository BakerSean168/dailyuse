import type { IPasswordResetCodeStore } from '../../domain';
import type { IVerificationChallengeStore } from '../../domain';
import { VerificationChallengePurpose } from '../../domain';
import { InMemoryVerificationChallengeStore } from './in-memory-verification-challenge-store';

/**
 * @deprecated Prefer InMemoryVerificationChallengeStore + purpose PasswordReset.
 * Thin adapter kept so older call sites of IPasswordResetCodeStore keep working.
 */
export class InMemoryPasswordResetCodeStore implements IPasswordResetCodeStore {
  private readonly store: IVerificationChallengeStore;

  constructor(store: IVerificationChallengeStore = new InMemoryVerificationChallengeStore()) {
    this.store = store;
  }

  async generateCode(email: string): Promise<string> {
    return this.store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: email,
    });
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    return this.store.consume({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: email,
      challenge: code,
    });
  }
}
