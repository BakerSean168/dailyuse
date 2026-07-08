import type { IAccountRepository } from '../repositories/i-account-repository';

export class AccountUniquenessChecker {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async isEmailUnique(email: string): Promise<boolean> {
    const existing = await this.accountRepo.findByEmail(email);
    return existing === null;
  }
}
