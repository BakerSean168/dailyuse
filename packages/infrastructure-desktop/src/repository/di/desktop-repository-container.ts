/**
 * Desktop Repository Container
 *
 * 为 Desktop 应用专用的仓储容器
 * 支持一键初始化所有 44 个 SQLite 仓储
 *
 * 注意：RepositoryContainer 通过运行时加载避免循环依赖
 */

import { SqliteDatabase } from '../database';
import { DesktopProviderInitializer } from '../providers/desktop-provider';
import type Database from 'better-sqlite3';

/**
 * Desktop 版本的 Repository Container
 * 
 * 职责：
 * - 初始化 SQLite 数据库
 * - 提供 Desktop 特定的配置
 * - 管理 SQLite 连接的生命周期
 * - 统一注册所有 44 个 SQLite 仓储
 *
 * 使用动态导入避免循环依赖
 */
export class DesktopRepositoryContainer {
  private static instance: DesktopRepositoryContainer;
  private sqliteDb: SqliteDatabase | null = null;
  private baseContainer: any = null; // RepositoryContainer 在运行时动态加载
  private desktopProvider: DesktopProviderInitializer | null = null;

  private constructor() {}

  /**
   * 获取 Desktop 容器单例
   */
  static getInstance(): DesktopRepositoryContainer {
    if (!DesktopRepositoryContainer.instance) {
      DesktopRepositoryContainer.instance = new DesktopRepositoryContainer();
    }
    return DesktopRepositoryContainer.instance;
  }

  /**
   * 初始化 SQLite 数据库
   */
  async initializeSqlite(dbPath: string): Promise<SqliteDatabase> {
    if (this.sqliteDb) {
      return this.sqliteDb;
    }

    this.sqliteDb = new SqliteDatabase(dbPath);
    await this.sqliteDb.initialize();

    console.log(`✅ SQLite database initialized at: ${dbPath}`);
    return this.sqliteDb;
  }

  /**
   * 初始化所有 44 个 SQLite 仓储
   * 一键完成所有仓储的创建和注册
   */
  async initializeAllRepositories(dbPath: string): Promise<void> {
    // 步骤 1: 初始化 SQLite 数据库
    const sqliteDb = await this.initializeSqlite(dbPath);
    const dbConnection = sqliteDb.getConnection();

    // 步骤 2: 动态导入 RepositoryContainer 以避免循环依赖
    const { RepositoryContainer } = await import('@dailyuse/infrastructure-server/repository');
    this.baseContainer = RepositoryContainer.getInstance();

    // 步骤 3: 创建 Desktop Provider 并注册所有仓储
    // 注入 RepositoryContainer 实例而不是导入它
    this.desktopProvider = new DesktopProviderInitializer(dbConnection, this.baseContainer);
    await this.desktopProvider.initialize();

    console.log(
      `✅ All 44 SQLite repositories initialized and registered successfully!`
    );
  }

  /**
   * 获取 SQLite 数据库实例
   */
  getSqliteDatabase(): SqliteDatabase {
    if (!this.sqliteDb) {
      throw new Error(
        'SQLite database not initialized. Call initializeSqlite() or initializeAllRepositories() first.',
      );
    }
    return this.sqliteDb;
  }

  /**
   * 获取数据库连接
   */
  getDbConnection(): Database.Database {
    const sqliteDb = this.getSqliteDatabase();
    return sqliteDb.getConnection();
  }

  /**
   * 获取基础容器（用于访问仓储）
   */
  getBaseContainer(): any {
    if (!this.baseContainer) {
      throw new Error('Base container not initialized. Call initializeAllRepositories() first.');
    }
    return this.baseContainer;
  }

  /**
   * 获取 Desktop Provider
   */
  getDesktopProvider(): DesktopProviderInitializer {
    if (!this.desktopProvider) {
      throw new Error('Desktop provider not initialized. Call initializeAllRepositories() first.');
    }
    return this.desktopProvider;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // Cleanup provider
    if (this.desktopProvider) {
      await this.desktopProvider.cleanup();
      this.desktopProvider = null;
    }

    // Close database
    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = null;
    }

