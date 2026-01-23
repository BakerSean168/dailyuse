/**
 * SQLite Database Manager
 *
 * 管理 SQLite 数据库连接和初始化
 * 使用 better-sqlite3 进行同步 I/O 操作（适合 Desktop 应用）
 */

import Database from 'better-sqlite3';
import path from 'path';

/**
 * SQLite 数据库管理器
 */
export class SqliteDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * 获取或创建数据库连接
   */
  getConnection(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      // 启用外键约束
      this.db.pragma('foreign_keys = ON');
      // 性能优化
      this.db.pragma('journal_mode = WAL');
    }
    return this.db;
  }

  /**
   * 初始化数据库 schema
   */
  async initialize(): Promise<void> {
    const db = this.getConnection();

    // Repository 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        config JSON,
        stats JSON,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_repositories_account_uuid 
      ON repositories(account_uuid);

      CREATE INDEX IF NOT EXISTS idx_repositories_status 
      ON repositories(status);
    `);

    // Resource 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS resources (
        uuid TEXT PRIMARY KEY,
        repository_uuid TEXT NOT NULL,
        folder_uuid TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER,
        content TEXT,
        metadata JSON,
        stats JSON,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (repository_uuid) REFERENCES repositories(uuid) ON DELETE CASCADE,
        FOREIGN KEY (folder_uuid) REFERENCES folders(uuid) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_resources_repository_uuid 
      ON resources(repository_uuid);

      CREATE INDEX IF NOT EXISTS idx_resources_folder_uuid 
      ON resources(folder_uuid);

      CREATE INDEX IF NOT EXISTS idx_resources_path 
      ON resources(path);
    `);

    // Folder 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        uuid TEXT PRIMARY KEY,
        repository_uuid TEXT NOT NULL,
        parent_uuid TEXT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (repository_uuid) REFERENCES repositories(uuid) ON DELETE CASCADE,
        FOREIGN KEY (parent_uuid) REFERENCES folders(uuid) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_folders_repository_uuid 
      ON folders(repository_uuid);

      CREATE INDEX IF NOT EXISTS idx_folders_parent_uuid 
      ON folders(parent_uuid);
    `);

    // RepositoryStatistics 表
    db.exec(`
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
        last_updated_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_repository_statistics_account_uuid 
      ON repository_statistics(account_uuid);
    `);
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 检查数据库健康状态
   */
  healthCheck(): boolean {
    try {
      const db = this.getConnection();
      const result = db.prepare('SELECT 1').get();
      return !!result;
    } catch (error) {
      console.error('SQLite health check failed:', error);
      return false;
    }
  }
}

/**
 * 便捷函数：创建并初始化数据库
 */
export async function initializeSqliteDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = new SqliteDatabase(dbPath);
  await db.initialize();
  return db;
}
