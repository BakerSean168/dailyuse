/**
 * Provider secret vault boundary.
 *
 * The AI application/infrastructure layers only need authenticated encryption
 * and decryption of provider credentials. Key source, rotation, KMS, and storage
 * details stay behind this port so repositories never depend on a concrete env
 * cipher implementation.
 */
export interface IAIProviderSecretVault {
  /** Encrypt plaintext for durable/ephemeral server-side storage. */
  encrypt(value: string): string;
  /** Decrypt a previously encrypted value. Plaintext seed values may pass through. */
  decrypt(value: string): string;
  /** Whether a ciphertext should be rewritten with the active key/version. */
  needsRewrap(value: string): boolean;
  /** Decrypt then re-encrypt with the active key/version. */
  rewrap(value: string): string;
}
