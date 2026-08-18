/**
 * R7 钱包仓储 Port（domain-owned）。
 * R7 Wallet repository Port (domain-owned).
 *
 * 钱包写入只依赖本模块表（WalletAccount/WalletTransaction），与 Goal 的连接走
 * Relation contributes_to；Prisma 实现位于 infrastructure/adapters/prisma。
 * Wallet writes depend only on its own tables; the Goal link goes through a
 * Relation contributes_to; the Prisma implementation lives in
 * infrastructure/adapters/prisma.
 */

/** 钱包账户 DTO（balance 为 Decimal → string，精度安全）。/ Wallet account DTO (balance kept as string for Decimal precision). */
export interface WalletAccountDTO {
  id: string;
  name: string;
  currency: string;
  balance: string;
}

/** 钱包交易 DTO（amount 为 Decimal → string，occurredAt 为毫秒时间戳）。/ Wallet transaction DTO (amount as string, occurredAt in epoch milliseconds). */
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

/**
 * 钱包仓储 Port / Wallet repository Port.
 *
 * @remarks
 * - amount 校验与账户缺失映射由 use case 完成；`recordTransaction` 在账户缺失时
 *   抛出 `WalletAccountNotFoundError`（typed，消息文本仅供观测，控制流必须用
 *   instanceof）。Amount validation and the account-missing mapping happen in
 *   the use cases; `recordTransaction` throws `WalletAccountNotFoundError` when
 *   the account is missing (typed; the message text is observational only, branch
 *   with instanceof).
 * - `recordTransaction` 由实现保证单事务原子性（余额更新 + 交易写入同生共死）。
 *   Implementations must keep the balance update and the transaction insert
 *   atomic inside one database transaction.
 */
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
