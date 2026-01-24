/**
 * Setting IPC Client - Setting 妯″潡 IPC 瀹㈡埛绔? * 
 * @module renderer/modules/setting/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { SettingChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface AppSettingsDTO {
  general: GeneralSettingsDTO;
  appearance: AppearanceSettingsDTO;
  notifications: NotificationSettingsDTO;
  shortcuts: ShortcutSettingsDTO;
  privacy: PrivacySettingsDTO;
  sync: SyncSettingsDTO;
}

export interface GeneralSettingsDTO {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number;
  autoLaunch: boolean;
  minimizeToTray: boolean;
}

export interface AppearanceSettingsDTO {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface NotificationSettingsDTO {
  enabled: boolean;
  sound: boolean;
  soundFile?: string;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface ShortcutSettingsDTO {
  global: Record<string, string>;
  local: Record<string, string>;
}

export interface PrivacySettingsDTO {
  analytics: boolean;
  crashReports: boolean;
}

export interface SyncSettingsDTO {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export interface ThemeDTO {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
}

// ============ Setting IPC Client ============

/**
 * Setting IPC Client
 */
export class SettingIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Settings ============

  /**
   * GetAll鏈夎缃?   */
  async getAll(): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.GET_ALL,
      {}
    );
  }

  /**
   * 璁剧疆All鏈夎缃?   */
  async setAll(settings: Partial<AppSettingsDTO>): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.UPDATE,
      { settings }
    );
  }

  /**
   * Get璁剧疆
   */
  async get<K extends keyof AppSettingsDTO>(key: K): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.GET,
      { key }
    );
  }

  /**
   * Update璁剧疆
   */
  async update<K extends keyof AppSettingsDTO>(
    key: K,
    settings: Partial<AppSettingsDTO[K]>
  ): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.UPDATE,
      { key, settings }
    );
  }

  /**
   * 閲嶇疆璁剧疆
   */
  async reset(key?: keyof AppSettingsDTO): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.RESET,
      { key }
    );
  }

  // ============ Section Settings ============

  /**
   * Get璁剧疆鍒嗙被
   */
  async getSection<K extends keyof AppSettingsDTO>(section: K): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.SECTION_GET,
      { section }
    );
  }

  /**
   * Update璁剧疆鍒嗙被
   */
  async updateSection<K extends keyof AppSettingsDTO>(
    section: K,
    settings: Partial<AppSettingsDTO[K]>
  ): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.SECTION_UPDATE,
      { section, settings }
    );
  }

  // ============ Shortcuts ============

  /**
   * Get蹇嵎閿垪琛?   */
  async listShortcuts(): Promise<ShortcutSettingsDTO> {
    return this.client.invoke<ShortcutSettingsDTO>(
      SettingChannels.SHORTCUT_LIST,
      {}
    );
  }

  /**
   * 璁剧疆蹇嵎閿?   */
  async setShortcut(action: string, keys: string): Promise<void> {
    return this.client.invoke<void>(
      SettingChannels.SHORTCUT_SET,
      { action, keys }
    );
  }

  /**
   * 閲嶇疆蹇嵎閿?   */
  async resetShortcuts(): Promise<ShortcutSettingsDTO> {
    return this.client.invoke<ShortcutSettingsDTO>(
      SettingChannels.SHORTCUT_RESET,
      {}
    );
  }

  // ============ Theme ============

  /**
   * Get涓婚
   */
  async getTheme(): Promise<AppearanceSettingsDTO['theme']> {
    return this.client.invoke<AppearanceSettingsDTO['theme']>(
      SettingChannels.THEME_GET,
      {}
    );
  }

  /**
   * 璁剧疆涓婚
   */
  async setTheme(theme: AppearanceSettingsDTO['theme']): Promise<void> {
    return this.client.invoke<void>(
      SettingChannels.THEME_SET,
      { theme }
    );
  }

  /**
   * Get鍙敤涓婚List
   */
  async listThemes(): Promise<ThemeDTO[]> {
    return this.client.invoke<ThemeDTO[]>(
      SettingChannels.THEME_LIST,
      {}
    );
  }

  // ============ Language ============

  /**
   * Get璇█
   */
  async getLanguage(): Promise<string> {
    return this.client.invoke<string>(
      SettingChannels.LANGUAGE_GET,
      {}
    );
  }

  /**
   * 璁剧疆璇█
   */
  async setLanguage(language: string): Promise<void> {
    return this.client.invoke<void>(
      SettingChannels.LANGUAGE_SET,
      { language }
    );
  }

  // ============ Notifications ============

  /**
   * Get閫氱煡璁剧疆
   */
  async getNotificationSettings(): Promise<NotificationSettingsDTO> {
    return this.client.invoke<NotificationSettingsDTO>(
      SettingChannels.NOTIFICATION_GET,
      {}
    );
  }

  /**
   * Update閫氱煡璁剧疆
   */
  async updateNotificationSettings(settings: Partial<NotificationSettingsDTO>): Promise<NotificationSettingsDTO> {
    return this.client.invoke<NotificationSettingsDTO>(
      SettingChannels.NOTIFICATION_UPDATE,
      settings
    );
  }

  // ============ Backup ============

  /**
   * Create璁剧疆澶囦唤
   */
  async createBackup(): Promise<{ path: string }> {
    return this.client.invoke(
      SettingChannels.BACKUP_CREATE,
      {}
    );
  }

  /**
   * 鎭㈠璁剧疆
   */
  async restoreBackup(path: string): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.BACKUP_RESTORE,
      { path }
    );
  }

  /**
   * Get澶囦唤List
   */
  async listBackups(): Promise<Array<{ path: string; createdAt: number }>> {
    return this.client.invoke(
      SettingChannels.BACKUP_LIST,
      {}
    );
  }

  // ============ Import/Export ============

  /**
   * 瀵煎叆璁剧疆
   */
  async import(settingsJson: string): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.IMPORT,
      { settings: settingsJson }
    );
  }

  /**
   * 瀵煎嚭璁剧疆
   */
  async export(): Promise<string> {
    return this.client.invoke<string>(
      SettingChannels.EXPORT,
      {}
    );
  }

  // ============ Event Subscriptions ============

  /**
   * 璁㈤槄涓婚鍙樻洿浜嬩欢
   */
  onThemeChanged(handler: (theme: AppearanceSettingsDTO['theme']) => void): () => void {
    return this.client.on(SettingChannels.EVENT_THEME_CHANGED, handler);
  }
}

// ============ Singleton Export ============

export const settingIPCClient = new SettingIPCClient();
