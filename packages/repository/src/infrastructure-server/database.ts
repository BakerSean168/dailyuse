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
        id TEXT PRIMARY KEY,
        identity_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        config JSON,
        stats JSON,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_repositories_account_id 
      ON repositories(identity_id);

      CREATE INDEX IF NOT EXISTS idx_repositories_status 
      ON repositories(status);
    `);

    // Resource 琛?
    db.exec(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL,
        folder_id TEXT,
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
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_resources_repository_id 
      ON resources(repository_id);

      CREATE INDEX IF NOT EXISTS idx_resources_folder_id 
      ON resources(folder_id);

      CREATE INDEX IF NOT EXISTS idx_resources_path 
      ON resources(path);
    `);

    // Folder 琛?
    db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL,
        parent_id TEXT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_folders_repository_id 
      ON folders(repository_id);

      CREATE INDEX IF NOT EXISTS idx_folders_parent_id 
      ON folders(parent_id);
    `);

    // RepositoryStatistics 琛?
    db.exec(`
      CREATE TABLE IF NOT EXISTS repository_statistics (
        id TEXT PRIMARY KEY,
        identity_id TEXT NOT NULL UNIQUE,
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

      CREATE INDEX IF NOT EXISTS idx_repository_statistics_account_id 
      ON repository_statistics(identity_id);
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
