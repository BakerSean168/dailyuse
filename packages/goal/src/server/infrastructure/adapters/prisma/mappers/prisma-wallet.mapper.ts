import type {
  WalletAccount as PrismaWalletAccount,
  WalletTransaction as PrismaWalletTransaction,
} from '@memoflow/database';
import type { WalletAccountDTO, WalletTransactionDTO } from '../../../../domain';

/**
 * Prisma Wallet 行 → Wallet DTO 映射器 / Prisma Wallet row → Wallet DTO mapper.
 *
 * 保留 Decimal 字段的字符串表示（禁止浮点运算），并把 Date 转为毫秒时间戳。
 * Preserves the string representation of Decimal fields (no float arithmetic)
 * and converts Date fields into epoch-millisecond numbers.
 */
export class PrismaWalletMapper {
  /** 账户行转换 / Maps a Prisma WalletAccount row to WalletAccountDTO. */
  static toAccountDTO(row: PrismaWalletAccount): WalletAccountDTO {
    return {
      id: row.id,
      name: row.name,
      currency: row.currency,
      balance: row.balance.toString(),
    };
  }

  /** 交易行转换 / Maps a Prisma WalletTransaction row to WalletTransactionDTO. */
  static toTransactionDTO(row: PrismaWalletTransaction): WalletTransactionDTO {
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
  }
}
