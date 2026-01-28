/**
 * 个人资料信息
 */

import type { DomainDate, PersistenceDate } from "@/primitives";
import type { TransferDate } from "@/primitives";

import type { GenderType } from "./gender-type";

export interface AccountProfile {
  nickname: string;     // 昵称
  realName?: string;    // 实名 (可选)
  avatarUrl?: string;   // 头像链接
  bio?: string;         // 个人简介
  gender: GenderType;
  birthday?: DomainDate; // 生日
}


export interface AccountProfileDTO {
  nickname: string;     // 昵称
  realName?: string;    // 实名 (可选)
  avatarUrl?: string;   // 头像链接
  bio?: string;         // 个人简介
  gender: GenderType;
  birthday?: TransferDate; // 生日
}

export interface AccountProfilePersistenceDTO {
  nickname: string;     // 昵称
  realName?: string;    // 实名 (可选)
  avatarUrl?: string;   // 头像链接
  bio?: string;         // 个人简介
  gender: GenderType;
  birthday?: PersistenceDate; // 生日
}