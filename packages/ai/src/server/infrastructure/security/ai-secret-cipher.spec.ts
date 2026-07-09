import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AISecretCipher } from './ai-secret-cipher';

describe('AISecretCipher', () => {
  const originalKey = process.env.AI_PROVIDER_ENCRYPTION_KEY;

  beforeEach(() => {
    delete process.env.AI_PROVIDER_ENCRYPTION_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.AI_PROVIDER_ENCRYPTION_KEY;
    } else {
      process.env.AI_PROVIDER_ENCRYPTION_KEY = originalKey;
    }
  });

  it('round-trips a value through encrypt/decrypt', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    const encrypted = cipher.encrypt('plain-secret');
    expect(encrypted).not.toBe('plain-secret');
    expect(cipher.decrypt(encrypted)).toBe('plain-secret');
  });

  it('does not store the plaintext in the ciphertext payload', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    const encrypted = cipher.encrypt('super-secret-value');
    expect(encrypted).not.toContain('super-secret-value');
  });

  it('produces distinct ciphertext for the same plaintext (random IV)', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    expect(cipher.encrypt('same-input')).not.toBe(cipher.encrypt('same-input'));
  });

  it('passes through values that are not encrypted', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    expect(cipher.decrypt('not-encrypted')).toBe('not-encrypted');
  });

  it('fails to decrypt when the payload is tampered with', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');
    const encrypted = cipher.encrypt('plain-secret');
    const tampered = `${encrypted.slice(0, -2)}AA`;

    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it('cannot decrypt a value produced with a different key', () => {
    const encrypted = new AISecretCipher('key-one').encrypt('plain-secret');

    expect(() => new AISecretCipher('key-two').decrypt(encrypted)).toThrow();
  });

  it('emits the enc_v2 format prefix for GCM ciphertext', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    expect(cipher.encrypt('plain-secret')).toMatch(/^enc_v2:/);
  });

  it('throws on legacy enc_v1 (XOR) ciphertext instead of silently mis-decoding', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    // enc_v1: was the old XOR format; GCM decrypt must not accept it as plaintext
    // nor silently succeed — it is neither pass-through (no prefix) nor valid GCM.
    expect(() => cipher.decrypt('enc_v1:c29tZS1sZWdhY3ktdmFsdWU=')).toThrow();
  });

  it('round-trips Unicode values', () => {
    const cipher = new AISecretCipher('a-strong-test-secret');

    const value = '密钥-🔐-café';
    expect(cipher.decrypt(cipher.encrypt(value))).toBe(value);
  });

  it('rejects an empty secret in the constructor', () => {
    expect(() => new AISecretCipher('')).toThrow(/non-empty secret/);
  });

  it('fails fast when AI_PROVIDER_ENCRYPTION_KEY is missing', () => {
    expect(() => AISecretCipher.fromEnv()).toThrow(/AI_PROVIDER_ENCRYPTION_KEY/);
  });

  it('builds from the environment variable when present', () => {
    process.env.AI_PROVIDER_ENCRYPTION_KEY = 'env-provided-secret';
    const cipher = AISecretCipher.fromEnv();

    expect(cipher.decrypt(cipher.encrypt('value'))).toBe('value');
  });
});
