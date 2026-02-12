import { createIdType } from '@dailyuse/utils';

import type { AuthSessionId as IAuthSessionId } from '@dailyuse/contracts/authentication';

export const AuthSessionId = createIdType<IAuthSessionId>('AuthSessionId');
export type AuthSessionId = IAuthSessionId;
