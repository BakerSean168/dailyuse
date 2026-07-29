import { createIdType } from '@memoflow/utils/domain';

import type { AuthCredentialId as IAuthCredentialId } from '@memoflow/contracts/authentication';

export const AuthCredentialId = createIdType<IAuthCredentialId>('AuthCredentialId');
export type AuthCredentialId = IAuthCredentialId;
