import { createIdType } from '@dailyuse/utils';

import type { AuthCredentialId as IAuthCredentialId } from '@dailyuse/contracts/authentication';

export const AuthCredentialId = createIdType<IAuthCredentialId>('AuthCredentialId');
export type AuthCredentialId = IAuthCredentialId;