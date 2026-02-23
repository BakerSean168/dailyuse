/**
 * UserSetting Aggregate Root - Client Interface
 * 用户设置聚合根 - 客户端接口
 */

import type { SettingId, IdentityId, TransferDate } from '@/primitives';
import type { UserSettingPreferences } from '../preferences';

// ============ DTO 定义 ============

/**
 * UserSetting Client DTO — 发送给客户端的用户设置
 *
 * 与 ServerDTO 结构一致，使用 typed preferences。
 */
export interface UserSettingClientDTO extends UserSettingPreferences {
  id: SettingId;
  identityId: IdentityId;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
