import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordUseCase } from '../forgot-password.use-case';
import { ResetPasswordUseCase } from '../reset-password.use-case';
import { AuthIdentity } from '../../../../domain/aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../../../../domain/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '../../../../domain/repositories/i-auth-session.repository';
import type { IEmailSender, IPasswordHasher } from '../../../../domain';
import { AuthDomainCode } from '../../../../domain';
import { InMemoryVerificationChallengeStore } from '../../../../infrastructure/services/in-memory-verification-challenge-store';

const MOCK_HASH = '$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ';

const createMockHasher = (): IPasswordHasher => ({
  hash: vi.fn().mockResolvedValue(MOCK_HASH),
  compare: vi.fn().mockResolvedValue(true),
});

const createMockIdentityRepo = (
  overrides: Partial<IAuthIdentityRepository> = {},
): IAuthIdentityRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByEmail: vi.fn().mockResolvedValue(null),
  findByOAuth: vi.fn().mockResolvedValue(null),
  existsByEmail: vi.fn().mockResolvedValue(false),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createMockSessionRepo = (
  overrides: Partial<IAuthSessionRepository> = {},
): IAuthSessionRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByIdForIdentity: vi.fn().mockResolvedValue(null),
  findByIdentityId: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined),
  removeAllByIdentityId: vi.fn().mockResolvedValue(undefined),
  removeExpired: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('ForgotPassword + ResetPassword (Application Commands)', () => {
  let identityRepo: IAuthIdentityRepository;
  let sessionRepo: IAuthSessionRepository;
  let challengeStore: InMemoryVerificationChallengeStore;
  let emailSender: IEmailSender;
  let passwordHasher: IPasswordHasher;
  let forgot: ForgotPasswordUseCase;
  let reset: ResetPasswordUseCase;

  beforeEach(() => {
    passwordHasher = createMockHasher();
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    challengeStore = new InMemoryVerificationChallengeStore();
    emailSender = {
      sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
      sendEmailVerificationCode: vi.fn().mockResolvedValue(undefined),
    };
    forgot = new ForgotPasswordUseCase(identityRepo, challengeStore, emailSender);
    reset = new ResetPasswordUseCase(identityRepo, sessionRepo, challengeStore, passwordHasher);
  });

  it('returns ok without sending when email is unknown (anti-enumeration)', async () => {
    const result = await forgot.execute({ email: 'ghost@example.com' });
    expect(result.ok).toBe(true);
    expect(emailSender.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('issues a PasswordReset challenge and emails the code for known users', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    const result = await forgot.execute({ email: 'user@example.com' });
    expect(result.ok).toBe(true);
    expect(emailSender.sendPasswordResetCode).toHaveBeenCalledTimes(1);
    const [, code] = (emailSender.sendPasswordResetCode as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(code).toMatch(/^\d{6}$/);
  });

  it('returns RATE_LIMITED with domainCode when cooldown is active', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    await forgot.execute({ email: 'user@example.com' });
    const second = await forgot.execute({ email: 'user@example.com' });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe('RATE_LIMITED');
      expect(second.error.context?.domainCode).toBe(AuthDomainCode.CHALLENGE_COOLDOWN);
    }
  });

  it('resets password with a valid code and revokes all sessions', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    await forgot.execute({ email: 'user@example.com' });
    const code = (emailSender.sendPasswordResetCode as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;

    const result = await reset.execute({
      email: 'user@example.com',
      code,
      newPassword: 'NewStrongP@ss2',
    });

    expect(result.ok).toBe(true);
    expect(identityRepo.save).toHaveBeenCalled();
    expect(sessionRepo.removeAllByIdentityId).toHaveBeenCalledWith(identity.id);
  });

  it('rejects invalid or expired reset codes with domainCode', async () => {
    const result = await reset.execute({
      email: 'user@example.com',
      code: '123456',
      newPassword: 'NewStrongP@ss2',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.context?.domainCode).toBe(AuthDomainCode.INVALID_OR_EXPIRED_CODE);
    }
  });

  it('does not allow replaying a consumed reset code', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    await forgot.execute({ email: 'user@example.com' });
    const code = (emailSender.sendPasswordResetCode as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;

    await reset.execute({
      email: 'user@example.com',
      code,
      newPassword: 'NewStrongP@ss2',
    });

    const replay = await reset.execute({
      email: 'user@example.com',
      code,
      newPassword: 'AnotherStr0ng!',
    });

    expect(replay.ok).toBe(false);
    if (!replay.ok) {
      expect(replay.error.context?.domainCode).toBe(AuthDomainCode.INVALID_OR_EXPIRED_CODE);
    }
  });
});

