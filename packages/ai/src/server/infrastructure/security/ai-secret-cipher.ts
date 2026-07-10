import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Symmetric cipher for AI provider secrets (e.g. third-party API keys).
 *
 * Uses AES-256-GCM with a random IV per encryption and an authentication tag,
 * so ciphertext is non-deterministic and tamper-evident. The 256-bit key is
 * derived from the configured secret via SHA-256.
 *
 * The `enc_v2:` prefix identifies this AES-256-GCM format. `enc_v1:` was the
 * previous (incompatible) XOR format; bumping the version means legacy XOR
 * rows are no longer silently mis-decrypted — per AGENT.md there is no
 * backward-compat/migration requirement. Values without a known prefix are
 * treated as already-plaintext and returned as-is (decrypt is a no-op), which
 * keeps freshly-seeded plaintext rows readable.
 */
export class AISecretCipher {
  private static readonly PREFIX = 'enc_v2:';
  /** 旧的 XOR 格式前缀，仅用于识别并拒绝，不再支持解密。 */
  private static readonly LEGACY_XOR_PREFIX = 'enc_v1:';
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;

  private readonly key: Buffer;

  constructor(secret: string) {
    if (!secret) {
      throw new Error('AISecretCipher requires a non-empty secret');
    }

    this.key = createHash('sha256').update(secret).digest();
  }

  /**
   * Builds a cipher from `AI_PROVIDER_ENCRYPTION_KEY`.
   *
   * Fails fast when the env var is missing so a missing key can never silently
   * fall back to a shared, publicly-known default.
   */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): AISecretCipher {
    const secret = env.AI_PROVIDER_ENCRYPTION_KEY;
    if (!secret) {
      throw new Error(
        'AI_PROVIDER_ENCRYPTION_KEY environment variable is required to encrypt AI provider secrets',
      );
    }

    return new AISecretCipher(secret);
  }

  encrypt(value: string): string {
    const iv = randomBytes(AISecretCipher.IV_LENGTH);
    const cipher = createCipheriv(AISecretCipher.ALGORITHM, this.key, iv);

    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const payload = Buffer.concat([iv, authTag, ciphertext]);
    return `${AISecretCipher.PREFIX}${payload.toString('base64')}`;
  }

  decrypt(value: string): string {
    // 显式拒绝旧的 XOR 格式（enc_v1:），避免把无法解密的密文当作明文静默返回，
    // 从而把损坏的 API key 交给下游 provider。当前不做迁移（见 AGENT.md），
    // 遇到旧数据应快速失败而非悄悄产出垃圾。
    if (value.startsWith(AISecretCipher.LEGACY_XOR_PREFIX)) {
      throw new Error(
        'AISecretCipher: encountered legacy enc_v1 (XOR) ciphertext, which is no longer supported',
      );
    }

    if (!value.startsWith(AISecretCipher.PREFIX)) {
      return value;
    }

    const payload = Buffer.from(value.slice(AISecretCipher.PREFIX.length), 'base64');
    const iv = payload.subarray(0, AISecretCipher.IV_LENGTH);
    const authTag = payload.subarray(
      AISecretCipher.IV_LENGTH,
      AISecretCipher.IV_LENGTH + AISecretCipher.AUTH_TAG_LENGTH,
    );
    const ciphertext = payload.subarray(AISecretCipher.IV_LENGTH + AISecretCipher.AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(AISecretCipher.ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
