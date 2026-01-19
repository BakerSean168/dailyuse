/**
 * Account Domain Client
 * 账户模块客户端实现
 */

// Application Layer - Services
export {
  AccountProfileApplicationService,
  AccountSubscriptionApplicationService,
} from './application';

// 聚合根
export { Account } from './aggregates/Account';

// 实体
export { Subscription } from './entities/Subscription';
export { AccountHistory } from './entities/AccountHistory';

// 验证器
export {
  EmailValidator,
  PhoneNumberValidator,
  UsernameValidator,
  DisplayNameValidator,
  StorageQuotaValidator,
  AgeValidator,
  TimezoneValidator,
  LanguageValidator,
  type ValidationResult,
} from './validators/AccountValidators';
