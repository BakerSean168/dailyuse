import type { Component } from 'vue';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

type Result<T> = { ok: true; data: T } | { ok: false; error: { message?: string } };

type GenericClientService = Record<string, (...args: unknown[]) => Promise<unknown>>;

export type ITaskTemplateApiClient = GenericClientService;
export type ITaskInstanceApiClient = GenericClientService;
export type ITaskDependencyApiClient = GenericClientService;
export type IGoalApiClient = GenericClientService;
export type IScheduleTaskApiClient = GenericClientService;
export type IReminderApiClient = GenericClientService;
export type IRepositoryApiClient = GenericClientService;
export type IAuthApiClient = GenericClientService;
export type INotificationApiClient = GenericClientService;
export type ISettingApiClient = GenericClientService;
export type IRuleApiClient = GenericClientService;

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
