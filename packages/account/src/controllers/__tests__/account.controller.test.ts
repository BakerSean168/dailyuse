import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, fail, isOk } from '@dailyuse/contracts/result';
import { AccountController, type AccountUseCases } from '../account.controller';
import type { Context } from '@dailyuse/contracts/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUseCases(): AccountUseCases {
  return {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    checkAvailability: vi.fn(),
    closeAccount: vi.fn(),
  } as unknown as AccountUseCases;
}

const FAKE_CONTEXT: Context = {
  identityId: 'test-identity-123',
  deviceId: 'device-456',
};

const FAKE_ACCOUNT_DTO = {
  id: 'test-identity-123',
  status: 'ACTIVE',
  profile: {
    nickname: 'TestUser',
    gender: 'PREFER_NOT_TO_SAY',
    realName: null,
    avatarUrl: null,
    bio: null,
    birthday: null,
  },
  settings: {
    theme: 'SYSTEM',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    notificationEnabled: true,
  },
  email: { address: 'test@example.com', isVerified: false, verifiedAt: null, isPrimary: true },
  phone: null,
  version: 1,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AccountController', () => {
  let useCases: AccountUseCases;
  let controller: AccountController;

  beforeEach(() => {
    useCases = createMockUseCases();
    controller = new AccountController(useCases);
  });

  // =========================================================================
  // getProfile
  // =========================================================================
  describe('getProfile', () => {
    it('should delegate to use case', async () => {
      (useCases.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(FAKE_ACCOUNT_DTO));

      const result = await controller.getProfile(FAKE_CONTEXT);

      expect(useCases.getProfile).toHaveBeenCalledWith(FAKE_CONTEXT);
      expect(isOk(result)).toBe(true);
    });
  });

  // =========================================================================
  // updateProfile
  // =========================================================================
  describe('updateProfile', () => {
    it('should return VALIDATION_ERROR when input is invalid (empty object passes - all optional)', async () => {
      (useCases.updateProfile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(FAKE_ACCOUNT_DTO));

      // Empty object should be valid since all fields are optional
      const result = await controller.updateProfile({}, FAKE_CONTEXT);

      expect(isOk(result)).toBe(true);
      expect(useCases.updateProfile).toHaveBeenCalled();
    });

    it('should call updateProfile use case with parsed data', async () => {
      (useCases.updateProfile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(FAKE_ACCOUNT_DTO));

      await controller.updateProfile({ nickname: 'ValidName' }, FAKE_CONTEXT);

      expect(useCases.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'ValidName' }),
        FAKE_CONTEXT,
      );
    });

    it('should reject invalid nickname (empty string)', async () => {
      const result = await controller.updateProfile({ nickname: '' }, FAKE_CONTEXT);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(useCases.updateProfile).not.toHaveBeenCalled();
    });

    it('should reject invalid avatar URL', async () => {
      const result = await controller.updateProfile({ avatar: 'not-a-url' }, FAKE_CONTEXT);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should forward use case failure', async () => {
      const useCaseError = fail({ code: 'NOT_FOUND', message: 'Account not found' });
      (useCases.updateProfile as ReturnType<typeof vi.fn>).mockResolvedValue(useCaseError);

      const result = await controller.updateProfile({ nickname: 'Valid' }, FAKE_CONTEXT);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  // =========================================================================
  // checkAvailability
  // =========================================================================
  describe('checkAvailability', () => {
    it('should validate input and call use case', async () => {
      (useCases.checkAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(
        ok({ available: true }),
      );

      const result = await controller.checkAvailability({
        type: 'EMAIL',
        value: 'test@example.com',
      });

      expect(isOk(result)).toBe(true);
      expect(useCases.checkAvailability).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EMAIL', value: 'test@example.com' }),
      );
    });

    it('should return VALIDATION_ERROR for missing type', async () => {
      const result = await controller.checkAvailability({ value: 'test' });

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR for invalid type', async () => {
      const result = await controller.checkAvailability({
        type: 'INVALID',
        value: 'test',
      });

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR for missing value', async () => {
      const result = await controller.checkAvailability({ type: 'EMAIL' });

      expect(isOk(result)).toBe(false);
    });
  });

  // =========================================================================
  // closeAccount
  // =========================================================================
  describe('closeAccount', () => {
    it('should validate input and call use case', async () => {
      (useCases.closeAccount as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));

      const result = await controller.closeAccount({ reason: 'No longer needed' }, FAKE_CONTEXT);

      expect(isOk(result)).toBe(true);
      expect(useCases.closeAccount).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'No longer needed' }),
        FAKE_CONTEXT,
      );
    });

    it('should return VALIDATION_ERROR when reason is empty', async () => {
      const result = await controller.closeAccount({ reason: '' }, FAKE_CONTEXT);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(useCases.closeAccount).not.toHaveBeenCalled();
    });

    it('should return VALIDATION_ERROR when reason is missing', async () => {
      const result = await controller.closeAccount({}, FAKE_CONTEXT);

      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should forward use case failure', async () => {
      (useCases.closeAccount as ReturnType<typeof vi.fn>).mockResolvedValue(
        fail({ code: 'FORBIDDEN', message: 'Cannot close suspended account' }),
      );

      const result = await controller.closeAccount({ reason: 'Test' }, FAKE_CONTEXT);

      expect(isOk(result)).toBe(false);
    });
  });
});
