/**
 * 个人资料信息
 *
 * ADR-037 W5: birthday is a calendar day (`Ymd`), not midnight Date / epoch Instant.
 */

import type { TransferDate, Ymd } from '../../../primitives';

import type { GenderType } from './gender-type';

export interface AccountProfile {
  nickname: string;
  realName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: GenderType;
  /** Local calendar day of birth (YYYY-MM-DD), not an Instant. */
  birthday: Ymd | null;
}

export interface AccountProfileDTO {
  nickname: string;
  realName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: GenderType;
  /**
   * Wire birthday as Ymd string. Legacy epoch-ms values are accepted in mappers
   * via Codec during migration; new writes must use Ymd.
   */
  birthday: Ymd | TransferDate | null;
}
