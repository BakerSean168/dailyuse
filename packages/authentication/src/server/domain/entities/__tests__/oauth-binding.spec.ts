/**
 * OAuthBinding Entity Tests
 */
import { describe, it, expect } from 'vitest';
import { OAuthBinding } from '../oauth-binding';
import { OAuthProvider } from '@/server/domain';

describe('OAuthBinding', () => {
  describe('create', () => {
    it('should create an OAuth binding', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Google,
        providerSubjectId: 'google-123',
      });
      expect(binding.id).toBe('binding-1');
      expect(binding.provider).toBe(OAuthProvider.Google);
      expect(binding.providerSubjectId).toBe('google-123');
      expect(binding.accessToken).toBeNull();
      expect(binding.refreshToken).toBeNull();
    });

    it('should create with tokens', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Github,
        providerSubjectId: 'gh-456',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      });
      expect(binding.accessToken).toBe('access-token');
      expect(binding.refreshToken).toBe('refresh-token');
      expect(binding.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw if provider is missing', () => {
      expect(() =>
        OAuthBinding.create({
          id: 'binding-1',
          provider: '' as any,
          providerSubjectId: 'sub-1',
        }),
      ).toThrow();
    });
  });

  describe('refreshTokens', () => {
    it('should update tokens', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Google,
        providerSubjectId: 'google-123',
      });

      binding.refreshTokens({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: Date.now() + 7200000,
      });

      expect(binding.accessToken).toBe('new-access');
      expect(binding.refreshToken).toBe('new-refresh');
      expect(binding.lastUsedAt).toBeInstanceOf(Date);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false when no expiry set', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Google,
        providerSubjectId: 'google-123',
      });
      expect(binding.isTokenExpired()).toBe(false);
    });

    it('should return true when token expired', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Google,
        providerSubjectId: 'google-123',
        expiresAt: Date.now() - 1000,
      });
      expect(binding.isTokenExpired()).toBe(true);
    });
  });

  describe('revoke', () => {
    it('should clear tokens on revoke', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Google,
        providerSubjectId: 'google-123',
        accessToken: 'at',
        refreshToken: 'rt',
      });

      binding.revoke();
      expect(binding.accessToken).toBeNull();
      expect(binding.refreshToken).toBeNull();
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize via Server DTO', () => {
      const binding = OAuthBinding.create({
        id: 'binding-1',
        provider: OAuthProvider.Google,
        providerSubjectId: 'google-123',
        accessToken: 'at',
      });

      const dto = binding.toServerDTO();
      const restored = OAuthBinding.load({
        id: dto.id,
        provider: OAuthProvider.of(dto.provider),
        providerSubjectId: dto.providerSubjectId,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdAt: new Date(dto.createdAt),
        lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : null,
      });
      expect(restored.id).toBe(binding.id);
      expect(restored.provider).toBe(binding.provider);
      expect(restored.providerSubjectId).toBe(binding.providerSubjectId);
    });
  });
});
