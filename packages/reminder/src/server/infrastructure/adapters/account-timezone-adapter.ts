import type { AccountTimezonePort } from '../../domain/ports/account-timezone.port';

/**
 * 账号应用/控制器端口到 AccountTimezonePort 的适配器。
 * 允许 Reminder 模块通过泛型 API 依赖读取账号设置中的时区，而不依赖 ORM。
 */
export class AccountApplicationTimezoneAdapter implements AccountTimezonePort {
  constructor(
    private readonly accountApi?: {
      getProfile?(cx: { identityId: string }): Promise<{
        ok: boolean;
        data?: { settings?: { timezone?: string | null } } | null;
      }>;
    } | null,
  ) {}

  async getUserTimezone(identityId: string): Promise<string | null> {
    if (!identityId || !this.accountApi || typeof this.accountApi.getProfile !== 'function') {
      return null;
    }
    try {
      const res = await this.accountApi.getProfile({ identityId });
      if (res && res.ok && res.data?.settings?.timezone) {
        return res.data.settings.timezone;
      }
    } catch {
      // 异常时不吞吐错误，返回 null 供上层切入 'UTC' 显式默认
    }
    return null;
  }
}
