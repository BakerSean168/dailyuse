import type { Component } from 'vue';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

type Result<T> = { ok: true; data: T } | { ok: false; error: { message?: string } };

type GenericApiClient = Record<string, (...args: unknown[]) => Promise<unknown>>;

export type ITaskTemplateApiClient = GenericApiClient;
export type ITaskInstanceApiClient = GenericApiClient;
export type ITaskDependencyApiClient = GenericApiClient;
export type IGoalApiClient = GenericApiClient;
export type IScheduleTaskApiClient = GenericApiClient;
export type IReminderApiClient = GenericApiClient;
export type IRepositoryApiClient = GenericApiClient;
export type IAuthApiClient = GenericApiClient;
export type INotificationApiClient = GenericApiClient;
export type ISettingApiClient = GenericApiClient;
export type IRuleApiClient = GenericApiClient;

export interface IAccountApiClient {
  getMyProfile: () => Promise<Result<{ toDTO: () => AccountClientDTO }>>;
  updateMyProfile: (req: UpdateAccountReq) => Promise<Result<{ toDTO: () => AccountClientDTO }>>;
  checkAvailability: (req: CheckAvailabilityReq) => Promise<Result<{ available: boolean }>>;
  closeAccount: (req: CloseAccountReq) => Promise<Result<unknown>>;
}

export interface NavigationItem {
  path: string;
  title: string;
  icon?: Component;
}
