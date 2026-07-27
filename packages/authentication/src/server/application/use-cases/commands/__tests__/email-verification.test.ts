/**
 * Send + Verify Email Code application command tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendEmailVerificationCodeUseCase } from '../send-email-verification-code.use-case';
import { VerifyEmailCodeUseCase } from '../verify-email-code.use-case';
import type { IAuthIdentityRepository } from '../../../../domain/repositories/i-auth-identity.repository';
import type { IEmailSender, IPasswordHasher } from '../../../../domain';
import { AuthDomainCode, AuthIdentity, AuthIdentityStatus } from '../../../../domain';
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

describe('SendEmailVerificationCode + VerifyEmailCode', () => {
  let identityRepo: IAuthIdentityRepository;
  let challengeStore: InMemoryVerificationChallengeStore;
  let emailSender: IEmailSender;
  let passwordHasher: IPasswordHasher;
  let send: SendEmailVerificationCodeUseCase;
  let verify: VerifyEmailCodeUseCase;

  beforeEach(() => {
    passwordHasher = createMockHasher();
    identityRepo = createMockIdentityRepo();
    challengeStore = new InMemoryVerificationChallengeStore();
    emailSender = {
      sendPasswordResetCode: vi.fn().mockResolvedValue(undefined),
      sendEmailVerificationCode: vi.fn().mockResolvedValue(undefined),
    };
    send = new SendEmailVerificationCodeUseCase(identityRepo, challengeStore, emailSender);
    verify = new VerifyEmailCodeUseCase(identityRepo, challengeStore);
  });

  it('returns ok without sending when email is unknown (anti-enumeration)', async () => {
    const result = await send.execute({ email: 'ghost@example.com', purpose: 'EmailVerify' });
    expect(result.ok).toBe(true);
    expect(emailSender.sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it('issues EmailVerify challenge and emails the code for known unverified users', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    const result = await send.execute({ email: 'user@example.com', purpose: 'EmailVerify' });
    expect(result.ok).toBe(true);
    expect(emailSender.sendEmailVerificationCode).toHaveBeenCalledTimes(1);
    const [, code] = (emailSender.sendEmailVerificationCode as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(code).toMatch(/^\d{6}$/);
  });

  it('verifies email, activates identity, and emits auth:email-verified', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    identity.clearDomainEvents();
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    await send.execute({ email: 'user@example.com', purpose: 'EmailVerify' });
    const code = (emailSender.sendEmailVerificationCode as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as string;

    const result = await verify.execute({
      email: 'user@example.com',
      code,
      purpose: 'EmailVerify',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.identity?.status).toBe(AuthIdentityStatus.Active);
      expect(result.data.identity?.identifiers.some((i) => i.type === 'Email' && i.isVerified)).toBe(
        true,
      );
    }
    expect(identityRepo.save).toHaveBeenCalled();
    expect(AuthIdentityStatus.isActive(identity.status)).toBe(true);
    expect(identity.findIdentifierByEmail('user@example.com')?.isVerified).toBe(true);
    expect(identity.domainEvents.some((e) => e.eventType === 'auth:email-verified')).toBe(true);
    expect(identity.domainEvents.some((e) => e.eventType === 'auth:identity-activated')).toBe(true);
  });

  it('rejects invalid verification codes with domainCode', async () => {
    const result = await verify.execute({
      email: 'user@example.com',
      code: '000000',
      purpose: 'EmailVerify',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.context?.domainCode).toBe(AuthDomainCode.INVALID_OR_EXPIRED_CODE);
    }
  });

  it('does not allow replaying a consumed verification code', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    await send.execute({ email: 'user@example.com', purpose: 'EmailVerify' });
    const code = (emailSender.sendEmailVerificationCode as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as string;

    await verify.execute({ email: 'user@example.com', code, purpose: 'EmailVerify' });
    const replay = await verify.execute({ email: 'user@example.com', code, purpose: 'EmailVerify' });

    expect(replay.ok).toBe(false);
    if (!replay.ok) {
      expect(replay.error.context?.domainCode).toBe(AuthDomainCode.INVALID_OR_EXPIRED_CODE);
    }
  });
});
