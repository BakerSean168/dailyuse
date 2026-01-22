/**
 * Desktop Application Bootstrap
 * Desktop 应用启动脚本
 *
 * 一键初始化所有 44 个 SQLite 仓储
 */

import path from 'path';
import { DesktopRepositoryContainer } from '../di/desktop-repository-container';

/**
 * 初始化 Desktop 仓储
 * 初始化 SQLite 数据库并注册所有 44 个仓储
 *
 * @param dbPath - SQLite 数据库文件路径
 * @returns {Promise<DesktopRepositoryContainer>} - Desktop 容器实例
 *
 * @example
 * ```typescript
 * // 使用自定义路径
 * const container = await initializeDesktopRepositories(
 *   path.join(app.getPath('userData'), 'app.db')
 * );
 *
 * // 或使用默认路径
 * const container = await initializeDesktopRepositories();
 *
 * // 访问仓储
 * const baseContainer = container.getBaseContainer();
 * const taskRepo = (baseContainer as any).getTaskInstanceRepository();
 * const tasks = await taskRepo.findByAccountUuid('account-id');
 *
 * // 使用完毕后清理
 * await cleanupDesktopRepositories(container);
 * ```
 */
export async function initializeDesktopRepositories(
  dbPath?: string
): Promise<DesktopRepositoryContainer> {
  console.log('🚀 Initializing Desktop Application...');

  try {
    // 解析数据库路径
    const resolvedDbPath =
      dbPath ||
      path.join(
        process.env.APPDATA || process.env.HOME || '.',
        'DailyUse',
        'database.db'
      );

    console.log(`📍 Database path: ${resolvedDbPath}`);

    // 获取 Desktop 容器单例
    const container = DesktopRepositoryContainer.getInstance();

    // 一键初始化所有 44 个仓储
    console.log('📦 Initializing all 44 SQLite repositories...');
    await container.initializeAllRepositories(resolvedDbPath);

    // 检查健康状态
    const isHealthy = await container.healthCheckProvider();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    console.log('✅ Desktop application initialized successfully!');
    console.log('');
    console.log('📊 Available repositories (44 total):');
    console.log('   Repository Module:   4 repositories');
    console.log('   Task Module:         4 repositories');
    console.log('   Goal Module:         6 repositories');
    console.log('   Schedule Module:     4 repositories');
    console.log('   Reminder Module:     5 repositories');
    console.log('   Notification Module: 3 repositories');
    console.log('   Editor Module:       8 repositories');
    console.log('   Authentication:      2 repositories');
    console.log('   Dashboard Module:    1 repository');
    console.log('   AI Module:           5 repositories');
    console.log('   Account Module:      1 repository');
    console.log('   Sync Module:         4 repositories');
    console.log('   Setting Module:      3 repositories');
    console.log('');

    return container;
  } catch (error) {
    console.error('❌ Failed to initialize Desktop application:', error);
    throw error;
  }
}

/**
 * Cleanup Desktop application
 * 清理 Desktop 应用和数据库资源
 *
 * @param container - Desktop 容器实例
 *
 * @example
 * ```typescript
 * const container = await initializeDesktopRepositories(dbPath);
 * try {
 *   // ... use repositories ...
 * } finally {
 *   await cleanupDesktopRepositories(container);
 * }
 * ```
 */
export async function cleanupDesktopRepositories(
  container: DesktopRepositoryContainer
): Promise<void> {
  console.log('🛑 Cleaning up Desktop application...');
  await container.close();
  console.log('✅ Desktop application cleaned up');
}

/**
 * Health check for Desktop repositories
 * 检查 Desktop 仓储的健康状态
 *
 * @param container - Desktop 容器实例
 * @returns {Promise<boolean>} - 健康状态
 */
export async function healthCheckDesktopRepositories(
  container: DesktopRepositoryContainer
): Promise<boolean> {
  try {
    const dbHealthy = container.healthCheck();
    const providerHealthy = await container.healthCheckProvider();

    if (!dbHealthy || !providerHealthy) {
      console.warn('⚠️  Database or provider health check failed');
      return false;
    }

    console.log('✅ Desktop repositories health check passed');
    return true;
  } catch (error) {
    console.error('❌ Desktop repositories health check failed:', error);
    return false;
  }
}
