export { EmailIdentifier } from './email-identifier';
export { PhoneIdentifier } from './phone-identifier';

import type { EmailIdentifier } from './email-identifier';
import type { PhoneIdentifier } from './phone-identifier';

/**
 * 具体标识符联合类型（值对象）
 * EmailIdentifier | PhoneIdentifier
 */
export type ConcreteIdentifier = EmailIdentifier | PhoneIdentifier;
