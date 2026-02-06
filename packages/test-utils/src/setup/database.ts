/**
 * 数据库测试工具
 * @package @dailyuse/test-utils
 * 
 * 提供统一的数据库测试环境配置,适用于所有需要真实数据库的测试
 */

import { execSync } from 'child_process';
// Import PrismaClient from infrastructure-server's generated client
import { PrismaClient } from '@dailyuse/infrastructure-server/prisma/client';
import type { BeforeAllListener, AfterAllListener, BeforeEachListener } from 'vitest';

export interface DatabaseTestConfig {
  /** 数据库连接URL */
  databaseUrl: string;
  /** Prisma schema 文件路径 (相对于项目根目录) */
  schemaPath?: string;
  /** 是否在每个测试前清理数据库 */
  cleanBeforeEach?: boolean;
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * 数据库测试管理器
 */
export class DatabaseTestManager {
  private prisma: PrismaClient | null = null;
  private isSetupComplete = false;
  private config: Required<DatabaseTestConfig>;

  constructor(config: DatabaseTestConfig) {
    this.config = {
      schemaPath: 'apps/api/prisma/schema.prisma',
      cleanBeforeEach: true,
      debug: false,
      ...config,
    };
  }

  /**
   * 初始化测试数据库
   */
  async setup(): Promise<PrismaClient> {
    if (this.isSetupComplete && this.prisma) {
      return this.prisma;
    }

    this.log('🚀 初始化测试数据库...');

    // 设置环境变量
    process.env.DATABASE_URL = this.config.databaseUrl;
    process.env.NODE_ENV = 'test';

    try {
      // 同步数据库 schema
      this.log('📦 同步数据库 schema...');
      execSync('pnpm prisma db push --skip-generate --accept-data-loss', {
        stdio: this.config.debug ? 'inherit' : 'pipe',
        env: { 
          ...process.env, 
          DATABASE_URL: this.config.databaseUrl 
        },
        cwd: process.cwd(),
        shell: process.env.SHELL || '/usr/bin/bash', // 使用系统 shell
      });

      // 创建 Prisma 客户端
      this.prisma = new PrismaClient({
        datasources: {
          db: { url: this.config.databaseUrl },
        },
        log: this.config.debug ? ['query', 'error', 'warn'] : ['error'],
      });

      await this.prisma.$connect();
      this.log('✅ 测试数据库初始化完成');

      this.isSetupComplete = true;
      return this.prisma;
    } catch (error) {
      console.error('❌ 测试数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 清理所有表数据 (保留 Schema)
   */
  async clean(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Database not initialized. Call setup() first.');
    }

    try {
      // 获取所有表名
      const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations'
      `;

      if (tables.length === 0) {
        this.log('⚠️  没有需要清理的表');
        return;
      }

      // 禁用外键约束
      await this.prisma.$executeRaw`SET session_replication_role = 'replica'`;

      // 清空所有表
      for (const { tablename } of tables) {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
      }

      // 恢复外键约束
      await this.prisma.$executeRaw`SET session_replication_role = 'origin'`;

      this.log(`🧹 已清理 ${tables.length} 个表`);
    } catch (error) {
      console.error('❌ 清理数据库失败:', error);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async teardown(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.log('🔌 测试数据库连接已断开');
      this.prisma = null;
      this.isSetupComplete = false;
    }
  }

  /**
   * 获取 Prisma 客户端实例
   */
  getClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not initialized. Call setup() first.');
    }
    return this.prisma;
  }

  /**
   * 创建 Vitest 钩子函数
   */
  createVitestHooks() {
    return {
      beforeAll: (async () => {
        await this.setup();
      }) as BeforeAllListener,

      afterAll: (async () => {
        await this.teardown();
      }) as AfterAllListener,

      beforeEach: (async () => {
        if (this.config.cleanBeforeEach) {
          await this.clean();
        }
      }) as BeforeEachListener,
    };
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[DatabaseTestManager] ${message}`);
    }
  }
}

/**
 * 创建默认的数据库测试管理器 (适用于 API 测试)
 */
export function createDefaultDatabaseManager(options: Partial<DatabaseTestConfig> = {}) {
  return new DatabaseTestManager({
    databaseUrl: 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
    debug: process.env.TEST_DEBUG === 'true',
    ...options,
  });
}

/**
 * 快速配置函数 - 用于 Vitest setup 文件
 */
export function setupDatabaseTests(config?: Partial<DatabaseTestConfig>) {
  const manager = createDefaultDatabaseManager(config);
  const hooks = manager.createVitestHooks();

  return {
    manager,
    hooks,
    // 导出给测试使用
    getClient: () => manager.getClient(),
    clean: () => manager.clean(),
  };
}
