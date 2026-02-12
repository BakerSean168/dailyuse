import { ValueObject } from '@dailyuse/utils';
import type { AccountSettingsDTO, AccountSettingsPersistenceDTO, AccountSettings as IAccountSettings } from '@dailyuse/contracts/account';
import { ThemeType } from './theme-type';
import { LanguageCode } from './language-code';

export class AccountSettings extends ValueObject<AccountSettingsDTO> implements IAccountSettings {

  private constructor(props: AccountSettingsDTO) {
    super(props);
  }

  public static create(props: AccountSettingsDTO): AccountSettings {
    this.validate(props);
    return new AccountSettings(props);
  }

  public static createDefault(): AccountSettings {
    return new AccountSettings({
      theme: ThemeType.SYSTEM,
      language: LanguageCode.ZH_CN,
      timezone: 'Asia/Shanghai',
      notificationEnabled: true,
    });
  }

  private static validate(props: AccountSettingsDTO): void {
    ThemeType.of(props.theme);
    if (!props.language || props.language.length === 0) {
      throw new Error('Language code cannot be empty');
    }
    if (!props.timezone || props.timezone.length === 0) {
      throw new Error('Timezone cannot be empty');
    }
  }

  public switchTheme(theme: ThemeType): AccountSettings {
    const newProps = { ...this.props, theme };
    AccountSettings.validate(newProps);
    return new AccountSettings(newProps);
  }

  public switchLanguage(language: LanguageCode): AccountSettings {
    const newProps = { ...this.props, language };
    AccountSettings.validate(newProps);
    return new AccountSettings(newProps);
  }

  public setTimezone(timezone: string): AccountSettings {
    const newProps = { ...this.props, timezone };
    AccountSettings.validate(newProps);
    return new AccountSettings(newProps);
  }

  public toggleNotification(): AccountSettings {
    return new AccountSettings({
      ...this.props,
      notificationEnabled: !this.props.notificationEnabled,
    });
  }

  public enableNotification(): AccountSettings {
    return new AccountSettings({ ...this.props, notificationEnabled: true });
  }

  public disableNotification(): AccountSettings {
    return new AccountSettings({ ...this.props, notificationEnabled: false });
  }

  public isDarkTheme(): boolean { return this.props.theme === ThemeType.DARK; }
  public isLightTheme(): boolean { return this.props.theme === ThemeType.LIGHT; }
  public isSystemTheme(): boolean { return this.props.theme === ThemeType.SYSTEM; }

  get theme(): ThemeType { return ThemeType.of(this.props.theme); }
  get language(): LanguageCode { return LanguageCode.of(this.props.language); }
  get timezone(): string { return this.props.timezone; }
  get notificationEnabled(): boolean { return this.props.notificationEnabled; }

  public static fromPersistenceDTO(dto: AccountSettingsPersistenceDTO): AccountSettings {
    return new AccountSettings({
      theme: ThemeType.of(dto.theme),
      language: LanguageCode.of(dto.language),
      timezone: dto.timezone,
      notificationEnabled: dto.notificationEnabled,
    });
  }

  public toPersistenceDTO(): AccountSettingsPersistenceDTO {
    return { ...this.props };
  }

  public toDTO(): AccountSettingsDTO {
    return { ...this.props };
  }
}
