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
} from '../../domain-shared';

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

export class AccountClientService {
  constructor(private readonly apiClient: IAccountApiClient) {}

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

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.apiClient.closeAccount(request);
  }
}
