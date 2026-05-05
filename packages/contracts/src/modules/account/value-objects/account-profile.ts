/**
 * 个人资料信息
 */

import type { DomainDate, TransferDate } from '../../../primitives';

import type { GenderType } from './gender-type';

export interface AccountProfile {
  nickname: string;
  realName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: GenderType;
  birthday: DomainDate | null;
}

export interface AccountProfileDTO {
  nickname: string;
  realName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: GenderType;
  birthday: TransferDate | null;
}
