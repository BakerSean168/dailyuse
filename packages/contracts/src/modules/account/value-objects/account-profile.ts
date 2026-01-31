/**
 * 个人资料信息
 */

import type { DomainDate, PersistenceDate } from "@/primitives";
import type { TransferDate } from "@/primitives";

import type { GenderType } from "./gender-type";

export interface AccountProfile {
  nickname: string;     // 昵称
  realName: string | null;    // 实名
  avatarUrl: string | null;   // 头像链接
  bio: string | null;         // 个人简介
  gender: GenderType;
  birthday: DomainDate | null; // 生日
}


export interface AccountProfileDTO {
  nickname: string;     // 昵称
  realName: string | null;    // 实名
  avatarUrl: string | null;   // 头像链接
  bio: string | null;         // 个人简介
  gender: GenderType;
  birthday: TransferDate | null; // 生日
}

export interface AccountProfilePersistenceDTO {
  nickname: string;     // 昵称
  realName: string | null;    // 实名
  avatarUrl: string | null;   // 头像链接
  bio: string | null;         // 个人简介
  gender: GenderType;
  birthday: PersistenceDate | null; // 生日
}
