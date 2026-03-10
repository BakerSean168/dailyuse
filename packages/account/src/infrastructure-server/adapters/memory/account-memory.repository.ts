import type { IAccountRepository } from '../../../domain-server';
import { Account } from '../../../domain-server';

export class MemoryAccountRepository implements IAccountRepository {
  private readonly accounts = new Map<string, Account>();

  async save(account: Account): Promise<void> {
    this.accounts.set(String(account.id), account);
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) ?? null;
  }

  async findByNickname(nickname: string): Promise<Account | null> {
    return (
      Array.from(this.accounts.values()).find((account) => {
        return account.profile.nickname === nickname;
      }) ?? null
    );
  }

  async findByEmail(email: string): Promise<Account | null> {
    return (
      Array.from(this.accounts.values()).find((account) => account.email.address === email) ?? null
    );
  }

  async findByPhone(phoneNumber: string): Promise<Account | null> {
    return (
      Array.from(this.accounts.values()).find((account) => {
        const phone = account.phone;
        return phone?.number === phoneNumber || phone?.fullNumber === phoneNumber;
      }) ?? null
    );
  }

  async existsByNickname(nickname: string): Promise<boolean> {
    return (await this.findByNickname(nickname)) !== null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async delete(id: string): Promise<void> {
    this.accounts.delete(id);
  }

  async findAll(options?: {
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }): Promise<{ accounts: Account[]; total: number }> {
    const mappedStatus =
      options?.status === 'INACTIVE' || options?.status === 'DELETED'
        ? 'DEACTIVATED'
        : (options?.status ?? undefined);

    const filtered = Array.from(this.accounts.values()).filter((account) => {
      if (!mappedStatus) return true;
      return String(account.status) === mappedStatus;
    });

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const accounts = filtered.slice(start, start + pageSize);

    return { accounts, total: filtered.length };
  }
}
