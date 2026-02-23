/**
 * UserSetting Aggregate Root - Server Interface
 * 用户设置聚合根 - 服务端接口
 */

import type { SettingId, IdentityId, TransferDate } from '@/primitives';
import type { UserSettingPreferences } from '../preferences';

// ============ DTO 定义 ============

/**
 * UserSetting Server DTO — 完整的用户设置数据
 *
 * 使用 typed preferences 替代旧的 JSON string entries。
 * 每个分类是一个 typed 对象，而非序列化的字符串。
 */
export interface UserSettingServerDTO extends UserSettingPreferences {
  id: SettingId;
  identityId: IdentityId;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * @deprecated Use UserSettingServerDTO instead. Kept for migration compatibility.
 */
export interface UserSettingLegacyDTO {
  id: SettingId;
  identityId: IdentityId;
  entries: string;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

