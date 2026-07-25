import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
} from '../../../../domain';
import { AuthIdentityStatus } from '../../../../domain';
import { DisableIdentityForAccountCloseUseCase } from '../disable-identity-for-account-close.use-case';

const createIdentity = (status: string) => ({
  id: IdentityId.generate(),
  status,
  disable: vi.fn(function disable(this: { status: string }) {
    this.status = AuthIdentityStatus.Disabled;
  }),
});

describe('DisableIdentityForAccountCloseUseCase', () => {
  let identityRepo: IAuthIdentityRepository;
  let sessionRepo: IAuthSessionRepository;
  let useCase: DisableIdentityForAccountCloseUseCase;

  beforeEach(() => {
    identityRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      findByOAuth: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
    };
    sessionRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIdForIdentity: vi.fn(),
      findByIdentityId: vi.fn(),
      remove: vi.fn(),
      removeAllByIdentityId: vi.fn().mockResolvedValue(undefined),
      removeExpired: vi.fn(),
    };
    useCase = new DisableIdentityForAccountCloseUseCase(identityRepo, sessionRepo);
  });

  it('disables identity and revokes all sessions', async () => {
    const identity = createIdentity(AuthIdentityStatus.Active);
    (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    const result = await useCase.execute(String(identity.id));

    expect(result.ok).toBe(true);
    expect(identity.disable).toHaveBeenCalled();
    expect(identityRepo.save).toHaveBeenCalledWith(identity);
    expect(sessionRepo.removeAllByIdentityId).toHaveBeenCalledWith(identity.id);
  });

  it('is idempotent when identity already disabled', async () => {
    const identity = createIdentity(AuthIdentityStatus.Disabled);
    (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    const result = await useCase.execute(String(identity.id));

    expect(result.ok).toBe(true);
    expect(identity.disable).not.toHaveBeenCalled();
    expect(identityRepo.save).not.toHaveBeenCalled();
    expect(sessionRepo.removeAllByIdentityId).toHaveBeenCalledWith(identity.id);
  });

  it('succeeds when identity is already gone and still revokes sessions', async () => {
    const missingId = IdentityId.generate();
    const result = await useCase.execute(String(missingId));
    expect(result.ok).toBe(true);
    expect(sessionRepo.removeAllByIdentityId).toHaveBeenCalledWith(missingId);
  });
});
