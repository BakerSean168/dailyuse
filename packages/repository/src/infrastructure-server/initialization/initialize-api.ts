/**
 * API 鍒濆鍖栬剼鏈?
 *
 * 浣跨敤 DatabaseProviderFactory 鍒濆鍖?Prisma 鎻愪緵鑰?
 * 搴旇鍦ㄥ簲鐢ㄥ惎鍔ㄦ椂璋冪敤
 */

import {
  initializePrismaProvider,
  type IProviderInitializer,
} from '../database-provider-factory';
import { RepositoryContainer } from '../di/repository-container-v2';

/**
 * Initialize API Repository layer
 *
 * @param prisma - PrismaClient instance (injected by caller)
 * @returns Initialized provider instance
 * @throws If initialization fails
 */
export async function initializeApiRepositories(prisma: any): Promise<IProviderInitializer> {
  const container = RepositoryContainer.getInstance();

  console.log('馃殌 Initializing API repositories with Prisma...');

  try {
    const provider = await initializePrismaProvider(prisma, container as any);
    
    // 楠岃瘉鍒濆鍖?
    if (!(container as any).isInitialized?.()) {
      throw new Error('Container not fully initialized');
    }

    console.log('鉁?API repositories initialized successfully');
    return provider;
  } catch (error) {
    console.error('鉂?Failed to initialize API repositories:', error);
    throw error;
  }
}

/**
 * 娓呯悊 API Repository灞?
 *
 * @param provider 鎻愪緵鑰呭疄渚?
 */
export async function cleanupApiRepositories(provider: IProviderInitializer): Promise<void> {
  console.log('馃Ч Cleaning up API repositories...');
  
  try {
    await provider.cleanup();
    (RepositoryContainer.getInstance() as any).reset?.();
    console.log('鉁?API repositories cleaned up');
  } catch (error) {
    console.error('鉂?Error during cleanup:', error);
  }
}

/**
 * 妫€鏌?API Repository鍋ュ悍鐘舵€?
 */
export async function healthCheckApiRepositories(): Promise<boolean> {
  const container = RepositoryContainer.getInstance();
  
  try {
    if (!(container as any).isInitialized?.()) {
      console.warn('鈿狅笍  Repositories not initialized');
      return false;
    }

    // 绠€鍗曞仴搴锋鏌ワ細灏濊瘯璁块棶涓€涓粨鍌?
    const repoRepo = container.getRepositoryRepository();
    console.log('鉁?API repositories health check passed');
    return true;
  } catch (error) {
    console.error('鉂?API repositories health check failed:', error);
    return false;
  }
}
