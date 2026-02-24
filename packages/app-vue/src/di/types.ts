import type { Component } from 'vue';

export interface ITaskTemplateApiClient {
  [key: string]: unknown;
}
export interface ITaskInstanceApiClient {
  [key: string]: unknown;
}
export interface ITaskDependencyApiClient {
  [key: string]: unknown;
}
export interface IGoalApiClient {
  [key: string]: unknown;
}
export interface IScheduleTaskApiClient {
  [key: string]: unknown;
}
export interface IReminderApiClient {
  [key: string]: unknown;
}
export interface IRepositoryApiClient {
  [key: string]: unknown;
}
export interface IAccountApiClient {
  [key: string]: unknown;
}
export interface IAuthApiClient {
  [key: string]: unknown;
}
export interface INotificationApiClient {
  [key: string]: unknown;
}
export interface ISettingApiClient {
  [key: string]: unknown;
}
export interface IRuleApiClient {
  [key: string]: unknown;
}

export interface NavigationItem {
  path: string;
  title: string;
  icon?: Component;
}
