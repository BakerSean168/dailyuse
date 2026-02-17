import type { IAccountRepository } from '../../domain-server';

export class AccountContainer {
  private static instance: AccountContainer;
  private accountRepository?: IAccountRepository;

  private constructor() {}

  static getInstance(): AccountContainer {
    if (!AccountContainer.instance) {
      AccountContainer.instance = new AccountContainer();
    }
    return AccountContainer.instance;
  }

  setAccountRepository(repository: IAccountRepository): void {
    this.accountRepository = repository;
  }

  getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      throw new Error('AccountRepository not registered in AccountContainer');
    }
    return this.accountRepository;
  }

  reset(): void {
    this.accountRepository = undefined;
  }
}
