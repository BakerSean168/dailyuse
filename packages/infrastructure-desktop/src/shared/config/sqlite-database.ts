/**
 * SQLite Database Manager
 *
 * 管理 SQLite 数据库连接、初始化和迁移
 * 使用 better-sqlite3 提供同步 API
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface ISqliteConfig {
  /**
   * 数据库文件路径
   * 如果为 ':memory:'，则使用内存数据库（测试用）
   */
  dbPath: string;
  /**
   * 是否在启动时创建表
   */
  autoMigrate?: boolean;
  /**
   * 调试模式
   */
  verbose?: boolean;
}

/**
 * SQLite 数据库管理器
 */
export class SqliteDatabase {
  private db: Database.Database | null = null;
  private config: ISqliteConfig;

  constructor(config: ISqliteConfig) {
    this.config = config;
  }

  /**
   * 初始化数据库连接
   */
  initialize(): void {
    try {
      // 确保目录存在
      if (this.config.dbPath !== ':memory:') {
        const dir = path.dirname(this.config.dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      // 创建数据库连接
      this.db = new Database(this.config.dbPath);

      // 启用外键约束
      this.db.pragma('foreign_keys = ON');

      // 设置 WAL 模式（更好的并发性能）
      if (this.config.dbPath !== ':memory:') {
        this.db.pragma('journal_mode = WAL');
      }

      if (this.config.verbose) {
        console.log(`✅ SQLite database initialized at ${this.config.dbPath}`);
      }

      // 自动迁移
      if (this.config.autoMigrate) {
        this.migrate();
      }
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * 执行迁移
   */
  private migrate(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 创建表
    const schema = `
      -- Repository 表
      CREATE TABLE IF NOT EXISTS repositories (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        config TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(account_uuid, name)
      );

      -- Folder 表
      CREATE TABLE IF NOT EXISTS folders (
        uuid TEXT PRIMARY KEY,
        repository_uuid TEXT NOT NULL,
        parent_uuid TEXT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(repository_uuid) REFERENCES repositories(uuid) ON DELETE CASCADE,
        FOREIGN KEY(parent_uuid) REFERENCES folders(uuid) ON DELETE CASCADE,
        UNIQUE(repository_uuid, parent_uuid, name)
      );

      -- Resource 表
      CREATE TABLE IF NOT EXISTS resources (
        uuid TEXT PRIMARY KEY,
        repository_uuid TEXT NOT NULL,
        folder_uuid TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        content TEXT,
        metadata TEXT,
        stats TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(repository_uuid) REFERENCES repositories(uuid) ON DELETE CASCADE,
        FOREIGN KEY(folder_uuid) REFERENCES folders(uuid) ON DELETE SET NULL,
        UNIQUE(repository_uuid, path)
      );

      -- RepositoryStatistics 表
      CREATE TABLE IF NOT EXISTS repository_statistics (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL UNIQUE,
        total_repositories INTEGER DEFAULT 0,
        active_repositories INTEGER DEFAULT 0,
        archived_repositories INTEGER DEFAULT 0,
        total_resources INTEGER DEFAULT 0,
        total_folders INTEGER DEFAULT 0,
        total_tags INTEGER DEFAULT 0,
        total_storage_bytes INTEGER DEFAULT 0,
        last_updated_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_repositories_account_uuid ON repositories(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_folders_repository_uuid ON folders(repository_uuid);
      CREATE INDEX IF NOT EXISTS idx_folders_parent_uuid ON folders(parent_uuid);
      CREATE INDEX IF NOT EXISTS idx_resources_repository_uuid ON resources(repository_uuid);
      CREATE INDEX IF NOT EXISTS idx_resources_folder_uuid ON resources(folder_uuid);
      CREATE INDEX IF NOT EXISTS idx_repository_statistics_account_uuid ON repository_statistics(account_uuid);
    `;

    try {
      this.db.exec(schema);
      if (this.config.verbose) {
        console.log('✅ Database schema migrated successfully');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      if (this.config.verbose) {
        console.log('✅ Database connection closed');
      }
    }
  }

  /**
   * 检查数据库健康状态
   */
  healthCheck(): boolean {
    try {
      if (!this.db) {
        return false;
      }
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }
}
