import { describe, expect, it, vi } from 'vitest';
import type { IWalletRepository } from '../../../../domain';
import {
  CreateWalletAccountUseCase,
  ListWalletUseCase,
  RecordWalletTransactionUseCase,
} from '../wallet.use-cases';
import { WalletAccountNotFoundError } from '../../../errors/wallet-account-not-found-error';

function mockRepo(): IWalletRepository {
  return {
    createAccount: vi.fn(async (input) => ({
      id: 'w-1',
      name: input.name,
      currency: input.currency ?? 'CNY',
      balance: '0',
    })),
    listAccounts: vi.fn(async () => []),
    recordTransaction: vi.fn(async (input) => ({
      id: 't-1',
      accountId: input.accountId,
      type: input.type,
      amount: input.amount,
      category: input.category ?? null,
      note: input.note ?? null,
      goalId: input.goalId ?? null,
      occurredAt: Date.now(),
    })),
    listTransactions: vi.fn(async () => []),
  };
}

describe('Wallet use cases (R7)', () => {
  it('creates a wallet account with a default CNY currency', async () => {
    const repo = mockRepo();
    const useCase = new CreateWalletAccountUseCase(repo);

    const result = await useCase.execute('identity-1', { name: '日常' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.currency).toBe('CNY');
      expect(repo.createAccount).toHaveBeenCalledWith({
        identityId: 'identity-1',
        name: '日常',
      });
    }
  });

  it('rejects a blank account name', async () => {
    const useCase = new CreateWalletAccountUseCase(mockRepo());

    const result = await useCase.execute('identity-1', { name: '   ' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects a non-positive amount', async () => {
    const repo = mockRepo();
    const useCase = new RecordWalletTransactionUseCase(repo);

    const result = await useCase.execute('identity-1', {
      accountId: 'w-1',
      type: 'expense',
      amount: '0',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Amount must be a positive number');
    }
    expect(repo.recordTransaction).not.toHaveBeenCalled();
  });

  it('maps ACCOUNT_NOT_FOUND to NOT_FOUND', async () => {
    const repo = mockRepo();
    repo.recordTransaction = vi.fn(async () => {
      throw new WalletAccountNotFoundError();
    });
    const useCase = new RecordWalletTransactionUseCase(repo);

    const result = await useCase.execute('identity-1', {
      accountId: 'missing',
      type: 'income',
      amount: '10',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Wallet account not found');
    }
  });

  it('rethrows non-ACCOUNT_NOT_FOUND repository errors', async () => {
    const repo = mockRepo();
    repo.recordTransaction = vi.fn(async () => {
      throw new Error('DB exploded');
    });
    const useCase = new RecordWalletTransactionUseCase(repo);

    await expect(
      useCase.execute('identity-1', { accountId: 'w-1', type: 'income', amount: '10' }),
    ).rejects.toThrow('DB exploded');
  });

  it('lists accounts and transactions together', async () => {
    const repo = mockRepo();
    const useCase = new ListWalletUseCase(repo);

    const result = await useCase.execute('identity-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ accounts: [], transactions: [] });
    }
    expect(repo.listAccounts).toHaveBeenCalledWith('identity-1');
    expect(repo.listTransactions).toHaveBeenCalledWith('identity-1', 50);
  });
});
