import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DesktopRememberedAccountService } from '../desktop-remembered-account-service';

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe('DesktopRememberedAccountService', () => {
  let mockRememberedAccounts: any;
  let service: DesktopRememberedAccountService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRememberedAccounts = {
      recordLogin: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
      remove: vi.fn(),
      decryptPassword: vi.fn(),
    };

    service = new DesktopRememberedAccountService(createLogger() as any, mockRememberedAccounts);
  });

  describe('getRememberedAccounts', () => {
    it('returns accounts without exposing plaintext passwords', async () => {
      mockRememberedAccounts.list.mockResolvedValue([
        {
          identityId: 'user-1',
          identifier: 'saved@example.com',
          nickname: 'saved',
          avatarUrl: null,
          rememberPassword: true,
          autoLogin: false,
          lastUsedAt: 11,
          lastLoginAt: 10,
          encryptedPassword: 'ciphertext',
        },
      ]);

      const accounts = await service.getRememberedAccounts();

      expect(accounts).toEqual([
        expect.objectContaining({
          identityId: 'user-1',
          identifier: 'saved@example.com',
          hasSavedPassword: true,
        }),
      ]);
      expect('savedPassword' in accounts[0]!).toBe(false);
    });

    it('returns empty list when no accounts exist', async () => {
      mockRememberedAccounts.list.mockResolvedValue([]);

      const accounts = await service.getRememberedAccounts();

      expect(accounts).toEqual([]);
    });

    it('marks hasSavedPassword as false when rememberPassword is off', async () => {
      mockRememberedAccounts.list.mockResolvedValue([
        {
          identityId: 'user-1',
          identifier: 'user@example.com',
          nickname: null,
          avatarUrl: null,
          rememberPassword: false,
          autoLogin: false,
          lastUsedAt: 0,
          lastLoginAt: 0,
          encryptedPassword: null,
        },
      ]);

      const accounts = await service.getRememberedAccounts();

      expect(accounts[0].hasSavedPassword).toBe(false);
    });
  });

  describe('removeRememberedAccount', () => {
    it('removes account by identityId', async () => {
      const result = await service.removeRememberedAccount('user-1');

      expect(result.ok).toBe(true);
      expect(mockRememberedAccounts.remove).toHaveBeenCalledOnce();
    });

    it('returns failure when removal throws', async () => {
      mockRememberedAccounts.remove.mockRejectedValue(new Error('not found'));

      const result = await service.removeRememberedAccount('nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REMEMBERED_ACCOUNT_REMOVE_FAILED');
      }
    });
  });

  describe('findRememberedAccount', () => {
    it('finds account by identityId', async () => {
      mockRememberedAccounts.list.mockResolvedValue([
        { identityId: 'user-1', identifier: 'a@b.com' },
        { identityId: 'user-2', identifier: 'c@d.com' },
      ]);

      const found = await service.findRememberedAccount('user-2');

      expect(found).toBeDefined();
      expect(found!.identityId).toBe('user-2');
    });

    it('returns null when not found', async () => {
      mockRememberedAccounts.list.mockResolvedValue([]);

      const found = await service.findRememberedAccount('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('decryptPassword', () => {
    it('delegates to remembered accounts service', () => {
      mockRememberedAccounts.decryptPassword.mockReturnValue('secret');

      const result = service.decryptPassword({ identityId: 'user-1' } as any);

      expect(result).toBe('secret');
      expect(mockRememberedAccounts.decryptPassword).toHaveBeenCalledWith({ identityId: 'user-1' });
    });
  });

  describe('recordLogin', () => {
    it('records login with IdentityId wrapper', async () => {
      await service.recordLogin({
        identityId: 'user-1',
        identifier: 'user@example.com',
        nickname: 'User',
        avatarUrl: null,
        rememberPassword: true,
        autoLogin: false,
        password: 'secret',
      });

      expect(mockRememberedAccounts.recordLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'user@example.com',
          rememberPassword: true,
          password: 'secret',
        }),
      );
      // Verify identityId was wrapped
      const call = mockRememberedAccounts.recordLogin.mock.calls[0][0];
      expect(String(call.identityId)).toBe('user-1');
    });
  });

  describe('getAutoLoginAccount', () => {
    it('delegates to remembered accounts service', async () => {
      mockRememberedAccounts.getAutoLoginAccount.mockResolvedValue({
        identityId: 'user-1',
        identifier: 'user@example.com',
        autoLogin: true,
      });

      const result = await service.getAutoLoginAccount();

      expect(result).toBeDefined();
      expect(result.autoLogin).toBe(true);
    });

    it('returns null when no auto-login account', async () => {
      mockRememberedAccounts.getAutoLoginAccount.mockResolvedValue(null);

      const result = await service.getAutoLoginAccount();

      expect(result).toBeNull();
    });
  });
});
