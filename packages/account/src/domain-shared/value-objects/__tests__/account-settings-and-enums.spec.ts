import { describe, expect, it } from 'vitest';
import { AccountSettings } from '../account-settings';
import { AccountStatus } from '../account-status';
import { GenderType } from '../gender-type';
import { LanguageCode } from '../language-code';
import { ThemeType } from '../theme-type';

describe('Account domain shared value objects', () => {
  it('validates and classifies account statuses', () => {
    expect(AccountStatus.of('Active')).toBe(AccountStatus.Active);
    expect(AccountStatus.getAll()).toEqual([
      AccountStatus.Active,
      AccountStatus.Suspended,
      AccountStatus.Deactivated,
    ]);
    expect(AccountStatus.canLogin(AccountStatus.Active)).toBe(true);
    expect(AccountStatus.canBeActivated(AccountStatus.Deactivated)).toBe(true);
    expect(AccountStatus.isSuspended(AccountStatus.Suspended)).toBe(true);
    expect(() => AccountStatus.of('Archived')).toThrow('Invalid account status: Archived');
  });

  it('derives locale helpers from language codes', () => {
    expect(LanguageCode.of('zh-CN')).toBe(LanguageCode.ZH_CN);
    expect(LanguageCode.isChinese(LanguageCode.ZH_CN)).toBe(true);
    expect(LanguageCode.isEnglish(LanguageCode.EN_US)).toBe(true);
    expect(LanguageCode.isJapanese(LanguageCode.JA_JP)).toBe(true);
    expect(LanguageCode.getIso639_1(LanguageCode.ZH_CN)).toBe('zh');
    expect(LanguageCode.getCountryCode(LanguageCode.EN_US)).toBe('US');
    expect(LanguageCode.getDirection(LanguageCode.JA_JP)).toBe('ltr');
    expect(LanguageCode.getHtmlLangAttribute(LanguageCode.EN_US)).toBe('en-US');
  });

  it('computes dark-mode behaviour from theme preference', () => {
    expect(ThemeType.of('Light')).toBe(ThemeType.Light);
    expect(ThemeType.isLight(ThemeType.Light)).toBe(true);
    expect(ThemeType.isDark(ThemeType.Dark)).toBe(true);
    expect(ThemeType.isSystem(ThemeType.System)).toBe(true);
    expect(ThemeType.shouldUseDarkMode(ThemeType.Light, true)).toBe(false);
    expect(ThemeType.shouldUseDarkMode(ThemeType.Dark, false)).toBe(true);
    expect(ThemeType.shouldUseDarkMode(ThemeType.System, true)).toBe(true);
    expect(ThemeType.getAll()).toEqual([ThemeType.Light, ThemeType.Dark, ThemeType.System]);
  });

  it('supports immutable settings mutations and persistence conversion', () => {
    const defaults = AccountSettings.createDefault();
    const updated = defaults
      .switchTheme(ThemeType.Dark)
      .switchLanguage(LanguageCode.EN_US)
      .setTimezone('UTC')
      .toggleNotification();

    expect(defaults.theme).toBe(ThemeType.System);
    expect(updated.theme).toBe(ThemeType.Dark);
    expect(updated.language).toBe(LanguageCode.EN_US);
    expect(updated.timezone).toBe('UTC');
    expect(updated.notificationEnabled).toBe(false);
    expect(updated.isDarkTheme()).toBe(true);
    expect(updated.enableNotification().notificationEnabled).toBe(true);
    expect(updated.disableNotification().notificationEnabled).toBe(false);
    expect(updated.toPersistenceDTO()).toEqual(updated.toDTO());
    expect(
      AccountSettings.fromPersistenceDTO({
        theme: ThemeType.Light,
        language: LanguageCode.JA_JP,
        timezone: 'Asia/Tokyo',
        notificationEnabled: true,
      }).isLightTheme(),
    ).toBe(true);
  });

  it('rejects invalid settings payloads and classifies gender values', () => {
    expect(() =>
      AccountSettings.create({
        theme: ThemeType.System,
        language: '' as LanguageCode,
        timezone: 'UTC',
        notificationEnabled: true,
      }),
    ).toThrow('Language code cannot be empty');
    expect(() =>
      AccountSettings.create({
        theme: ThemeType.System,
        language: LanguageCode.ZH_CN,
        timezone: '',
        notificationEnabled: true,
      }),
    ).toThrow('Timezone cannot be empty');
    expect(GenderType.of('Male')).toBe(GenderType.Male);
    expect(GenderType.isSpecified(GenderType.PreferNotToSay)).toBe(false);
    expect(GenderType.isSpecified(GenderType.Other)).toBe(true);
    expect(GenderType.getAll()).toContain(GenderType.Female);
  });
});
