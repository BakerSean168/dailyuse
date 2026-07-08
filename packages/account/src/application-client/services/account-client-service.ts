/**
 * Account Client Service
 *
 * Coordinates API calls and client-side domain model mapping.
 * All methods return Result<T>, with success/failure handled by the Composable layer.
 */

import type { Result } from '@dailyuse/contracts/result';
import { map as mapResult } from '@dailyuse/contracts/result';
import type { IAccountApiClient } from '../ports/account-api-client.port';
import type {
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  UpdateAccountSettingsReq,
  UpdateAccountSettingsRes,
  AccountClientDTO,
} from '@dailyuse/contracts/account';
import { Account } from '../../domain-client';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '../../server/domain/value-objects';

function accountFromDTO(dto: AccountClientDTO): Account {
  return Account.load({
    id: IdentityId.of(dto.id),
    profile: AccountProfile.create(dto.profile),
    email: ContactEmail.create(dto.email),
    settings: AccountSettings.create(dto.settings),
    status: AccountStatus.of(dto.status),
    phone: dto.phone ? ContactPhone.create(dto.phone) : null,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

// ─── Client Application Port ────────────────────────────────────────────────

/** High-level client-side operations for the account module. */
export interface AccountClientPort {
  getMyProfile(): Promise<Result<Account>>;
  updateMyProfile(request: UpdateAccountReq): Promise<Result<Account>>;
  checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>>;
  updateSettings(request: UpdateAccountSettingsReq): Promise<Result<UpdateAccountSettingsRes>>;
  closeAccount(request: CloseAccountReq): Promise<Result<void>>;
}

export class AccountClientService implements AccountClientPort {
  constructor(private readonly apiClient: IAccountApiClient) {
    this.getMyProfile = this.getMyProfile.bind(this);
    this.updateMyProfile = this.updateMyProfile.bind(this);
    this.checkAvailability = this.checkAvailability.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.closeAccount = this.closeAccount.bind(this);
  }

  async getMyProfile(): Promise<Result<Account>> {
    const result = await this.apiClient.getMyProfile();
    return mapResult(result, (dto) => accountFromDTO(dto));
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<Account>> {
    const result = await this.apiClient.updateMyProfile(request);
    return mapResult(result, (dto) => accountFromDTO(dto));
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return this.apiClient.checkAvailability(request);
  }

  async updateSettings(
    request: UpdateAccountSettingsReq,
  ): Promise<Result<UpdateAccountSettingsRes>> {
    return this.apiClient.updateSettings(request);
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.apiClient.closeAccount(request);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create an `AccountClientService` from any transport adapter. */
export function createAccountClientService(apiClient: IAccountApiClient): AccountClientService {
  return new AccountClientService(apiClient);
}