    console.log('✅ Desktop repository container closed');
  }

  /**
   * 检查数据库健康状态
   */
  healthCheck(): boolean {
    if (!this.sqliteDb) {
      return false;
    }
    return this.sqliteDb.healthCheck();
  }

  /**
   * 检查提供者健康状态
   */
  async healthCheckProvider(): Promise<boolean> {
    if (!this.desktopProvider) {
      return false;
    }
    return this.desktopProvider.healthCheck();
  }
}

/**
 * Desktop 版本的 Repository Container
 * 
 * 职责：
 * - 初始化 SQLite 数据库
 * - 提供 Desktop 特定的配置
 * - 管理 SQLite 连接的生命周期
 * - 统一注册所有 44 个 SQLite 仓储
 */
export class DesktopRepositoryContainer {
  private static instance: DesktopRepositoryContainer;
  private sqliteDb: SqliteDatabase | null = null;
  private baseContainer: RepositoryContainer;
  private desktopProvider: DesktopProviderInitializer | null = null;

  private constructor() {
    this.baseContainer = RepositoryContainer.getInstance();
  }

  /**
   * 获取 Desktop 容器单例
   */
  static getInstance(): DesktopRepositoryContainer {
    if (!DesktopRepositoryContainer.instance) {
      DesktopRepositoryContainer.instance = new DesktopRepositoryContainer();
    }
    return DesktopRepositoryContainer.instance;
  }

  /**
   * 初始化 SQLite 数据库
   */
  async initializeSqlite(dbPath: string): Promise<SqliteDatabase> {
    if (this.sqliteDb) {
      return this.sqliteDb;
    }

    this.sqliteDb = new SqliteDatabase(dbPath);
    await this.sqliteDb.initialize();

    console.log(`✅ SQLite database initialized at: ${dbPath}`);
    return this.sqliteDb;
  }

  /**
   * 初始化所有 44 个 SQLite 仓储
   * 一键完成所有仓储的创建和注册
   */
  async initializeAllRepositories(dbPath: string): Promise<void> {
    // 步骤 1: 初始化 SQLite 数据库
    const sqliteDb = await this.initializeSqlite(dbPath);
    const dbConnection = sqliteDb.getConnection();

    // 步骤 2: 创建 Desktop Provider 并注册所有仓储
    this.desktopProvider = new DesktopProviderInitializer(dbConnection);
    await this.desktopProvider.initialize();

    console.log(
      `✅ All 44 SQLite repositories initialized and registered successfully!`
    );
  }

  /**
   * 获取 SQLite 数据库实例
   */
  getSqliteDatabase(): SqliteDatabase {
    if (!this.sqliteDb) {
      throw new Error(
        'SQLite database not initialized. Call initializeSqlite() or initializeAllRepositories() first.',
      );
    }
    return this.sqliteDb;
  }

  /**
   * 获取数据库连接
   */
  getDbConnection(): Database.Database {
    const sqliteDb = this.getSqliteDatabase();
    return sqliteDb.getConnection();
  }

  /**
   * 获取基础容器（用于访问仓储）
   */
  getBaseContainer(): RepositoryContainer {
    return this.baseContainer;
  }

  /**
   * 获取 Desktop Provider
   */
  getDesktopProvider(): DesktopProviderInitializer {
    if (!this.desktopProvider) {
      throw new Error('Desktop provider not initialized. Call initializeAllRepositories() first.');
    }
    return this.desktopProvider;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // Cleanup provider
    if (this.desktopProvider) {
      await this.desktopProvider.cleanup();
      this.desktopProvider = null;
    }

    // Close database
    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = null;
    }

    console.log('✅ Desktop repository container closed');
  }

  /**
   * 检查数据库健康状态
   */
  healthCheck(): boolean {
    if (!this.sqliteDb) {
      return false;
    }
    return this.sqliteDb.healthCheck();
  }

  /**
   * 检查提供者健康状态
   */
  async healthCheckProvider(): Promise<boolean> {
    if (!this.desktopProvider) {
      return false;
    }
    return this.desktopProvider.healthCheck();
  }
}
