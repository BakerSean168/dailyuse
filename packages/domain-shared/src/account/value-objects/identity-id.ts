import { createIdType } from '@dailyuse/utils';

import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';

export const IdentityId = createIdType<IIdentityId>('IdentityId');
export type IdentityId = IIdentityId;