import { createIdType } from '@memoflow/utils/domain';

import type { AuthSessionId as IAuthSessionId } from '@memoflow/contracts/authentication';

export const AuthSessionId = createIdType<IAuthSessionId>('AuthSessionId');
export type AuthSessionId = IAuthSessionId;
