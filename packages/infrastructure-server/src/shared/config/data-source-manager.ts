/**
 * 数据源类型定义
 */
export type DataSourceType = 'prisma' | 'sqlite';

/**
 * 仓储数据源配置
 */
export interface DataSourceConfig {
  type: DataSourceType;
  prismaClient?: any;
  sqliteDb?: any;
}

/**
 * 全局数据源管理器
 * 用于管理应用使用的数据源类型和实例
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
