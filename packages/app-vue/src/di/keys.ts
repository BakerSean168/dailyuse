import type { InjectionKey } from 'vue';
import type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
  IGoalApiClient,
  IScheduleTaskApiClient,
  IReminderApiClient,
  IRepositoryApiClient,
  IAccountApiClient,
  IAuthApiClient,
  INotificationApiClient,
  ISettingApiClient,
  IRuleApiClient,
  NavigationItem,
} from './types';

export const TASK_TEMPLATE_SERVICE_KEY: InjectionKey<ITaskTemplateApiClient> = Symbol('TaskTemplateService');
export const TASK_INSTANCE_SERVICE_KEY: InjectionKey<ITaskInstanceApiClient> = Symbol('TaskInstanceService');
export const TASK_DEPENDENCY_SERVICE_KEY: InjectionKey<ITaskDependencyApiClient> = Symbol('TaskDependencyService');
export const GOAL_SERVICE_KEY: InjectionKey<IGoalApiClient> = Symbol('GoalService');
export const SCHEDULE_SERVICE_KEY: InjectionKey<IScheduleTaskApiClient> = Symbol('ScheduleService');
export const REMINDER_SERVICE_KEY: InjectionKey<IReminderApiClient> = Symbol('ReminderService');
export const REPOSITORY_SERVICE_KEY: InjectionKey<IRepositoryApiClient> = Symbol('RepositoryService');
export const ACCOUNT_SERVICE_KEY: InjectionKey<IAccountApiClient> = Symbol('AccountService');
export const AUTH_SERVICE_KEY: InjectionKey<IAuthApiClient> = Symbol('AuthService');
export const NOTIFICATION_SERVICE_KEY: InjectionKey<INotificationApiClient> = Symbol('NotificationService');
export const SETTING_SERVICE_KEY: InjectionKey<ISettingApiClient> = Symbol('SettingService');
export const RULE_SERVICE_KEY: InjectionKey<IRuleApiClient> = Symbol('RuleService');

export const MAIN_NAVIGATION_KEY: InjectionKey<NavigationItem[]> = Symbol('MainNavigation');
export const BOTTOM_NAVIGATION_KEY: InjectionKey<NavigationItem[]> = Symbol('BottomNavigation');
export const IS_AUTHENTICATED_KEY: InjectionKey<() => boolean> = Symbol('IsAuthenticated');
export const USER_NAME_KEY: InjectionKey<string> = Symbol('UserName');
export const LOGOUT_HANDLER_KEY: InjectionKey<() => void> = Symbol('LogoutHandler');
