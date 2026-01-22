/**
 * API 初始化脚本
 *
 * 使用 DatabaseProviderFactory 初始化 Prisma 提供者
 * 应该在应用启动时调用
 */

import {
  DatabaseProviderFactory,
  initializePrismaProvider,
  RepositoryContainer,
  type IProviderInitializer,
} from '../index';
import { prisma } from '../../shared/config/prisma';

/**
 * 初始化 API 仓储层
 *
 * @returns 初始化后的提供者实例
 * @throws 如果初始化失败
 */
export async function initializeApiRepositories(): Promise<IProviderInitializer> {
  const container = RepositoryContainer.getInstance();

  console.log('🚀 Initializing API repositories with Prisma...');

  try {
    const provider = await initializePrismaProvider(prisma, container as any);
    
    // 验证初始化
    if (!(container as any).isInitialized?.()) {
      throw new Error('Container not fully initialized');
    }

    console.log('✅ API repositories initialized successfully');
    return provider;
  } catch (error) {
    console.error('❌ Failed to initialize API repositories:', error);
    throw error;
  }
}

/**
 * 清理 API 仓储层
 *
 * @param provider 提供者实例
 */
export async function cleanupApiRepositories(provider: IProviderInitializer): Promise<void> {
  console.log('🧹 Cleaning up API repositories...');
  
  try {
    await provider.cleanup();
    (RepositoryContainer.getInstance() as any).reset?.();
    console.log('✅ API repositories cleaned up');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

/**
 * 检查 API 仓储健康状态
 */
export async function healthCheckApiRepositories(): Promise<boolean> {
  const container = RepositoryContainer.getInstance();
  
  try {
    if (!(container as any).isInitialized?.()) {
      console.warn('⚠️  Repositories not initialized');
      return false;
    }

    // 简单健康检查：尝试访问一个仓储
    const repoRepo = container.getRepositoryRepository();
    console.log('✅ API repositories health check passed');
    return true;
  } catch (error) {
    console.error('❌ API repositories health check failed:', error);
    return false;
  }
}
