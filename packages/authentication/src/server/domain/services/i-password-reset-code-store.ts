/**
 * @deprecated Prefer IVerificationChallengeStore with purpose PasswordReset.
 * Kept as a thin compatibility surface; new code should not depend on this interface.
 */
export interface IPasswordResetCodeStore {
  generateCode(email: string): Promise<string>;
  verifyCode(email: string, code: string): Promise<boolean>;
}
