import { describe, expect, it, vi } from 'vitest';
import { createCloudAccountProvisionerFromRepository } from './cloud-account-provisioner';

describe('CloudAccountProvisioner', () => {
  it('creates the Account projection when Better Auth creates a user', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };
    const provisioner = createCloudAccountProvisionerFromRepository(repository as never);

    await provisioner.provision({
      identityId: 'IdentityId_00000000-0000-4000-8000-000000000001',
      email: 'user@example.com',
      name: 'User',
      emailVerified: false,
    });

    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save.mock.calls[0]![0].email.isVerified).toBe(false);
    expect(repository.save.mock.calls[0]![0].profile.nickname).toBe('User');
  });

  it('falls back to the email-derived nickname when the cloud display name is invalid', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };
    const provisioner = createCloudAccountProvisionerFromRepository(repository as never);

    await provisioner.provision({
      identityId: 'user-1',
      email: 'fallback@example.com',
      name: 'x',
      emailVerified: false,
    });

    expect(repository.save.mock.calls[0]![0].profile.nickname).toBe('fallback');
  });

  it('projects Better Auth email verification onto an existing Account idempotently', async () => {
    const initialRepository = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };
    const initial = createCloudAccountProvisionerFromRepository(initialRepository as never);
    await initial.provision({
      identityId: 'IdentityId_00000000-0000-4000-8000-000000000001',
      email: 'user@example.com',
      name: 'User',
      emailVerified: false,
    });
    const account = initialRepository.save.mock.calls[0]![0];
    const repository = { findById: vi.fn().mockResolvedValue(account), save: vi.fn() };
    const provisioner = createCloudAccountProvisionerFromRepository(repository as never);

    await provisioner.provision({
      identityId: 'user-1',
      email: 'user@example.com',
      name: 'User',
      emailVerified: true,
    });
    expect(repository.save).toHaveBeenCalledOnce();
    expect(account.email.isVerified).toBe(true);

    repository.save.mockClear();
    await provisioner.provision({
      identityId: 'IdentityId_00000000-0000-4000-8000-000000000001',
      email: 'user@example.com',
      name: 'User',
      emailVerified: true,
    });
    expect(repository.save).not.toHaveBeenCalled();
    expect(account.email.isVerified).toBe(true);
  });

  it('does not rewrite an existing Account while the cloud email is still unverified', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({ email: { isVerified: false } }),
      save: vi.fn(),
    };
    const provisioner = createCloudAccountProvisionerFromRepository(repository as never);

    await provisioner.provision({
      identityId: 'user-1',
      email: 'user@example.com',
      name: 'User',
      emailVerified: false,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });
});
