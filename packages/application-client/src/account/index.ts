/**
 * Account Application Module (Client)
 *
 * 账户模块 - 负责账户资料、偏好和订阅管理
 */

// Container
export { AccountContainer } from '@dailyuse/infrastructure-client';

// Services - All exports
export {
  // Events
  AccountProfileEvents,
  AccountSubscriptionEvents,
  type AccountProfileRefreshEvent,
  type AccountSubscriptionRefreshEvent,
  
  // Profile Use Cases
  GetMyProfile,
  UpdateMyProfile,
  ChangeMyPassword,
  GetAccountById,
  UpdateAccountProfile,
  UpdateAccountPreferences,
  UpdateEmail,
  VerifyEmail,
  UpdatePhone,
  VerifyPhone,
  DeactivateAccount,
  ActivateAccount,
  DeleteAccount,
  GetAccountHistory,
  
  // Subscription Use Cases
  GetSubscription,
  SubscribePlan,
  CancelSubscription,
  GetAccountStats,
  
  // Legacy exports (deprecated)
  AccountProfileApplicationService,
  createAccountProfileApplicationService,
  AccountSubscriptionApplicationService,
  createAccountSubscriptionApplicationService,
} from './services';
