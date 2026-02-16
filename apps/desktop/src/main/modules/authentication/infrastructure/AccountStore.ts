/**
 * AccountStore - 多账号存储管理
 *
 * 管理多个登录账号信息：
 * - 保存账号列表（用于快速登录）
 * - 记住最近登录的账号
 * - 自动登录设置
 *
 * 数据存储在本地文件，不包含敏感信息（密码等由 TokenManager 管理）
 */

import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, type ILogger } from '@dailyuse/utils';
import type { 
  StoredAccount, 
  AccountStoreSettings, 
  AccountStoreData 
} from '@dailyuse/contracts/authentication';

const logger = createLogger('AccountStore');

// Re-export for convenience
export type { StoredAccount, AccountStoreSettings, AccountStoreData };

// ============ Internal Types ============

/**
 * 账号存储文件结构（内部使用）
 */
type AccountStoreFile = AccountStoreData;

const STORE_FILE_VERSION = 1;
const STORE_FILE_NAME = 'account-store.json';
const DEFAULT_MAX_ACCOUNTS = 5;

// ============ AccountStore ============

/**
 * 账号存储管理器
 *
 * 提供多账号的保存、读取、删除功能
 */
export class AccountStore {
  private static instance: AccountStore | null = null;

  private readonly storeFilePath: string;
  private data: AccountStoreFile;

