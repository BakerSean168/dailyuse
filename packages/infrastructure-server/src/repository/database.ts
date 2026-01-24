/**
 * SQLite Database Manager
 *
 * 绠＄悊 SQLite 鏁版嵁搴撹繛鎺ュ拰鍒濆鍖?
 * 浣跨敤 better-sqlite3 杩涜鍚屾 I/O 鎿嶄綔锛堥€傚悎 Desktop 搴旂敤锛?
 */

import Database from 'better-sqlite3';
import path from 'path';

/**
 * SQLite 鏁版嵁搴撶鐞嗗櫒
 */
export class SqliteDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Get鎴栧垱寤烘暟鎹簱杩炴帴
   */
  getConnection(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      // 鍚敤澶栭敭绾︽潫
      this.db.pragma('foreign_keys = ON');
      // 鎬ц兘浼樺寲
      this.db.pragma('journal_mode = WAL');
    }
    return this.db;
  }

  /**
   * 鍒濆鍖栨暟鎹簱 schema
   */
  async initialize(): Promise<void> {
    const db = this.getConnection();

    // Repository 琛?
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

    // Resource 琛?
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

    // Folder 琛?
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

    // RepositoryStatistics 琛?
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
   * 鍏抽棴鏁版嵁搴撹繛鎺?
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 妫€鏌ユ暟鎹簱鍋ュ悍鐘舵€?
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
 * 渚挎嵎鍑芥暟锛氬垱寤哄苟鍒濆鍖栨暟鎹簱
 */
export async function initializeSqliteDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = new SqliteDatabase(dbPath);
  await db.initialize();
  return db;
}
