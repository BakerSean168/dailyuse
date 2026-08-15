import { describe, expect, it } from 'vitest';
import type {
  WalletAccount as PrismaWalletAccount,
  WalletTransaction as PrismaWalletTransaction,
} from '@memoflow/database';
import { PrismaWalletMapper } from './prisma-wallet.mapper';

/** Decimal-like value exposing the same `.toString()` surface the mapper uses. */
function decimalLike(value: string): unknown {
  return { toString: () => value };
}

describe('PrismaWalletMapper', () => {
  it('maps a WalletAccount row keeping balance as a Decimal-precise string', () => {
    const row = {
      id: 'acc-1',
      identityId: 'identity-1',
      name: '日常',
      currency: 'CNY',
      balance: decimalLike('1234567890123.456789'),
      createdAt: new Date(1_000),
      updatedAt: new Date(1_001),
    } as unknown as PrismaWalletAccount;

    const dto = PrismaWalletMapper.toAccountDTO(row);

    expect(dto).toEqual({
      id: 'acc-1',
      name: '日常',
      currency: 'CNY',
      balance: '1234567890123.456789',
    });
  });

  it('maps a WalletTransaction row keeping amount string and occurredAt epoch ms', () => {
    const row = {
      id: 'tx-1',
      accountId: 'acc-1',
      identityId: 'identity-1',
      type: 'income',
      amount: decimalLike('0.1'),
      category: 'salary',
      note: null,
      goalId: 'goal-1',
      occurredAt: new Date(1_700_000_000_000),
      createdAt: new Date(1_700_000_000_000),
    } as unknown as PrismaWalletTransaction;

    const dto = PrismaWalletMapper.toTransactionDTO(row);

    expect(dto).toEqual({
      id: 'tx-1',
      accountId: 'acc-1',
      type: 'income',
      amount: '0.1',
      category: 'salary',
      note: null,
      goalId: 'goal-1',
      occurredAt: 1_700_000_000_000,
    });
  });

  it('preserves Decimal precision without float arithmetic', () => {
    const row = {
      id: 'tx-2',
      accountId: 'acc-1',
      identityId: 'identity-1',
      type: 'expense',
      amount: decimalLike('999999999999.000001'),
      category: null,
      note: 'precision',
      goalId: null,
      occurredAt: new Date(2_000),
      createdAt: new Date(2_000),
    } as unknown as PrismaWalletTransaction;

    expect(PrismaWalletMapper.toTransactionDTO(row).amount).toBe('999999999999.000001');
  });
});
