import type { UserSetting } from '../aggregates/user-setting';

/**
 * IUserSettingRepository — 用户设置仓储接口
 *
 * 定义持久化操作，实现由 infrastructure 层提供。
 */
export interface IUserSettingRepository {
  /** 根据 identityId 查找用户设置 */
  findByIdentityId(identityId: string): Promise<UserSetting | null>;

  /** 保存用户设置（创建或更新） */
  save(setting: UserSetting): Promise<void>;

  /** 删除用户设置 */
  delete(identityId: string): Promise<void>;
}
