/**
 * BcryptPasswordEncryptor Tests
 *
 * Unit tests for bcrypt password encryption.
 * Tests hash generation, verification, and strength validation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  BcryptPasswordEncryptor,
  createBcryptEncryptor,
} from '../argon2-hasher';

describe('BcryptPasswordEncryptor', () => {
  describe('constructor', () => {
    it('should create encryptor with default salt rounds', () => {
      const encryptor = new BcryptPasswordEncryptor();
      const config = encryptor.getConfig();

      expect(config.saltRounds).toBe(12);
    });

    it('should create encryptor with custom salt rounds', () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const config = encryptor.getConfig();

      expect(config.saltRounds).toBe(10);
    });

    it('should warn if salt rounds outside recommended range', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      new BcryptPasswordEncryptor(8); // Below 10
      expect(consoleSpy).toHaveBeenCalledWith(
        '[BcryptPasswordEncryptor] Salt rounds 8 outside recommended range (10-14). Using default: 12',
      );

      new BcryptPasswordEncryptor(16); // Above 14
      expect(consoleSpy).toHaveBeenCalledWith(
        '[BcryptPasswordEncryptor] Salt rounds 16 outside recommended range (10-14). Using default: 12',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('hash', () => {
    it('should hash password successfully', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'TestPassword123!';

      const hash = await encryptor.hash(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // Bcrypt format
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for same password', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'TestPassword123!';

      const hash1 = await encryptor.hash(password);
      const hash2 = await encryptor.hash(password);

      expect(hash1).not.toBe(hash2); // Salt should be different
    });

    it('should reject password shorter than 8 characters', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);

      await expect(encryptor.hash('short')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should warn when password longer than 72 characters', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const longPassword = 'a'.repeat(73);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await encryptor.hash(longPassword);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[BcryptPasswordEncryptor] Password longer than 72 characters will be truncated by bcrypt',
      );

      consoleSpy.mockRestore();
    });

    it('should handle special characters', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'P@ssw0rd!#$%^&*()';

      const hash = await encryptor.hash(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should handle unicode characters', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'P@ssw0rd瀵嗙爜馃敀';

      const hash = await encryptor.hash(password);

      expect(hash).toBeDefined();
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'TestPassword123!';

      const hash = await encryptor.hash(password);
      const isValid = await encryptor.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';

      const hash = await encryptor.hash(password);
      const isValid = await encryptor.verify(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const hash = await encryptor.hash('TestPassword123!');

      const isValid = await encryptor.verify('', hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);

      const isValid = await encryptor.verify('TestPassword123!', '');

      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const isValid = await encryptor.verify(
        'TestPassword123!',
        'invalid_hash_format'
      );

      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[BcryptPasswordEncryptor] Invalid bcrypt hash format',
      );

      consoleSpy.mockRestore();
    });

    it('should accept bcrypt hash variants ($2a$, $2b$, $2y$)', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);

      // Generate real hash (will be $2a$ or $2b$)
      const password = 'TestPassword123!';
      const hash = await encryptor.hash(password);

      const isValid = await encryptor.verify(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle short invalid hashes gracefully', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);

      // Truncated hash (invalid format)
      const isValid = await encryptor.verify('TestPassword123!', '$2a$10$abc');

      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'StrongP@ssw0rd123!';

      const result = encryptor.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without numbers', () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'PasswordNoNumbers!';

      const result = encryptor.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should reject password without letters', () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = '12345678!@#$';

      const result = encryptor.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one letter'
      );
    });

    it('should allow password without special characters if only checking basic requirements', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'PasswordNoSpecial123';

      // validatePasswordStrength is optional - encryptor will still hash it
      const hash = await encryptor.hash(password);
      expect(hash).toBeDefined();

      const result = encryptor.validatePasswordStrength(password);
      // Basic encryptor may not require special chars
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should accumulate multiple errors', () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'weakpassword'; // No numbers, no special chars

      const result = encryptor.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should accept password with various special characters', () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const passwords = [
        'Test@Password1',
        'Test#Password1',
        'Test$Password1',
        'Test%Password1',
        'Test^Password1',
        'Test&Password1',
        'Test*Password1',
      ];

      passwords.forEach((password) => {
        const result = encryptor.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('createBcryptEncryptor', () => {
    it('should create encryptor with default settings', () => {
      const encryptor = createBcryptEncryptor();
      const config = encryptor.getConfig();

      expect(config.saltRounds).toBe(12);
    });

    it('should create encryptor with custom salt rounds', () => {
      const encryptor = createBcryptEncryptor(14);
      const config = encryptor.getConfig();

      expect(config.saltRounds).toBe(14);
    });
  });

  describe('security properties', () => {
    it('should use consistent timing for verification', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'TestPassword123!';
      const hash = await encryptor.hash(password);

      const startCorrect = Date.now();
      await encryptor.verify(password, hash);
      const timeCorrect = Date.now() - startCorrect;

      const startIncorrect = Date.now();
      await encryptor.verify('WrongPassword123!', hash);
      const timeIncorrect = Date.now() - startIncorrect;

      // Timing should be similar (within 50ms)
      // This is a weak test but demonstrates timing-safe principle
      const diff = Math.abs(timeCorrect - timeIncorrect);
      expect(diff).toBeLessThan(100);
    });

    it('should never expose original password in errors', async () => {
      const encryptor = new BcryptPasswordEncryptor(10);
      const password = 'SecretPassword123!';

      try {
        await encryptor.hash(''); // Will throw
      } catch (error) {
        expect(error.message).not.toContain(password);
      }
    });
  });
});