  private constructor() {
    this.storeFilePath = path.join(app.getPath('userData'), STORE_FILE_NAME);
    this.data = this.loadFromFile();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AccountStore {
    if (!AccountStore.instance) {
      AccountStore.instance = new AccountStore();
    }
    return AccountStore.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    AccountStore.instance = null;
  }

  // ============ Account Operations ============

  /**
   * 获取所有保存的账号
   */
  getAccounts(): StoredAccount[] {
    return [...this.data.accounts];
  }

  /**
   * 获取账号数量
   */
  getAccountCount(): number {
    return this.data.accounts.length;
  }

  /**
   * 根据 UUID 获取账号
   */
  getAccountById(id: string): StoredAccount | undefined {
    return this.data.accounts.find((a) => a.id === id);
  }

  /**
   * 根据邮箱获取账号
   */
  getAccountByEmail(email: string): StoredAccount | undefined {
    return this.data.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * 获取最后活跃的账号
   */
  getLastActiveAccount(): StoredAccount | undefined {
    if (!this.data.lastActiveAccountId) {
      // 返回最近登录的账号
      return this.data.accounts.sort((a, b) => b.lastLoginAt - a.lastLoginAt)[0];
    }
    return this.getAccountById(this.data.lastActiveAccountId);
  }

  /**
   * 获取启用自动登录的账号
   */
  getAutoLoginAccount(): StoredAccount | undefined {
    return this.data.accounts.find((a) => a.autoLogin);
  }

  /**
   * 添加或更新账号
   */
  saveAccount(account: Omit<StoredAccount, 'lastLoginAt'> & { lastLoginAt?: number }): void {
    const existingIndex = this.data.accounts.findIndex((a) => a.id === account.id);

    const savedAccount: StoredAccount = {
      ...account,
      lastLoginAt: account.lastLoginAt || Date.now(),
    };

    if (existingIndex >= 0) {
      // 更新现有账号
      this.data.accounts[existingIndex] = savedAccount;
      logger.info('Account updated', { id: account.id });
    } else {
      // 添加新账号
      // 如果启用了自动登录，禁用其他账号的自动登录
      if (savedAccount.autoLogin) {
        this.data.accounts.forEach((a) => (a.autoLogin = false));
      }

      // 检查是否超过最大数量
      if (this.data.accounts.length >= this.data.settings.maxAccounts) {
        // 移除最旧的非自动登录账号
        const oldestNonAutoLogin = this.data.accounts
          .filter((a) => !a.autoLogin)
          .sort((a, b) => a.lastLoginAt - b.lastLoginAt)[0];

        if (oldestNonAutoLogin) {
          this.removeAccount(oldestNonAutoLogin.id);
          logger.info('Removed oldest account to make room', { id: oldestNonAutoLogin.id });
        }
      }

      this.data.accounts.push(savedAccount);
      logger.info('Account added', { id: account.id });
    }

    // 更新最后活跃账号
    this.data.lastActiveAccountId = account.id;

    this.saveToFile();
  }

  /**
   * 更新账号的最后登录时间
   */
  updateLastLogin(id: string): void {
    const account = this.getAccountById(id);
    if (account) {
      account.lastLoginAt = Date.now();
      this.data.lastActiveAccountId = id;
      this.saveToFile();
      logger.debug('Updated last login time', { id });
    }
  }

  /**
   * 设置自动登录
   */
  setAutoLogin(id: string, enabled: boolean): void {
    // 如果启用，先禁用其他账号的自动登录
    if (enabled) {
      this.data.accounts.forEach((a) => (a.autoLogin = false));
    }

    const account = this.getAccountById(id);
    if (account) {
      account.autoLogin = enabled;
      this.saveToFile();
      logger.info('Auto login updated', { id, enabled });
    }
  }

  /**
   * 更新账号的 Session 有效性
   */
  updateSessionValidity(id: string, hasValidSession: boolean): void {
    const account = this.getAccountById(id);
    if (account) {
      account.hasValidSession = hasValidSession;
      // 不保存到文件，这是运行时状态
    }
  }

  /**
   * 移除账号
   */
  removeAccount(id: string): boolean {
    const index = this.data.accounts.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.data.accounts.splice(index, 1);

      // 如果移除的是最后活跃账号，清除记录
      if (this.data.lastActiveAccountId === id) {
        this.data.lastActiveAccountId = undefined;
      }

      this.saveToFile();
      logger.info('Account removed', { id });
      return true;
    }
    return false;
  }

  /**
   * 清除所有账号
   */
  clearAllAccounts(): void {
    this.data.accounts = [];
    this.data.lastActiveAccountId = undefined;
    this.saveToFile();
    logger.info('All accounts cleared');
  }

  // ============ Settings ============

  /**
   * 获取设置
   */
  getSettings(): AccountStoreFile['settings'] {
    return { ...this.data.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<AccountStoreFile['settings']>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveToFile();
  }

  // ============ File Operations ============

  /**
   * 从文件加载数据
   */
  private loadFromFile(): AccountStoreFile {
    try {
      if (fs.existsSync(this.storeFilePath)) {
        const content = fs.readFileSync(this.storeFilePath, 'utf-8');
        const data = JSON.parse(content) as AccountStoreFile;

        // 版本检查和迁移
        if (data.version !== STORE_FILE_VERSION) {
          logger.warn('Store file version mismatch, migrating...', {
            fileVersion: data.version,
            currentVersion: STORE_FILE_VERSION,
          });
          // TODO: 实现版本迁移
        }

        return data;
      }
    } catch (error) {
      logger.error('Failed to load account store', { error });
    }

    // 返回默认数据
    return {
      version: STORE_FILE_VERSION,
      accounts: [],
      settings: {
        rememberLastAccount: true,
        maxAccounts: DEFAULT_MAX_ACCOUNTS,
      },
    };
  }

  /**
   * 保存数据到文件
   */
  private saveToFile(): void {
    try {
      const dir = path.dirname(this.storeFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.storeFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
      logger.debug('Account store saved');
    } catch (error) {
      logger.error('Failed to save account store', { error });
    }
  }
}

/**
 * 获取 AccountStore 单例
 */
export function getAccountStore(): AccountStore {
  return AccountStore.getInstance();
}

/**
 * 注册 AccountStore IPC Handlers
 * 
 * 应在 app ready 后调用
 */
export function registerAccountStoreIpcHandlers(): void {
  const accountStore = getAccountStore();

  // 获取快速登录账号列表
  ipcMain.handle('auth:get-quick-login-accounts', () => {
    return accountStore.getAccounts();
  });

  // 更新最后登录时间
  ipcMain.handle('auth:update-last-login', (_event, id: string) => {
    accountStore.updateLastLogin(id);
    return { success: true };
  });

  // 移除保存的账号
  ipcMain.handle('auth:remove-saved-account', (_event, id: string) => {
    const removed = accountStore.removeAccount(id);
    return { success: removed };
  });

  logger.info('AccountStore IPC handlers registered');
}
