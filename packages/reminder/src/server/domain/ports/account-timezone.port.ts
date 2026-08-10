/**
 * Account Timezone Port
 *
 * 抽象账号/Identity 时区查询端口，解耦 reminder 模块对 account 模块的具体实现与 ORM 依赖。
 */
export interface AccountTimezonePort {
  /**
   * 根据 identityId 获取该账号配置的时区字符串（如 'Asia/Shanghai'）。
   * 若账号不存在、无配置或配置为空，返回 null。
   */
  getUserTimezone(identityId: string): Promise<string | null>;
}
