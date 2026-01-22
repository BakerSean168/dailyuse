/**
 * Authentication Container (Server)
 *
 * 依赖注入容器，管�?Authentication 模块�?repository 实例
 */

import type { 
  IAuthCredentialRepository, 
  IAuthSessionRepository 
} from '@dailyuse/domain-server/authentication';

/**
 * Authentication 模块依赖注入容器
 */
export class AuthContainer {
  private static instance: AuthContainer;
  private credentialRepository: IAuthCredentialRepository | null = null;
  private sessionRepository: IAuthSessionRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    AuthContainer.instance = new AuthContainer();
  }

  /**
   * 注册 CredentialRepository
   */
  registerCredentialRepository(repository: IAuthCredentialRepository): this {
    this.credentialRepository = repository;
    return this;
  }

  /**
   * 注册 SessionRepository
   */
  registerSessionRepository(repository: IAuthSessionRepository): this {
    this.sessionRepository = repository;
    return this;
  }

  /**
   * 获取 CredentialRepository
   */
  getCredentialRepository(): IAuthCredentialRepository {
    if (!this.credentialRepository) {
      throw new Error('CredentialRepository not registered. Call registerCredentialRepository first.');
    }
    return this.credentialRepository;
  }

  /**
   * 获取 SessionRepository
   */
  getSessionRepository(): IAuthSessionRepository {
    if (!this.sessionRepository) {
      throw new Error('SessionRepository not registered. Call registerSessionRepository first.');
    }
    return this.sessionRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.credentialRepository !== null && this.sessionRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.credentialRepository = null;
    this.sessionRepository = null;
  }
}
