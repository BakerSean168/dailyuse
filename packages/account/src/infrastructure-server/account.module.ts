import type { IAccountRepository } from '../domain-server';
import {
  GetAccountProfileUseCase,
  UpdateAccountProfileUseCase,
  CloseAccountUseCase,
  CheckAvailabilityUseCase,
} from '../application-server';

export interface AccountModuleRepositories {
  readonly accountRepository: IAccountRepository;
}

export class AccountModule {
  public readonly accountRepository: IAccountRepository;

  public readonly getProfile: GetAccountProfileUseCase;
  public readonly updateProfile: UpdateAccountProfileUseCase;
  public readonly closeAccount: CloseAccountUseCase;
  public readonly checkAvailability: CheckAvailabilityUseCase;

  constructor(repositories: AccountModuleRepositories) {
    this.accountRepository = repositories.accountRepository;

    this.getProfile = new GetAccountProfileUseCase(this.accountRepository);
    this.updateProfile = new UpdateAccountProfileUseCase(this.accountRepository);
    this.closeAccount = new CloseAccountUseCase(this.accountRepository);
    this.checkAvailability = new CheckAvailabilityUseCase(this.accountRepository);
  }
}
