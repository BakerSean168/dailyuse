import type { UserSetting } from '../aggregates/user-setting';

export interface UserSettingQueryOptions {
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * UserSetting 浠撳偍鎺ュ彛
 * 瀹氫箟鎸佷箙鍖栨搷浣?
 */
export interface IUserSettingRepository {
  /**
   * 鏍规嵁璐︽埛UUID鏌ユ壘鐢ㄦ埛璁剧疆
   */
  findByIdentityId(identityId: string): Promise<UserSetting | null>;

  /**
   * 淇濆瓨鐢ㄦ埛璁剧疆
   */
  save(setting: UserSetting): Promise<void>;

  /**
   * 鍒犻櫎鐢ㄦ埛璁剧疆
   */
  delete(identityId: string): Promise<void>;
}
