import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RememberedAccountsService, RememberedAccountRecord } from '../../infrastructure/remembered-accounts-service';
import { DesktopRememberedAccountService } from '../desktop-remembered-account-service';
import { createMockLogger } from '../../__fixtures__/auth-test-fixtures';

const PRIMARY_IDENTITY_ID = 'IdentityId_33333333-3333-4333-8333-333333333333';
const SECONDARY_IDENTITY_ID = 'IdentityId_44444444-4444-4444-8444-444444444444';
const MISSING_IDENTITY_ID = 'IdentityId_55555555-5555-4555-8555-555555555555';

describe('DesktopRememberedAccountService', () => {
  let mockRememberedAccounts: RememberedAccountsService;
  let service: DesktopRememberedAccountService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRememberedAccounts = {
      recordLogin: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
      remove: vi.fn(),
      decryptPassword: vi.fn(),
    } as unknown as RememberedAccountsService;

    service = new DesktopRememberedAccountService(createMockLogger() as never, mockRememberedAccounts);
  });

  describe('getRememberedAccounts', () => {
    it('returns accounts without exposing plaintext passwords', async () => {
      mockRememberedAccounts.list.mockResolvedValue([
        {
          identityId: PRIMARY_IDENTITY_ID,
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
          identityId: PRIMARY_IDENTITY_ID,
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
          identityId: PRIMARY_IDENTITY_ID,
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
      const result = await service.removeRememberedAccount(PRIMARY_IDENTITY_ID);

      expect(result.ok).toBe(true);
      expect(mockRememberedAccounts.remove).toHaveBeenCalledOnce();
    });

    it('returns failure when removal throws', async () => {
      mockRememberedAccounts.remove.mockRejectedValue(new Error('not found'));

      const result = await service.removeRememberedAccount(MISSING_IDENTITY_ID);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REMEMBERED_ACCOUNT_REMOVE_FAILED');
      }
    });
  });

  describe('findRememberedAccount', () => {
    it('finds account by identityId', async () => {
      mockRememberedAccounts.list.mockResolvedValue([
        { identityId: PRIMARY_IDENTITY_ID, identifier: 'a@b.com' },
        { identityId: SECONDARY_IDENTITY_ID, identifier: 'c@d.com' },
      ]);

      const found = await service.findRememberedAccount(SECONDARY_IDENTITY_ID);

      expect(found).toBeDefined();
      expect(found!.identityId).toBe(SECONDARY_IDENTITY_ID);
    });

    it('returns null when not found', async () => {
      mockRememberedAccounts.list.mockResolvedValue([]);

      const found = await service.findRememberedAccount(MISSING_IDENTITY_ID);

      expect(found).toBeNull();
    });
  });

  describe('decryptPassword', () => {
    it('delegates to remembered accounts service', () => {
      mockRememberedAccounts.decryptPassword.mockReturnValue('secret');

      const result = service.decryptPassword({ identityId: PRIMARY_IDENTITY_ID } as unknown as RememberedAccountRecord);

      expect(result).toBe('secret');
      expect(mockRememberedAccounts.decryptPassword).toHaveBeenCalledWith({ identityId: PRIMARY_IDENTITY_ID });
    });
  });

  describe('recordLogin', () => {
    it('records login with IdentityId wrapper', async () => {
      await service.recordLogin({
        identityId: PRIMARY_IDENTITY_ID,
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
      expect(String(call.identityId)).toBe(PRIMARY_IDENTITY_ID);
    });
  });

  describe('getAutoLoginAccount', () => {
    it('delegates to remembered accounts service', async () => {
      mockRememberedAccounts.getAutoLoginAccount.mockResolvedValue({
        identityId: PRIMARY_IDENTITY_ID,
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
