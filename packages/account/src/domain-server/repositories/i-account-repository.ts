import type { Account } from '../aggregates/account';

export interface IAccountRepository {
  save(account: Account, tx?: unknown): Promise<void>;
  findById(id: string, tx?: unknown): Promise<Account | null>;
  findByNickname(nickname: string, tx?: unknown): Promise<Account | null>;
  findByEmail(email: string, tx?: unknown): Promise<Account | null>;
  findByPhone(phoneNumber: string, tx?: unknown): Promise<Account | null>;
  existsByNickname(nickname: string, tx?: unknown): Promise<boolean>;
  existsByEmail(email: string, tx?: unknown): Promise<boolean>;
  delete(id: string, tx?: unknown): Promise<void>;
  findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    tx?: unknown,
  ): Promise<{ accounts: Account[]; total: number }>;
}
