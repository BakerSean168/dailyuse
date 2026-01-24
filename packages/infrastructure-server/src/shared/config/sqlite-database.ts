/**
 * SQLite Database Manager
 *
 * 绠＄悊 SQLite 鏁版嵁搴撹繛鎺ャ€佸垵濮嬪寲鍜岃縼绉?
 * 浣跨敤 better-sqlite3 鎻愪緵鍚屾 API
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface ISqliteConfig {
  /**
   * 鏁版嵁搴撴枃浠惰矾寰?
   * 濡傛灉涓?':memory:'锛屽垯浣跨敤鍐呭瓨鏁版嵁搴擄紙娴嬭瘯鐢級
   */
  dbPath: string;
  /**
   * 鏄惁鍦ㄥ惎鍔ㄦ椂鍒涘缓琛?
   */
  autoMigrate?: boolean;
  /**
   * 璋冭瘯妯″紡
   */
  verbose?: boolean;
}

/**
 * SQLite 鏁版嵁搴撶鐞嗗櫒
 */
export class SqliteDatabase {
  private db: Database.Database | null = null;
  private config: ISqliteConfig;

  constructor(config: ISqliteConfig) {
    this.config = config;
  }

  /**
   * 鍒濆鍖栨暟鎹簱杩炴帴
   */
  initialize(): void {
    try {
      // 纭繚鐩綍瀛樺湪
      if (this.config.dbPath !== ':memory:') {
        const dir = path.dirname(this.config.dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      // 鍒涘缓鏁版嵁搴撹繛鎺?
      this.db = new Database(this.config.dbPath);

      // 鍚敤澶栭敭绾︽潫
      this.db.pragma('foreign_keys = ON');

      // 璁剧疆 WAL 妯″紡锛堟洿濂界殑骞跺彂鎬ц兘锛?
      if (this.config.dbPath !== ':memory:') {
        this.db.pragma('journal_mode = WAL');
      }

      if (this.config.verbose) {
        console.log(`鉁?SQLite database initialized at ${this.config.dbPath}`);
      }

      // 鑷姩杩佺Щ
      if (this.config.autoMigrate) {
        this.migrate();
      }
    } catch (error) {
      console.error('鉂?Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  /**
   * 鑾峰彇鏁版嵁搴撳疄渚?
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * 鎵ц杩佺Щ
   */
  private migrate(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 鍒涘缓琛?
    const schema = `
      -- Repository 琛?
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

      -- Folder 琛?
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

      -- Resource 琛?
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

      -- RepositoryStatistics 琛?
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

      -- 鍒涘缓绱㈠紩
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
        console.log('鉁?Database schema migrated successfully');
      }
    } catch (error) {
      console.error('鉂?Migration failed:', error);
      throw error;
    }
  }

  /**
   * 鍏抽棴鏁版嵁搴撹繛鎺?
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      if (this.config.verbose) {
        console.log('鉁?Database connection closed');
      }
    }
  }

  /**
   * 妫€鏌ユ暟鎹簱鍋ュ悍鐘舵€?
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
