import type { IAccountRepository } from '../repositories/i-account-repository';

export class AccountUniquenessChecker {
  constructor(private readonly accountRepo: IAccountRepository) {}

  /**
   * 检查邮箱是否唯一
   * 这是一个典型的 Domain Service 职责：需要查库，无法在聚合根内部完成
   */
  async isEmailUnique(email: string): Promise<boolean> {
    const existing = await this.accountRepo.findByEmail(email);
    return existing === null;
  }
  
  
}