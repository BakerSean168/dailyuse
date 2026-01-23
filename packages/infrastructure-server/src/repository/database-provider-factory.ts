/**
 * Database Provider Factory
 *
 * 支持多数据库适配的工厂类，允许在运行时切换数据库实现。
 * 采用策略模式，为不同的数据库（Prisma、SQLite、MySQL等）提供统一的仓储实现。
 *
 * 使用场景：
 * - API 项目使用 Prisma（PostgreSQL）
 * - Desktop 项目使用 SQLite
 * - Web 前端使用 IndexedDB（未来）
 */

import type { RepositoryContainer } from './di/repository-container-v2';
import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

/**
 * 支持的数据库提供者类型
 */
export enum DatabaseProvider {
  PRISMA = 'prisma',
  SQLITE = 'sqlite',
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
  MEMORY = 'memory',
}

/**
 * 数据库提供者配置
 */
export interface IDatabaseProviderConfig {
  provider: DatabaseProvider | string;
  /** Prisma 实例（当使用 Prisma 时） */
  prisma?: any;
  /** SQLite 数据库路径（当使用 SQLite 时） */
  sqliteDbPath?: string;
  /** SQLite 数据库连接实例（当已创建时） */
  sqliteDb?: any;
  /** 其他自定义配置 */
  [key: string]: any;
}

/**
 * 提供者初始化上下文
 */
export interface IProviderInitContext {
  config: IDatabaseProviderConfig;
  container: any; // RepositoryContainer 的类型，避免循环依赖
}

/**
 * 数据库提供者初始化器接口
 */
export interface IProviderInitializer {
  /**
   * 初始化提供者并注册所有仓储实现
   */
  initialize(context: IProviderInitContext): Promise<void>;

  /**
   * 清理资源（如关闭连接）
   */
  cleanup(): Promise<void>;

  /**
   * 检查提供者健康状态
   */
  healthCheck(): Promise<boolean>;
}

/**
 * 内置提供者初始化器
 */
export const builtInInitializers: Record<string, new () => IProviderInitializer> = {};

/**
 * 数据库提供者工厂
 *
 * 职责：
 * 1. 注册和管理数据库提供者初始化器
 * 2. 根据配置初始化相应的提供者
 * 3. 管理提供者的生命周期
 */
export class DatabaseProviderFactory {
  private static initializers: Map<string, new () => IProviderInitializer> = new Map();
  private static instance: DatabaseProviderFactory;

  private constructor() {}

  /**
   * 获取工厂单例
   */
  static getInstance(): DatabaseProviderFactory {
    if (!DatabaseProviderFactory.instance) {
      DatabaseProviderFactory.instance = new DatabaseProviderFactory();
      DatabaseProviderFactory.registerBuiltInProviders();
    }
    return DatabaseProviderFactory.instance;
  }

  /**
   * 注册内置提供者
   */
  private static registerBuiltInProviders(): void {
    // Prisma 提供者将动态导入以避免循环依赖
    DatabaseProviderFactory.registerProvider(
      DatabaseProvider.PRISMA,
      require('./providers/prisma-provider').PrismaProviderInitializer,
    );

    // SQLite 提供者已移至 infrastructure-desktop 包
    // 不在此处注册以避免循环依赖
    // DatabaseProviderFactory.registerProvider(
    //   DatabaseProvider.SQLITE,
    //   require('./providers/sqlite-provider').SqliteProviderInitializer,
    // );

    // Memory 提供者用于测试
    DatabaseProviderFactory.registerProvider(
      DatabaseProvider.MEMORY,
      require('./providers/memory-provider').MemoryProviderInitializer,
    );
  }

  /**
   * 注册自定义提供者初始化器
   */
  static registerProvider(
    name: string,
    initializer: new () => IProviderInitializer,
  ): void {
    DatabaseProviderFactory.initializers.set(name, initializer);
  }

  /**
   * 初始化数据库提供者
   *
   * @param config 提供者配置
   * @param container 仓储容器
   * @returns 初始化后的提供者初始化器实例
   * @throws 如果提供者不存在
   */
  async initializeProvider(
    config: IDatabaseProviderConfig,
    container: RepositoryContainer,
  ): Promise<IProviderInitializer> {
    const providerName = config.provider;

    const InitializerClass = DatabaseProviderFactory.initializers.get(providerName);
    if (!InitializerClass) {
      throw new Error(
        `Unknown database provider: ${providerName}. ` +
          `Registered providers: ${Array.from(DatabaseProviderFactory.initializers.keys()).join(', ')}`,
      );
    }

    const initializer = new InitializerClass();

    try {
      await initializer.initialize({ config, container });
      return initializer;
    } catch (error) {
      console.error(`Failed to initialize database provider "${providerName}":`, error);
      throw error;
    }
  }

  /**
   * 获取注册的所有提供者名称
   */
  getRegisteredProviders(): string[] {
    return Array.from(DatabaseProviderFactory.initializers.keys());
  }

  /**
   * 检查提供者是否已注册
   */
  hasProvider(name: string): boolean {
    return DatabaseProviderFactory.initializers.has(name);
  }
}

/**
 * 便捷方法：初始化 API（Prisma）环境
 */
export async function initializePrismaProvider(
  prismaClient: any,
  container: RepositoryContainer,
): Promise<IProviderInitializer> {
  const factory = DatabaseProviderFactory.getInstance();
  return factory.initializeProvider(
    {
      provider: DatabaseProvider.PRISMA,
      prisma: prismaClient,
    },
    container,
  );
}

/**
 * 便捷方法：初始化 Desktop（SQLite）环境
 */
export async function initializeSqliteProvider(
  dbPath: string,
  container: RepositoryContainer,
): Promise<IProviderInitializer> {
  const factory = DatabaseProviderFactory.getInstance();
  return factory.initializeProvider(
    {
      provider: DatabaseProvider.SQLITE,
      sqliteDbPath: dbPath,
    },
    container,
  );
}
