import { ValueObject } from '@dailyuse/utils';
import type { AccountSettingsDTO, AccountSettingsPersistenceDTO, AccountSettings as IAccountSettings } from '@dailyuse/contracts/account';
import { ThemeType } from './theme-type';

export class AccountSettings extends ValueObject<AccountSettingsDTO> implements IAccountSettings {

  private constructor(props: AccountSettingsDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的设置值对象（包含校验）
   */
  public static create(props: AccountSettingsDTO): AccountSettings {
    this.validate(props);
    return new AccountSettings(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 生成业务默认状态
   * 场景: 用户注册时，生成默认的账户设置
   */
  public static createDefault(): AccountSettings {
    return new AccountSettings({
      theme: ThemeType.SYSTEM,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      notificationEnabled: true,
    });
  }

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: AccountSettingsDTO): void {
    // 校验主题有效性
    ThemeType.of(props.theme);
    
    // 校验语言代码格式（简单校验）
    if (!props.language || props.language.length === 0) {
      throw new Error('Language code cannot be empty');
    }
    
    // 校验时区非空
    if (!props.timezone || props.timezone.length === 0) {
      throw new Error('Timezone cannot be empty');
    }
  }
  // ================= 行为 (不可变变更) =================
  // 所有的 Update 必须返回新的实例 (Immutability)

  /**
   * 切换主题
   */
  public switchTheme(theme: ThemeType): AccountSettings {
    const newProps = { ...this.props, theme };
    AccountSettings.validate(newProps); // 👈 变更时也必须校验
    return new AccountSettings(newProps);
  }

  /**
   * 切换语言
   */
  public switchLanguage(language: string): AccountSettings {
    const newProps = { ...this.props, language };
    AccountSettings.validate(newProps);
    return new AccountSettings(newProps);
  }

  /**
   * 设置时区
   */
  public setTimezone(timezone: string): AccountSettings {
    const newProps = { ...this.props, timezone };
    AccountSettings.validate(newProps);
    return new AccountSettings(newProps);
  }

  /**
   * 切换通知状态
   */
  public toggleNotification(): AccountSettings {
    return new AccountSettings({
      ...this.props,
      notificationEnabled: !this.props.notificationEnabled
    });
  }

  /**
   * 启用通知
   */
  public enableNotification(): AccountSettings {
    return new AccountSettings({
      ...this.props,
      notificationEnabled: true
    });
  }

  /**
   * 禁用通知
   */
  public disableNotification(): AccountSettings {
    return new AccountSettings({
      ...this.props,
      notificationEnabled: false
    });
  }

  // ================= 计算属性 (Rich Logic) =================

  /**
   * 是否为深色主题
   */
  public isDarkTheme(): boolean {
    return this.props.theme === ThemeType.DARK;
  }

  /**
   * 是否为浅色主题
   */
  public isLightTheme(): boolean {
    return this.props.theme === ThemeType.LIGHT;
  }

  /**
   * 是否跟随系统
   */
  public isSystemTheme(): boolean {
    return this.props.theme === ThemeType.SYSTEM;
  }

  // ================= Getters =================

  get theme(): ThemeType {
    return ThemeType.of(this.props.theme);
  }

  get language(): string {
    return this.props.language;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get notificationEnabled(): boolean {
    return this.props.notificationEnabled;
  }

  public static fromPersistenceDTO(dto: AccountSettingsPersistenceDTO): AccountSettings {
    return new AccountSettings({
      theme: ThemeType.of(dto.theme),
      language: dto.language,
      timezone: dto.timezone,
      notificationEnabled: dto.notificationEnabled
    });
  }

  /**
   * 转换为持久化格式
   * 职责: 处理数据类型转换，便于数据库存储
   */
  public toPersistenceDTO(): AccountSettingsPersistenceDTO {
    return { ...this.props };
  } 

  /**
   * 转换为 API/Client DTO
   */
  public toDTO(): AccountSettingsDTO {
    return { ...this.props };
  }
}