/**
 * @file SQLite Database Connection Manager
 * @description 使用 better-sqlite3 管理 SQLite 数据库连接
 * 遵循 ADR-007: 数据库选型 - 本地使用 SQLite
 * 
 * 职责：
 * - 数据库连接管理
 * - 性能优化配置 (WAL, Cache, mmap)
 * - 生命周期管理 (初始化、关闭、清理)
 * 
 * Schema 定义：
 * - 所有表定义已迁移到 schema/ 目录
 * - 按模块拆分，便于维护和协作
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { DESKTOP_SQLITE_SCHEMA_VERSION, initializeAllTables } from './schema';

let db: Database.Database | null = null;

function configureDatabase(database: Database.Database): void {
  database.pragma('journal_mode = WAL');
  database.pragma('synchronous = NORMAL');
  database.pragma('cache_size = -40000');
  database.pragma('temp_store = MEMORY');
  database.pragma('mmap_size = 268435456');
  database.pragma('locking_mode = NORMAL');
  database.pragma('wal_autocheckpoint = 1000');
  database.pragma('foreign_keys = ON');
}

function removeDatabaseFiles(dbPath: string): void {
  for (const filePath of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }
}

function ensureFreshDevSchema(database: Database.Database, dbPath: string): Database.Database {
  database.exec(`
    CREATE TABLE IF NOT EXISTS __schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  const versionRow = database
    .prepare(`SELECT value FROM __schema_meta WHERE key = 'desktop_schema_version' LIMIT 1`)
    .get() as { value?: string } | undefined;

  const shouldReset = !app.isPackaged && versionRow?.value !== DESKTOP_SQLITE_SCHEMA_VERSION;
  if (!shouldReset) {
    return database;
  }

  console.log(
    `[Database] Schema version changed (${versionRow?.value ?? 'none'} -> ${DESKTOP_SQLITE_SCHEMA_VERSION}), recreating local dev SQLite database`,
  );

  database.close();
  removeDatabaseFiles(dbPath);

  const recreated = new Database(dbPath);
  configureDatabase(recreated);
  recreated.exec(`
    CREATE TABLE IF NOT EXISTS __schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  return recreated;
}

/**
 * @function getDatabasePath
 * @description 获取数据库路径
 * @returns {string} 数据库文件的完整路径
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');

  // 确保目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'dailyuse.sqlite');
}

/**
 * @function initializeDatabase
 * @description 初始化数据库连接
 * 
 * EPIC-003 性能优化：
 * - WAL 模式提高并发写入性能
 * - 增大页缓存减少磁盘 I/O
 * - 内存临时存储加速查询
 * - mmap 内存映射提高读取性能
 *
 * @returns {Database.Database} Database connection instance
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const startTime = performance.now();
  const dbPath = getDatabasePath();

  db = new Database(dbPath);
  configureDatabase(db);
  db = ensureFreshDevSchema(db, dbPath);

  // 初始化所有模块表结构 (来自 schema/)
  initializeAllTables(db);
  db.prepare(`
    INSERT INTO __schema_meta (key, value)
    VALUES ('desktop_schema_version', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(DESKTOP_SQLITE_SCHEMA_VERSION);

  const initTime = performance.now() - startTime;
  console.log(`[Database] Connected to SQLite: ${dbPath} (${initTime.toFixed(2)}ms)`);
  console.log('[Database] Performance pragmas enabled: WAL, cache=40MB, mmap=256MB');

  return db;
}

/**
 * @function getDatabase
 * @description 获取数据库连接
 * @throws {Error} 如果数据库未初始化
 * @returns {Database.Database} Database connection instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * @function closeDatabase
 * @description 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    // 最终 checkpoint 确保所有 WAL 数据写入主数据库
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      console.warn('[Database] Checkpoint failed:', e);
    }
    db.close();
    db = null;
    console.log('[Database] Connection closed');
  }
}

// ========== EPIC-003: 性能优化函数 ==========

let memoryCleanupInterval: NodeJS.Timeout | null = null;

/**
 * @function startMemoryCleanup
 * @description 启动定期内存清理
 * 每 5 分钟释放未使用的缓存内存
 * @param {number} [intervalMs=300000] - 清理间隔（毫秒），默认为 5 分钟
 */
export function startMemoryCleanup(intervalMs: number = 5 * 60 * 1000): void {
  if (memoryCleanupInterval) return;
  
  memoryCleanupInterval = setInterval(() => {
    if (db) {
      try {
        db.pragma('shrink_memory');
        console.log('[Database] Memory cleanup executed');
      } catch (e) {
        console.warn('[Database] Memory cleanup failed:', e);
      }
    }
  }, intervalMs);
  
  console.log(`[Database] Memory cleanup scheduled every ${intervalMs / 1000}s`);
}

/**
 * @function stopMemoryCleanup
 * @description 停止定期内存清理
 */
export function stopMemoryCleanup(): void {
  if (memoryCleanupInterval) {
    clearInterval(memoryCleanupInterval);
    memoryCleanupInterval = null;
  }
}

/**
 * @function getDatabaseStats
 * @description 获取数据库性能统计
 * @returns {Object} 数据库性能统计信息
 */
export function getDatabaseStats(): {
  cacheSize: number;
  pageSize: number;
  pageCount: number;
  walMode: boolean;
  mmapSize: number;
} {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  const cacheSizeResult = db.pragma('cache_size') as Array<{ cache_size: number }>;
  const pageSizeResult = db.pragma('page_size') as Array<{ page_size: number }>;
  const pageCountResult = db.pragma('page_count') as Array<{ page_count: number }>;
  const journalModeResult = db.pragma('journal_mode') as Array<{ journal_mode: string }>;
  const mmapSizeResult = db.pragma('mmap_size') as Array<{ mmap_size: number }>;
  
  const cacheSize = cacheSizeResult[0]?.cache_size ?? 0;
  const pageSize = pageSizeResult[0]?.page_size ?? 0;
  const pageCount = pageCountResult[0]?.page_count ?? 0;
  const journalMode = journalModeResult[0]?.journal_mode ?? '';
  const mmapSize = mmapSizeResult[0]?.mmap_size ?? 0;
  
  return {
    cacheSize: Math.abs(cacheSize),
    pageSize,
    pageCount,
    walMode: journalMode === 'wal',
    mmapSize,
  };
}

/**
 * @function executeCheckpoint
 * @description 手动执行 WAL checkpoint
 * 将 WAL 数据合并到主数据库文件
 */
export function executeCheckpoint(): void {
  if (db) {
    const result = db.pragma('wal_checkpoint(PASSIVE)');
    console.log('[Database] Checkpoint executed:', result);
  }
}

/**
 * @function transaction
 * @description 在事务中执行操作
 * @template T
 * @param {() => T} fn - 包含数据库操作的函数
 * @returns {T} 函数的返回值
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  return database.transaction(fn)();
}
