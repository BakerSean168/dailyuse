/**
 * Account Application Services
 *
 * Named exports for all account-related application services.
 */

// Container
export { AccountContainer } from '@dailyuse/infrastructure-client';

// Events
export {
  AccountProfileEvents,
  AccountSubscriptionEvents,
  type AccountProfileRefreshEvent,
  type AccountSubscriptionRefreshEvent,
} from './account-events';

// ===== Profile Use Cases =====

export { GetMyProfile } from './get-my-profile';
export { UpdateMyProfile } from './update-my-profile';
export { ChangeMyPassword } from './change-my-password';
export { GetAccountById } from './get-account-by-id';
export { UpdateAccountProfile } from './update-account-profile';
export { UpdateAccountPreferences } from './update-account-preferences';
export { UpdateEmail } from './update-email';
export { VerifyEmail } from './verify-email';
export { UpdatePhone } from './update-phone';
export { VerifyPhone } from './verify-phone';
export { DeactivateAccount } from './deactivate-account';
export { ActivateAccount } from './activate-account';
export { DeleteAccount } from './delete-account';
export { GetAccountHistory } from './get-account-history';

// ===== Subscription Use Cases =====

export { GetSubscription } from './get-subscription';
export { SubscribePlan } from './subscribe-plan';
export { CancelSubscription } from './cancel-subscription';
export { GetAccountStats } from './get-account-stats';
