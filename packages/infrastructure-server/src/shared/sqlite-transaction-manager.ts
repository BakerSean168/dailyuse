import { ITransactionManager } from '@dailyuse/application-server';

export class SqliteTransactionManager implements ITransactionManager {
  constructor(private readonly db: any) {}

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    // SQLite via better-sqlite3 doesn't support async transactions in the same way as Prisma
    // This is a simplified implementation that still calls the function with the db instance
    // For true transaction support with better-sqlite3, you might need to use:
    // db.prepare('BEGIN IMMEDIATE').run();
    // try { ... } finally { db.prepare('COMMIT').run(); }
    return fn(this.db);
  }
}
