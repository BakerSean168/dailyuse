/**
 * 鏁版嵁婧愮被鍨嬪畾涔?
 */
export type DataSourceType = 'prisma' | 'sqlite';

/**
 * Repository鏁版嵁婧愰厤缃?
 */
export interface DataSourceConfig {
  type: DataSourceType;
  prismaClient?: any;
  sqliteDb?: any;
}

/**
 * 鍏ㄥ眬鏁版嵁婧愮鐞嗗櫒
 * 鐢ㄤ簬绠＄悊搴旂敤浣跨敤鐨勬暟鎹簮绫诲瀷鍜屽疄渚?
 */
export class DataSourceManager {
  private static instance: DataSourceManager;
  private config: DataSourceConfig;

  private constructor(config: DataSourceConfig) {
    this.config = config;
  }

  static initialize(config: DataSourceConfig): void {
    DataSourceManager.instance = new DataSourceManager(config);
  }

  static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      throw new Error('DataSourceManager not initialized. Call initialize() first.');
    }
    return DataSourceManager.instance;
  }

  getConfig(): DataSourceConfig {
    return this.config;
  }

  getType(): DataSourceType {
    return this.config.type;
  }

  getPrismaClient(): any {
    if (this.config.type !== 'prisma') {
      throw new Error('DataSourceManager is not configured for Prisma');
    }
    return this.config.prismaClient;
  }

  getSQLiteDb(): any {
    if (this.config.type !== 'sqlite') {
      throw new Error('DataSourceManager is not configured for SQLite');
    }
    return this.config.sqliteDb;
  }

  isPrisma(): boolean {
    return this.config.type === 'prisma';
  }

  isSQLite(): boolean {
    return this.config.type === 'sqlite';
  }
}
