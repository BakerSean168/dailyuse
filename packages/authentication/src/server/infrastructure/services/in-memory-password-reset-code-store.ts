import type { IPasswordResetCodeStore } from '../../domain';

/** Code TTL: 10 minutes in milliseconds */
const CODE_TTL_MS = 10 * 60 * 1000;

interface StoredCode {
  code: string;
  expiresAt: number;
}

/**
 * In-memory implementation of IPasswordResetCodeStore.
 * 基于内存的密码重置验证码存储实现。
 *
 * Suitable for development and single-instance deployments.
 * For production multi-instance deployments, replace with a Redis-backed implementation.
 */
export class InMemoryPasswordResetCodeStore implements IPasswordResetCodeStore {
  private readonly store = new Map<string, StoredCode>();

  async generateCode(email: string): Promise<string> {
    this.cleanupExpired();

    const code = this.generateRandomCode();
    const normalizedEmail = email.toLowerCase();

    this.store.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    return code;
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    this.cleanupExpired();

    const normalizedEmail = email.toLowerCase();
    const stored = this.store.get(normalizedEmail);

    if (!stored) {
      return false;
    }

    if (stored.expiresAt < Date.now()) {
      this.store.delete(normalizedEmail);
      return false;
    }

    if (stored.code !== code) {
      return false;
    }

    // Consume the code on success (one-time use)
    this.store.delete(normalizedEmail);
    return true;
  }

  /** Generate a random 6-digit numeric string. */
  private generateRandomCode(): string {
    const num = Math.floor(Math.random() * 1_000_000);
    return num.toString().padStart(6, '0');
  }

  /** Lazily clean up expired entries to prevent unbounded memory growth. */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [email, stored] of this.store) {
      if (stored.expiresAt < now) {
        this.store.delete(email);
      }
    }
  }
}
