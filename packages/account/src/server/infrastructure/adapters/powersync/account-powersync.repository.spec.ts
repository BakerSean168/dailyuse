import { afterEach, describe, expect, it, vi } from 'vitest';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { eventBus } from '@memoflow/utils/domain';
import { Account } from '../../../domain';
import {
  PowerSyncAccountRepository,
  type Transactional,
} from './account-powersync.repository';

function createQueryable() {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({ count: 0 }),
    getOptional: vi.fn().mockResolvedValue(null),
    execute: vi.fn().mockResolvedValue(undefined),
  };
}

describe('PowerSyncAccountRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists with the provided transaction and flushes domain events', async () => {
    const defaultDb = {
      ...createQueryable(),
      writeTransaction: vi.fn(),
    } satisfies Transactional;
    const tx = createQueryable();
    const sendSpy = vi.spyOn(eventBus, 'send').mockImplementation(() => undefined);
    const account = Account.create({
      id: IdentityId.generate(),
      email: 'transaction@example.com',
    });
    const repository = new PowerSyncAccountRepository(defaultDb);

    await repository.save(account, tx);

    expect(tx.getOptional).toHaveBeenCalledOnce();
    expect(tx.execute).toHaveBeenCalledOnce();
    expect(defaultDb.getOptional).not.toHaveBeenCalled();
    expect(defaultDb.execute).not.toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalledWith('account:created', expect.any(Object));
    expect(account.domainEvents).toHaveLength(0);
  });
});
