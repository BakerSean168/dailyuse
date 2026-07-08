import type {
  CheckAvailabilityUseCase,
  CloseAccountUseCase,
  GetAccountProfileUseCase,
  ListAccountsUseCase,
  UpdateAccountProfileUseCase,
  UpdateAccountSettingsUseCase,
} from './use-cases';

/**
 * Transport-neutral account application surface.
 */
export type AccountListOptions = Parameters<ListAccountsUseCase['execute']>[0];
export type AccountListResult = Awaited<ReturnType<ListAccountsUseCase['execute']>>;

export interface AccountApplicationPort {
  listAccounts(options?: AccountListOptions): Promise<AccountListResult>;
  getProfile(
    cx: Parameters<GetAccountProfileUseCase['execute']>[0],
  ): Promise<Awaited<ReturnType<GetAccountProfileUseCase['execute']>>>;
  updateProfile(
    data: Parameters<UpdateAccountProfileUseCase['execute']>[0],
    cx: Parameters<UpdateAccountProfileUseCase['execute']>[1],
  ): Promise<Awaited<ReturnType<UpdateAccountProfileUseCase['execute']>>>;
  updateSettings(
    data: Parameters<UpdateAccountSettingsUseCase['execute']>[0],
    cx: Parameters<UpdateAccountSettingsUseCase['execute']>[1],
  ): Promise<Awaited<ReturnType<UpdateAccountSettingsUseCase['execute']>>>;
  checkAvailability(
    data: Parameters<CheckAvailabilityUseCase['execute']>[0],
  ): Promise<Awaited<ReturnType<CheckAvailabilityUseCase['execute']>>>;
  closeAccount(
    data: Parameters<CloseAccountUseCase['execute']>[0],
    cx: Parameters<CloseAccountUseCase['execute']>[1],
  ): Promise<Awaited<ReturnType<CloseAccountUseCase['execute']>>>;
}
