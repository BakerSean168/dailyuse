/**
 * LocalAccountManager - 本地账户管理器
 *
 * 负责管理本地（离线）账户的创建和管理
 *
 * 核心功能：
 * - 首次启动自动创建本地账户
 * - 本地账户信息持久化
 * - 本地账户与云账户的关联管理
 */

import { createLogger, generateUUID, type ILogger } from '@dailyuse/utils';
import { app } from 'electron';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 本地账户类型
 */
export interface LocalAccount {
  /** 账户 UUID */
  uuid: string;
  /** 账户类型 */
  type: 'LOCAL';
  /** 用户名 */
  username: string;
  /** 邮箱（占位） */
  email: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像路径 */
  avatarPath?: string;
  /** 关联的云账户 UUID */
  cloudAccountUuid?: string;
  /** 是否在线 */
  isOnline: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 本地账户文件结构
 */
interface LocalAccountFile {
  version: number;
  account: LocalAccount;
}

const ACCOUNT_FILE_VERSION = 1;
const ACCOUNT_FILE_NAME = 'local-account.json';

/**
 * 本地账户管理器
 *
 * 提供本地账户的创建、读取、更新功能
 */
export class LocalAccountManager {
  private static instance: LocalAccountManager | null = null;

  private readonly logger: ILogger;
  private readonly accountFilePath: string;

  private currentAccount: LocalAccount | null = null;
  private isInitialized = false;

  private constructor(logger?: ILogger) {
    this.logger = logger || createLogger('LocalAccountManager');
    this.accountFilePath = path.join(app.getPath('userData'), ACCOUNT_FILE_NAME);
  }

  /**
   * 获取单例实例
   */
  static getInstance(logger?: ILogger): LocalAccountManager {
    if (!LocalAccountManager.instance) {
      LocalAccountManager.instance = new LocalAccountManager(logger);
    }
    return LocalAccountManager.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    LocalAccountManager.instance = null;
  }

  // ============ Initialization ============

  /**
   * 初始化本地账户管理器
   *
   * 如果本地账户不存在，自动创建
   */
  async initialize(): Promise<LocalAccount> {
    if (this.isInitialized && this.currentAccount) {
      return this.currentAccount;
    }

    this.logger.info('Initializing LocalAccountManager');

    // 尝试加载现有账户
    const existingAccount = await this.loadAccount();
    if (existingAccount) {
      this.currentAccount = existingAccount;
      this.isInitialized = true;
      this.logger.info('Local account loaded', { uuid: existingAccount.uuid });
      return existingAccount;
    }

    // 创建新的本地账户
    const newAccount = await this.createLocalAccount();
    this.currentAccount = newAccount;
    this.isInitialized = true;
    this.logger.info('Local account created', { uuid: newAccount.uuid });
    return newAccount;
  }

  // ============ Account Operations ============

  /**
   * 获取当前本地账户
   */
  getCurrentAccount(): LocalAccount | null {
    return this.currentAccount;
  }

  /**
   * 创建本地账户
   */
  async createLocalAccount(): Promise<LocalAccount> {
    const hostname = os.hostname();
    const username = os.userInfo().username || 'User';

    const account: LocalAccount = {
      uuid: `local-${generateUUID()}`,
      type: 'LOCAL',
      username: username,
      email: 'local@desktop.app',
      displayName: `${username} (${hostname})`,
      isOnline: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveAccount(account);
    this.logger.info('Local account created', { uuid: account.uuid });
    return account;
  }

  /**
   * 更新本地账户
   */
  async updateAccount(updates: Partial<Omit<LocalAccount, 'uuid' | 'type' | 'createdAt'>>): Promise<LocalAccount> {
    if (!this.currentAccount) {
      throw new Error('No local account exists');
    }

    const updatedAccount: LocalAccount = {
      ...this.currentAccount,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.saveAccount(updatedAccount);
    this.currentAccount = updatedAccount;
    this.logger.info('Local account updated', { uuid: updatedAccount.uuid });
    return updatedAccount;
  }

  /**
   * 关联云账户
   */
  async linkCloudAccount(cloudAccountUuid: string): Promise<LocalAccount> {
    return this.updateAccount({
      cloudAccountUuid,
      isOnline: true,
    });
  }

  /**
   * 取消关联云账户
   */
  async unlinkCloudAccount(): Promise<LocalAccount> {
    return this.updateAccount({
      cloudAccountUuid: undefined,
      isOnline: false,
    });
  }

  /**
   * 设置在线状态
   */
  async setOnlineStatus(isOnline: boolean): Promise<LocalAccount> {
    return this.updateAccount({ isOnline });
  }

  // ============ File Operations ============

  /**
   * 加载账户文件
   */
  private async loadAccount(): Promise<LocalAccount | null> {
    try {
      if (!fs.existsSync(this.accountFilePath)) {
        return null;
      }

      const content = fs.readFileSync(this.accountFilePath, 'utf-8');
      const data: LocalAccountFile = JSON.parse(content);

      // 版本检查
      if (data.version !== ACCOUNT_FILE_VERSION) {
        this.logger.warn('Account file version mismatch, migrating...', {
          fileVersion: data.version,
          currentVersion: ACCOUNT_FILE_VERSION,
        });
        // TODO: 实现版本迁移
      }

      return data.account;
    } catch (error) {
      this.logger.error('Failed to load local account', { error });
      return null;
    }
  }

  /**
   * 保存账户文件
   */
  private async saveAccount(account: LocalAccount): Promise<void> {
    try {
      const data: LocalAccountFile = {
        version: ACCOUNT_FILE_VERSION,
        account,
      };

      const dir = path.dirname(this.accountFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.accountFilePath, JSON.stringify(data, null, 2), 'utf-8');
      this.logger.debug('Local account saved', { path: this.accountFilePath });
    } catch (error) {
      this.logger.error('Failed to save local account', { error });
      throw error;
    }
  }

  /**
   * 删除账户文件
   */
  async deleteAccount(): Promise<void> {
    try {
      if (fs.existsSync(this.accountFilePath)) {
        fs.unlinkSync(this.accountFilePath);
        this.logger.info('Local account file deleted');
      }
      this.currentAccount = null;
    } catch (error) {
      this.logger.error('Failed to delete local account', { error });
      throw error;
    }
  }
}

/**
 * 获取 LocalAccountManager 单例
 */
export function getLocalAccountManager(logger?: ILogger): LocalAccountManager {
  return LocalAccountManager.getInstance(logger);
}
