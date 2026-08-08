/**
 * R7：Wallet 外部模块试点（暂驻 goal 包，验证 ModuleManifest 扩展性）。
 *
 * 契约纪律：钱包写入只依赖本模块表 + 通用 Relation/Activity 端口，
 * 不直接依赖 Goal/Task 数据表（与 Goal 的连接走 Relation contributes_to）。
 */

import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { PrismaClient } from '@memoflow/database';

export interface WalletAccountDTO {
  id: string;
  name: string;
  currency: string;
  balance: string; // Decimal → string（精度安全）
}

export interface WalletTransactionDTO {
  id: string;
  accountId: string;
  type: string;
  amount: string;
  category: string | null;
  note: string | null;
  goalId: string | null;
  occurredAt: number;
}

export interface IWalletRepository {
  createAccount(input: {
    identityId: string;
    name: string;
    currency?: string;
  }): Promise<WalletAccountDTO>;
  listAccounts(identityId: string): Promise<WalletAccountDTO[]>;
  recordTransaction(input: {
    identityId: string;
    accountId: string;
    type: 'income' | 'expense' | 'transfer';
    amount: string;
    category?: string | null;
    note?: string | null;
    goalId?: string | null;
    occurredAt?: number;
  }): Promise<WalletTransactionDTO>;
  listTransactions(identityId: string, limit?: number): Promise<WalletTransactionDTO[]>;
}

export class PrismaWalletRepository implements IWalletRepository {
  constructor(private readonly db: PrismaClient) {}

  async createAccount(input: {
    identityId: string;
    name: string;
    currency?: string;
  }): Promise<WalletAccountDTO> {
    const row = await this.db.walletAccount.create({
      data: {
        id: crypto.randomUUID(),
        identityId: input.identityId,
        name: input.name,
        currency: input.currency ?? 'CNY',
      },
    });
    return {
      id: row.id,
      name: row.name,
      currency: row.currency,
      balance: row.balance.toString(),
    };
  }

  async listAccounts(identityId: string): Promise<WalletAccountDTO[]> {
    const rows = await this.db.walletAccount.findMany({
      where: { identityId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      currency: r.currency,
      balance: r.balance.toString(),
    }));
  }

  async recordTransaction(input: {
    identityId: string;
    accountId: string;
    type: 'income' | 'expense' | 'transfer';
    amount: string;
    category?: string | null;
    note?: string | null;
    goalId?: string | null;
    occurredAt?: number;
  }): Promise<WalletTransactionDTO> {
    return this.db.$transaction(async (tx) => {
      const account = await tx.walletAccount.findFirst({
        where: { id: input.accountId, identityId: input.identityId },
      });
      if (!account) {
        throw new Error('ACCOUNT_NOT_FOUND');
      }
      const delta =
        input.type === 'income' ? input.amount : `-${input.amount}`;
      await tx.walletAccount.update({
        where: { id: account.id },
        data: { balance: { increment: delta } },
      });
      const row = await tx.walletTransaction.create({
        data: {
          id: crypto.randomUUID(),
          accountId: input.accountId,
          identityId: input.identityId,
          type: input.type,
          amount: input.amount,
          category: input.category ?? null,
          note: input.note ?? null,
          goalId: input.goalId ?? null,
          occurredAt: new Date(input.occurredAt ?? Date.now()),
        },
      });
      return {
        id: row.id,
        accountId: row.accountId,
        type: row.type,
        amount: row.amount.toString(),
        category: row.category,
        note: row.note,
        goalId: row.goalId,
        occurredAt: row.occurredAt.getTime(),
      };
    });
  }

  async listTransactions(
    identityId: string,
    limit?: number,
  ): Promise<WalletTransactionDTO[]> {
    const rows = await this.db.walletTransaction.findMany({
      where: { identityId },
      orderBy: { occurredAt: 'desc' },
      take: limit ?? 50,
    });
    return rows.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      type: r.type,
      amount: r.amount.toString(),
      category: r.category,
      note: r.note,
      goalId: r.goalId,
      occurredAt: r.occurredAt.getTime(),
    }));
  }
}

export class CreateWalletAccountUseCase {
  constructor(private readonly repository: IWalletRepository) {}

  async execute(
    identityId: string,
    input: { name: string; currency?: string },
  ): Promise<Result<WalletAccountDTO>> {
    if (!input.name.trim()) {
      return error('VALIDATION_ERROR', 'Account name is required');
    }
    return ok(await this.repository.createAccount({ identityId, ...input }));
  }
}

export class RecordWalletTransactionUseCase {
  constructor(private readonly repository: IWalletRepository) {}

  async execute(
    identityId: string,
    input: {
      accountId: string;
      type: 'income' | 'expense' | 'transfer';
      amount: string;
      category?: string | null;
      note?: string | null;
      goalId?: string | null;
      occurredAt?: number;
    },
  ): Promise<Result<WalletTransactionDTO>> {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return error('VALIDATION_ERROR', 'Amount must be a positive number');
    }
    try {
      return ok(await this.repository.recordTransaction({ identityId, ...input }));
    } catch (e) {
      if (e instanceof Error && e.message === 'ACCOUNT_NOT_FOUND') {
        return error('NOT_FOUND', 'Wallet account not found');
      }
      throw e;
    }
  }
}

export class ListWalletUseCase {
  constructor(private readonly repository: IWalletRepository) {}

  async execute(identityId: string): Promise<Result<{
    accounts: WalletAccountDTO[];
    transactions: WalletTransactionDTO[];
  }>> {
    const [accounts, transactions] = await Promise.all([
      this.repository.listAccounts(identityId),
      this.repository.listTransactions(identityId, 50),
    ]);
    return ok({ accounts, transactions });
  }
}
