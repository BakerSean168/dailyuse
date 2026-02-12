import type { UserSetting } from '../aggregates/user-setting';

export interface UserSettingQueryOptions {
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * UserSetting 仓储接口
 * 定义持久化操作
 */
export interface IUserSettingRepository {
  /**
   * 根据账户UUID查找用户设置
   */
  findByAccountUuid(accountUuid: string): Promise<UserSetting | null>;

  /**
   * 保存用户设置
   */
  save(setting: UserSetting): Promise<void>;

  /**
   * 删除用户设置
   */
  delete(accountUuid: string): Promise<void>;
}
