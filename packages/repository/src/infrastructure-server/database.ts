/**
 * SQLite Database Manager
 *
 * 绠＄悊 SQLite 鏁版嵁搴撹繛鎺ュ拰鍒濆鍖?
 * 浣跨敤 better-sqlite3 杩涜鍚屾 I/O 鎿嶄綔锛堥€傚悎 Desktop 搴旂敤锛?
 */

import Database from 'better-sqlite3';
import path from 'path';
import { REPOSITORY_MODULE_SCHEMA } from './adapters/sqlite/schema';

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
    db.exec(REPOSITORY_MODULE_SCHEMA);
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
